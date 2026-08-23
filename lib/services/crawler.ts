import { HotspotItem } from '@/types';

function cleanSearchText(value: string = ''): string {
  let text = value || '';
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<[^>]+>/g, ' ');
  // decode common html entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  return text.replace(/\s+/g, ' ').trim();
}

function hostToSource(url: string, fallback: string = '全网搜索'): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^(www\.|m\.)/, '');
    const known: Record<string, string> = {
      'baidu.com': '百度',
      'bing.com': 'Bing',
      'weibo.com': '微博',
      'douyin.com': '抖音',
      'xiaohongshu.com': '小红书',
      'bilibili.com': 'B站',
      'thepaper.cn': '澎湃新闻',
      '36kr.com': '36氪',
      'qq.com': '腾讯网',
      'sina.com.cn': '新浪',
      'sohu.com': '搜狐',
      '163.com': '网易',
      'toutiao.com': '今日头条',
      'zhihu.com': '知乎',
    };
    for (const [k, v] of Object.entries(known)) {
      if (host.includes(k)) return v;
    }
    return host || fallback;
  } catch {
    return fallback;
  }
}

function getRandomRecentDate(): string {
  const hours = Math.floor(Math.random() * 168) + 1;
  if (hours < 24) {
    return `${hours}小时前`;
  }
  return `${Math.floor(hours / 24)}天前`;
}

export async function fetchLiveWebSearch(query: string, count: number = 10): Promise<HotspotItem[]> {
  const results: HotspotItem[] = [];
  const seenTitles = new Set<string>();
  const seenSnippets = new Set<string>();

  const appendResult = (title: string, snippet: string = '', source: string = '', url: string = '#') => {
    const cleanTitle = cleanSearchText(title);
    const cleanSnippet = cleanSearchText(snippet);
    if (!cleanTitle || cleanTitle.length < 4) return;

    const titleKey = cleanTitle.toLowerCase().replace(/\s+/g, '').slice(0, 80);
    const snippetKey = cleanSnippet.toLowerCase().replace(/\s+/g, '').slice(0, 120);

    if (seenTitles.has(titleKey)) return;
    if (snippetKey && seenSnippets.has(snippetKey)) return;

    seenTitles.add(titleKey);
    if (snippetKey) seenSnippets.add(snippetKey);

    const finalSource = source || hostToSource(url);
    const hotness = Math.round((Math.random() * (98 - 75) + 75) * 10) / 10;

    results.push({
      title: cleanTitle.slice(0, 120),
      summary: cleanSnippet.slice(0, 240) || cleanTitle,
      cat: 'trend',
      hotness,
      source: finalSource,
      url: url || '#',
      date: getRandomRecentDate(),
    });
  };

  // 1. Bing News Search
  try {
    const bingUrl = `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&form=QBNH&setmkt=zh-CN&setlang=zh-CN`;
    const res = await fetch(bingUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const html = await res.text();
      const cardMatches = [...html.matchAll(/<div[^>]+class="[^"]*news-card[^"]*"[\s\S]*?<\/div>\s*<\/div>/gi)];
      for (const m of cardMatches.slice(0, count * 2)) {
        const card = m[0];
        const aMatch = card.match(/<a[^>]*class="title"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
        if (!aMatch) continue;
        const url = aMatch[1];
        const title = aMatch[2];
        const snMatch = card.match(/<div[^>]*class="[^"]*snippet[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        const srcMatch = card.match(/<span[^>]*class="[^"]*(?:source|provider)[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
        const snippet = snMatch ? snMatch[1] : '';
        const source = srcMatch ? cleanSearchText(srcMatch[1]) : hostToSource(url, 'Bing新闻');
        appendResult(title, snippet, source, url);
      }
    }
  } catch (err) {
    console.error('[WebSearch] Bing news error:', err);
  }

  // 2. Bing Web Search (Fallback)
  if (results.length < 3) {
    try {
      const webUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}&setmkt=zh-CN&setlang=zh-CN`;
      const res = await fetch(webUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'zh-CN,zh;q=0.9',
        },
      });
      if (res.ok) {
        const html = await res.text();
        const items = [...html.matchAll(/<li class="b_algo"[\s\S]*?<\/li>/gi)];
        for (const itemMatch of items.slice(0, count * 2)) {
          const item = itemMatch[0];
          const hMatch = item.match(/<h2[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h2>/i);
          if (!hMatch) continue;
          const url = hMatch[1];
          const title = hMatch[2];
          const pMatch = item.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
          const snippet = pMatch ? pMatch[1] : '';
          appendResult(title, snippet, hostToSource(url, 'Bing'), url);
        }
      }
    } catch (err) {
      console.error('[WebSearch] Bing web error:', err);
    }
  }

  // 3. Baidu Mobile Search (Fallback)
  if (results.length < 3) {
    try {
      const bdUrl = `https://m.baidu.com/s?word=${encodeURIComponent(query)}`;
      const res = await fetch(bdUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
          'Accept-Language': 'zh-CN,zh;q=0.9',
        },
      });
      if (res.ok) {
        const html = await res.text();
        const entries = [...html.matchAll(/<article[^>]*class="c-result"[^>]*>([\s\S]*?)<\/article>/gi)];
        for (const entryMatch of entries.slice(0, 6)) {
          const entry = entryMatch[1];
          const titleMatch = entry.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
          if (titleMatch) {
            const title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
            let desc = '';
            const descMatch = entry.match(/<span[^>]*class="c-text"[^>]*>([\s\S]*?)<\/span>/i);
            if (descMatch) desc = descMatch[1].replace(/<[^>]+>/g, '').trim();
            const linkMatch = entry.match(/<a[^>]+href="([^"]+)"/i);
            const url = linkMatch ? linkMatch[1] : '#';
            const srcMatch = entry.match(/<span[^>]*class="[^"]*(?:c-color-gray|c-source)[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
            const source = srcMatch ? cleanSearchText(srcMatch[1]) : '百度';
            appendResult(title, desc, source, url);
          }
        }
      }
    } catch (err) {
      console.error('[WebSearch] Baidu error:', err);
    }
  }

  return results.slice(0, count);
}
