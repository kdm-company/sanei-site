// sanei-barrel.jp の配信。静的ファイルは env.ASSETS に任せ、次の3つだけここで処理する。
// 1) 公開しないパスを 404 にする  2) www 付きを本体へ 301  3) note の新着記事を JSON で返す
const BLOCK = [/^\/\.git(\/|$)/, /^\/\.github(\/|$)/, /^\/\.wrangler(\/|$)/, /^\/scripts(\/|$)/, /^\/wrangler\.jsonc?$/, /^\/_worker\.js$/, /^\/\.(gitignore|assetsignore)$/, /\.md$/i, /^\/%E5%B7%AE%E3%81%97%E6%9B%BF%E3%81%88/i];
const HOST = 'sanei-barrel.jp';
const NOTE_RSS = 'https://note.com/sanei_barrel/rss';
const FEED_PATH = '/assets/note-feed.json';
const FEED_TTL = 3600; // 1時間キャッシュ

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.hostname === 'www.' + HOST) {
      url.hostname = HOST;
      return Response.redirect(url.toString(), 301);
    }
    if (BLOCK.some((re) => re.test(url.pathname))) return new Response('Not Found', { status: 404 });
    if (url.pathname === FEED_PATH) return noteFeed(request, env, ctx);
    return env.ASSETS.fetch(request);
  },
};

async function noteFeed(request, env, ctx) {
  const cache = caches.default;
  const key = new Request(new URL(FEED_PATH, request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;
  let items;
  try {
    const res = await fetch(NOTE_RSS, { headers: { 'User-Agent': 'sanei-barrel.jp feed' }, cf: { cacheTtl: FEED_TTL } });
    if (!res.ok) throw new Error('note ' + res.status);
    items = parseRss(await res.text()).slice(0, 3);
  } catch (e) {
    // note に届かないときは、リポジトリに置いた控えの JSON を返す（キャッシュしない）
    return env.ASSETS.fetch(new Request(new URL(FEED_PATH, request.url), request));
  }
  const out = new Response(JSON.stringify({ items }), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': `public, max-age=${FEED_TTL}` },
  });
  ctx.waitUntil(cache.put(key, out.clone()));
  return out;
}

function parseRss(xml) {
  const items = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const block = m[1];
    const tag = (name) => {
      const t = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
      return t ? decode(t[1].replace(/^<!\[CDATA\[|\]\]>$/g, '').trim()) : '';
    };
    const link = tag('link');
    if (!link.startsWith('https://note.com/')) continue;
    let image = tag('media:thumbnail');
    if (!image) {
      const img = tag('description').match(/<img[^>]+src="([^"]+)"/);
      image = img ? img[1] : '';
    }
    const d = new Date(tag('pubDate'));
    const date = isNaN(d) ? '' : new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d).replace(/\//g, '.');
    items.push({ title: tag('title'), link, date, image: image.startsWith('https://') ? image : '' });
  }
  return items;
}

function decode(s) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
}
