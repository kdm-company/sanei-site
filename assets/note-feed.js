(() => {
  'use strict';
  const list = document.querySelector('[data-note-feed]');
  if (!list) return;
  const empty = document.querySelector('[data-note-empty]');
  fetch(list.dataset.noteFeed, { cache: 'no-cache' })
    .then(res => (res.ok ? res.json() : { items: [] }))
    .catch(() => ({ items: [] }))
    .then(({ items = [] }) => {
      if (!items.length) { empty.hidden = false; return; }
      for (const item of items) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = item.link; a.target = '_blank'; a.rel = 'noopener'; a.className = 'noteCard';
        const fig = document.createElement('span'); fig.className = 'noteThumb';
        if (item.image) {
          const img = document.createElement('img');
          img.src = item.image; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
          fig.append(img);
        }
        const date = document.createElement('time'); date.textContent = item.date || '';
        const title = document.createElement('strong'); title.textContent = item.title;
        a.append(fig, date, title);
        li.append(a);
        list.append(li);
      }
      list.hidden = false;
    });
})();
