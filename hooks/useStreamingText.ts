'use client';

import { useState, useRef, useCallback } from 'react';

/**
 * 流式文本生成 Hook
 * - 调用 /api/ai/text/stream (SSE)
 * - onDelta 逐段回调（打字机渲染）
 * - 返回完整文本 + loading/abort 控制
 */
export function useStreamingText() {
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string>('');
  const abortRef = useRef<AbortController | null>(null);

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  /**
   * 开始流式请求
   * @returns 完整拼接后的文本
   */
  const streamText = useCallback(
    async (params: {
      modelId: string;
      systemPrompt?: string;
      userPrompt: string;
      customModels?: unknown[];
      onDelta?: (fullText: string, delta: string) => void;
    }): Promise<string> => {
      // Abort previous stream if still running
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsStreaming(true);
      setStreamError('');

      let full = '';
      try {
        const res = await fetch('/api/ai/text/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modelId: params.modelId,
            systemPrompt: params.systemPrompt,
            userPrompt: params.userPrompt,
            customModels: params.customModels,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          let msg = `流式请求失败 (${res.status})`;
          try {
            const errData = await res.json();
            if (errData.error) msg = errData.error;
          } catch { /* ignore */ }
          throw new Error(msg);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const dataStr = trimmed.slice(5).trim();
            if (!dataStr) continue;
            if (dataStr === '[DONE]') continue;

            try {
              const json = JSON.parse(dataStr);
              if (json.error) throw new Error(json.error);
              if (json.delta) {
                full += json.delta;
                params.onDelta?.(full, json.delta);
              }
            } catch (e: any) {
              if (e.message && e.message !== 'Unexpected end of JSON input') {
                throw e;
              }
            }
          }
        }

        return full;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return full; // user stopped — return partial text
        }
        setStreamError(err.message || '流式生成失败');
        throw err;
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    []
  );

  return { streamText, stopStream, isStreaming, streamError };
}
