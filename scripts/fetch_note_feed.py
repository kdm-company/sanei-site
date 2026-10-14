"""Fetch the latest note articles and write them to assets/note-feed.json for the home page."""
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from pathlib import Path

FEED_URL = 'https://note.com/sanei_barrel/rss'
OUT = Path(__file__).resolve().parent.parent / 'assets' / 'note-feed.json'
LIMIT = 3
NS = {'media': 'http://search.yahoo.com/mrss/'}


def text(item, tag):
    el = item.find(tag, NS)
    return (el.text or '').strip() if el is not None else ''


def main():
    req = urllib.request.Request(FEED_URL, headers={'User-Agent': 'sanei-site-feed/1.0'})
    with urllib.request.urlopen(req, timeout=20) as res:
        root = ET.fromstring(res.read())
    items = []
    for item in list(root.iterfind('./channel/item'))[:LIMIT]:
        thumb = item.find('media:thumbnail', NS)
        image = (thumb.text or thumb.get('url') or '').strip() if thumb is not None else ''
        if not image:
            m = re.search(r'<img[^>]+src="([^"]+)"', text(item, 'description'))
            image = m.group(1) if m else ''
        date = ''
        if text(item, 'pubDate'):
            try:
                date = parsedate_to_datetime(text(item, 'pubDate')).strftime('%Y.%m.%d')
            except (TypeError, ValueError):
                pass
        link = text(item, 'link')
        if link.startswith('https://note.com/'):
            items.append({'title': text(item, 'title'), 'link': link, 'date': date, 'image': image})
    OUT.write_text(json.dumps({'items': items}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(f'wrote {len(items)} items to {OUT}')


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:  # keep the last published feed if note is unreachable
        print(f'note feed fetch failed: {exc}', file=sys.stderr)
