import { NextRequest } from 'next/server';
import { getModelConfig, resolveChatUrl } from '@/lib/services/ai-clients';
import { AIModelConfig } from '@/types';
import { checkAIRateLimit } from '@/lib/middleware';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

/**
 * 流式文本生成 (SSE)
 * - 上游 OpenAI 兼容接口 stream:true，逐 chunk 转发给前端
 * - Anthropic 协议同样支持 stream
 * - 前端用 ReadableStream reader 逐段渲染打字机效果
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkAIRateLimit(ip)) {
    return new Response(JSON.stringify({ error: '请求过于频繁' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: '请求体格式错误' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { modelId = 'minimax-text', systemPrompt, userPrompt, customModels } = body || {};
    if (!userPrompt || typeof userPrompt !== 'string' || !userPrompt.trim()) {
      return new Response(JSON.stringify({ error: 'userPrompt 不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (userPrompt.length > 8000) {
      return new Response(JSON.stringify({ error: '提示词过长' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const model = getModelConfig(modelId, customModels, 'text');
    const isAnthropic =
      model.id === 'minimax-text' || model.protocol?.includes('Anthropic');

    // Build upstream request
    let url: string;
    let headers: Record<string, string>;
    let payload: Record<string, any>;

    if (isAnthropic) {
      url = model.baseUrl;
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': model.apiKey,
        'anthropic-version': '2023-06-01',
      };
      payload = {
        model: model.modelName || 'minimax-text-01',
        max_tokens: 4096,
        stream: true,
        messages: [{ role: 'user', content: userPrompt.trim() }],
      };
      if (systemPrompt) payload.system = systemPrompt;
    } else {
      url = resolveChatUrl(model.baseUrl);
      headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${model.apiKey}`,
      };
      const messages: any[] = [];
      if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
      messages.push({ role: 'user', content: userPrompt.trim() });
      payload = {
        model:
          model.modelName ||
          (model.id === 'ark-text' ? 'ark-code-latest' : model.name || 'gpt-3.5-turbo'),
        messages,
        temperature: 0.7,
        stream: true,
      };
    }

    const upstream = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => '');
      return new Response(
        JSON.stringify({ error: `${model.name} API 错误 (${upstream.status}): ${errText.slice(0, 300)}` }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse upstream SSE and re-emit normalized SSE to the client
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = upstream.body.getReader();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            // Split into SSE lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // keep incomplete last line in buffer

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;
              const dataStr = trimmed.slice(5).trim();
              if (!dataStr || dataStr === '[DONE]') continue;

              try {
                const json = JSON.parse(dataStr);

                // Anthropic format: content_block_delta → delta.text
                let textDelta = '';
                if (json.type === 'content_block_delta' && json.delta?.text) {
                  textDelta = json.delta.text;
                }
                // OpenAI format: choices[0].delta.content
                else if (json.choices?.[0]?.delta?.content) {
                  textDelta = json.choices[0].delta.content;
                }

                if (textDelta) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: textDelta })}\n\n`));
                }
              } catch { /* skip malformed chunk */ }
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err: any) {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: err.message || '流中断' })}\n\n`)
            );
            controller.close();
          } catch { /* already closed */ }
        }
      },
      cancel() {
        reader.cancel().catch(() => {});
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err: any) {
    console.error('[API /api/ai/text/stream] Error:', err);
    return new Response(JSON.stringify({ error: err.message || '流式生成失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
