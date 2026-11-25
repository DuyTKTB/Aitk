/* ============================================================
   api/youtube-search.js — Tìm kiếm nhạc & video YouTube trực tiếp (InnerTube + Fallback)
   - Không cần YouTube API Key (không giới hạn quota hằng ngày)
   - Dùng YouTube InnerTube JSON API (siêu nhanh ~300ms, 100% JSON chuẩn)
   - Fallback sang YouTube HTML search nếu cần
   - Hỗ trợ dán link trực tiếp (youtube.com, youtu.be, shorts, music.youtube.com)
   - Cache RAM toàn cục 15 phút
   ============================================================ */

const CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;

if (!globalThis.__elecYtSearchCache) {
  globalThis.__elecYtSearchCache = new Map();
}
const searchCache = globalThis.__elecYtSearchCache;

function extractYouTubeId(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  const m = s.match(
    /(?:youtube\.com\/watch\?.*?\bv=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|music\.youtube\.com\/watch\?.*?\bv=)([a-zA-Z0-9_-]{11})/i
  );
  return m && m[1] ? m[1] : null;
}

function setCache(key, value) {
  if (searchCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = searchCache.keys().next().value;
    if (oldestKey) searchCache.delete(oldestKey);
  }
  searchCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

function getCache(key) {
  const hit = searchCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    searchCache.delete(key);
    return null;
  }
  return hit.value;
}

async function fetchDirectVideoMeta(videoId) {
  const fallback = {
    videoId,
    title: `Video YouTube (${videoId})`,
    channel: 'YouTube',
    duration: '',
    views: '',
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    isLive: false,
  };
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`;
    const r = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      },
    });
    if (!r.ok) return fallback;
    const data = await r.json();
    return {
      videoId,
      title: data.title || fallback.title,
      channel: data.author_name || 'YouTube',
      duration: '',
      views: '',
      thumbnail: data.thumbnail_url || fallback.thumbnail,
      isLive: false,
    };
  } catch {
    return fallback;
  }
}

function parseVideoRenderers(data, limit = 14) {
  const sections =
    data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];

  const results = [];
  const seen = new Set();

  for (const sec of sections) {
    const items = sec?.itemSectionRenderer?.contents || [];
    for (const item of items) {
      const v = item?.videoRenderer;
      if (!v || !v.videoId || seen.has(v.videoId)) continue;
      seen.add(v.videoId);

      const title =
        (v.title?.runs || []).map((r) => r.text).join('') ||
        v.title?.simpleText ||
        '';
      if (!title) continue;

      const channel =
        (v.ownerText?.runs || []).map((r) => r.text).join('') ||
        (v.longBylineText?.runs || []).map((r) => r.text).join('') ||
        'YouTube';

      const isLive =
        !v.lengthText &&
        (v.badges || []).some((b) => /LIVE|TRỰC TIẾP/i.test(JSON.stringify(b)));

      const duration = v.lengthText?.simpleText || (isLive ? 'LIVE' : '');
      const views =
        v.shortViewCountText?.simpleText ||
        v.viewCountText?.simpleText ||
        '';

      results.push({
        videoId: v.videoId,
        title,
        channel,
        duration,
        views,
        thumbnail: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
        isLive,
      });

      if (results.length >= limit) break;
    }
    if (results.length >= limit) break;
  }

  return results;
}

async function fetchInnerTubeSearch(query, limit = 14) {
  const res = await fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
      Origin: 'https://www.youtube.com',
      Referer: 'https://www.youtube.com/',
    },
    body: JSON.stringify({
      context: {
        client: {
          clientName: 'WEB',
          clientVersion: '2.20240726.00.00',
          hl: 'vi',
          gl: 'VN',
        },
      },
      query,
      params: 'EgIQAQ%3D%3D',
    }),
  });
  if (!res.ok) throw new Error(`InnerTube HTTP ${res.status}`);
  const json = await res.json();
  return parseVideoRenderers(json, limit);
}

async function fetchHtmlSearch(query, limit = 14) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  });
  if (!res.ok) throw new Error(`YouTube HTTP ${res.status}`);
  const html = await res.text();
  const match = html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/);
  if (!match) throw new Error('Không phân tích được dữ liệu YouTube');
  return parseVideoRenderers(JSON.parse(match[1]), limit);
}

export default async function handler(req, res) {
  if (typeof res.setHeader === 'function') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  try {
    let rawQ = req.query?.q;
    if (!rawQ && req.url) {
      const parsed = new URL(req.url, 'http://localhost');
      rawQ = parsed.searchParams.get('q') || '';
    }
    const query = String(rawQ || '').trim();
    if (!query) {
      return res.status(200).json({ ok: true, results: [] });
    }

    const cacheKey = query.toLowerCase();
    const cached = getCache(cacheKey);
    if (cached && cached.length > 0) {
      return res.status(200).json({ ok: true, results: cached, cached: true });
    }

    // Dán trực tiếp link YouTube hoặc Video ID
    const directId = extractYouTubeId(query);
    if (directId && (query.includes('youtu') || query.length === 11)) {
      const meta = await fetchDirectVideoMeta(directId);
      const list = [meta];
      setCache(cacheKey, list);
      return res.status(200).json({ ok: true, results: list, direct: true });
    }

    let results = [];
    try {
      results = await fetchInnerTubeSearch(query, 14);
    } catch {
      results = [];
    }

    if (!results.length) {
      results = await fetchHtmlSearch(query, 14);
    }

    if (results.length > 0) {
      setCache(cacheKey, results);
    }

    return res.status(200).json({ ok: results.length > 0, results });
  } catch (err) {
    return res.status(200).json({
      ok: false,
      results: [],
      error: err?.message || 'Không thể tìm kiếm YouTube lúc này',
    });
  }
}
