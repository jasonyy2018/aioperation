import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export function safeJsonParse<T>(jsonStr: string, fallback: T): T {
  if (!jsonStr || typeof jsonStr !== 'string') return fallback;
  try {
    return JSON.parse(jsonStr);
  } catch {
    return extractJsonFromAIResponse(jsonStr, fallback);
  }
}

/**
 * Robust JSON extractor from LLM responses:
 * Handles markdown code blocks, conversational prefixes, trailing commas, and unescaped characters.
 */
export function extractJsonFromAIResponse<T>(text: string, fallback: T): T {
  if (!text || typeof text !== 'string') return fallback;
  let raw = text.trim();

  // 1. Strip markdown code block markers ```json ... ```
  if (raw.includes('```')) {
    const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
      raw = codeBlockMatch[1].trim();
    }
  }

  // 2. Extract substring between outermost { ... } or [ ... ]
  const firstBrace = raw.indexOf('{');
  const firstBracket = raw.indexOf('[');

  let startIdx = -1;
  let endIdx = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endIdx = raw.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endIdx = raw.lastIndexOf(']');
  }

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    raw = raw.substring(startIdx, endIdx + 1);
  }

  // 3. Try standard parse first
  try {
    return JSON.parse(raw);
  } catch {
    // 4. Try cleaning common JSON syntax flaws:
    // Remove trailing commas before closing braces/brackets
    let cleaned = raw.replace(/,\s*([\]}])/g, '$1');

    // Remove control characters (except newline, return, tab)
    cleaned = cleaned.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

    try {
      return JSON.parse(cleaned);
    } catch {
      // 5. Try repairing unescaped newlines in JSON strings
      try {
        const repaired = cleaned.replace(/"([^"]*)"/g, (_, inner) => {
          return '"' + inner.replace(/\r?\n/g, '\\n').replace(/\t/g, '\\t') + '"';
        });
        return JSON.parse(repaired);
      } catch {
        return fallback;
      }
    }
  }
}
