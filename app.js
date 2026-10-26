/* ==========================================================
   Date Decider — app logic
   ========================================================== */
(() => {
  'use strict';

  /* ---------------- SETTINGS (edit these) ---------------- */
  const CONFIG = {
    // Where submitted date ideas get sent for review (a GitHub Issue on your repo).
    // Put your real GitHub username and repository name here:
    githubUser: 'ziadhamza302-dev',
    githubRepo: 'icolaandzuzu',

    // The two birthdays that open the lock (day-month-year).
    birthdays: ['28-3-2006', '10-1-2007'],

    // The countdown start: 29-7-2025  (JavaScript months start at 0, so July = 6)
    togetherSince: new Date(2025, 6, 29, 0, 0, 0),
  };

  /* The 10 memory pages, in the order of the design.
     label = text on the button, slug = file name in assets/, shift = tiny offset the design has on the title */
  const MEMORIES = [
    { label: 'Amr Diab Concert',  slug: 'amr-diab',    title: 'Amr Diab',    shift: -11  },
    { label: 'Anniversary',       slug: 'anniversary', title: 'Anniversary', shift: -11  },
    { label: 'valentine',         slug: 'valentine',   title: 'Valentine',   shift: 0    },
    { label: 'Birthday',          slug: 'birthday',    title: 'Birthday',    shift: 0    },
    { label: 'Disco Masr',        slug: 'disco-masr',  title: 'Disco Masr',  shift: 0    },
    { label: 'Cairokee x TUL8TE', slug: 'cairokee',    title: 'Cairokee',    shift: 0    },
    { label: 'New Years Eve',     slug: 'new-year',    title: 'New Year',    shift: 0    },
    { label: 'Doctor',            slug: 'doctor',      title: 'Doctor',      shift: 0    },
    { label: 'the hub',           slug: 'the-hub',     title: 'The Hub',     shift: -7   },
    { label: 'HOME',              slug: 'home',        title: 'Home',        shift: -6.5 },
  ];

  /* ---------------- small helpers ---------------- */
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const store = {
    get(area, k) { try { return window[area].getItem(k); } catch (_) { return null; } },
    set(area, k, v) { try { window[area].setItem(k, v); return true; } catch (_) { return false; } },
  };

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('on'), 4200);
  }

  /* ---------------- 1 · LOCK ---------------- */
  // Accept "28-3-2006", "28/03/2006", "28.3.2006", "2832006" ... only the digits matter.
  const VALID = new Set();
  CONFIG.birthdays.forEach(b => {
    const [d, m, y] = b.split('-').map(Number);
    VALID.add(`${d}${m}${y}`);
    VALID.add(`${String(d).padStart(2, '0')}${String(m).padStart(2, '0')}${y}`);
  });
  const digitsOf = v => v.replace(/\D/g, '');
  const unlocked = () => store.get('sessionStorage', 'dd-unlocked') === '1';

  const lockForm = $('#lockForm');
  const dateInput = $('#dateInput');
  const lockMsg = $('#lockMsg');

  function tryUnlock(auto) {
    const digits = digitsOf(dateInput.value);
    if (VALID.has(digits)) {
      store.set('sessionStorage', 'dd-unlocked', '1');
      lockMsg.textContent = '';
      dateInput.value = '';
      if (!location.hash || location.hash === '#/lock') location.hash = '#/';
      route();
      return;
    }
    // while typing, only complain once a full date has been typed (like 5-12-2001 or 05122001)
    const looksComplete = /^\d{1,2}\D+\d{1,2}\D+\d{4}$/.test(dateInput.value.trim()) || digits.length >= 8;
    if (auto && !looksComplete) return;
    if (!digits.length) return;
    lockMsg.textContent = "That's not it, try again";
    lockForm.classList.remove('shake'); void lockForm.offsetWidth; lockForm.classList.add('shake');
  }
  dateInput.addEventListener('input', () => { lockMsg.textContent = ''; tryUnlock(true); });
  lockForm.addEventListener('submit', e => { e.preventDefault(); tryUnlock(false); });

  /* ---------------- 2 · COUNTDOWN ---------------- */
  function elapsed(from, to) {
    if (to < from) return { y: 0, mo: 0, d: 0, h: 0, mi: 0, s: 0 };
    let y = to.getFullYear() - from.getFullYear();
    let mo = to.getMonth() - from.getMonth();
    let d = to.getDate() - from.getDate();
    let h = to.getHours() - from.getHours();
    let mi = to.getMinutes() - from.getMinutes();
    let s = to.getSeconds() - from.getSeconds();
    if (s < 0)  { s += 60; mi--; }
    if (mi < 0) { mi += 60; h--; }
    if (h < 0)  { h += 24; d--; }
    if (d < 0)  { d += new Date(to.getFullYear(), to.getMonth(), 0).getDate(); mo--; }
    if (mo < 0) { mo += 12; y--; }
    return { y, mo, d, h, mi, s };
  }
  const pad3 = n => String(n).padStart(3, '0');
  function tick() {
    const t = elapsed(CONFIG.togetherSince, new Date());
    $('#c-y').textContent  = pad3(t.y);
    $('#c-mo').textContent = pad3(t.mo);
    $('#c-d').textContent  = pad3(t.d);
    $('#c-h').textContent  = pad3(t.h);
    $('#c-mi').textContent = pad3(t.mi);
    $('#c-s').textContent  = pad3(t.s);
  }
  let timer = null;
  function startTimer() { tick(); if (!timer) timer = setInterval(tick, 1000); }
  function stopTimer()  { clearInterval(timer); timer = null; }

  /* ---------------- 3 · INSERT DATE IDEA ---------------- */
  const LS_KEY = 'dd-ideas';
  function readLocal() {
    try {
      const a = JSON.parse(store.get('localStorage', LS_KEY) || '[]');
      return Array.isArray(a) ? a : [];
    } catch (_) { return []; }
  }
  function saveLocal(idea) {
    const all = readLocal(); all.push(idea);
    return store.set('localStorage', LS_KEY, JSON.stringify(all));
  }
  function issueUrl(idea) {
    const { githubUser: u, githubRepo: r } = CONFIG;
    if (!u || !r || /YOUR-/i.test(u + r)) return null;
    const snippet = JSON.stringify(
      { name: idea.name, description: idea.description, location: idea.location }, null, 2);
    const body =
      `**Date name:** ${idea.name}\n\n` +
      `**Description:** ${idea.description || '-'}\n\n` +
      `**Location:** ${idea.location || '-'}\n\n` +
      `---\nTo approve, paste this into \`ideas.js\`:\n\n\`\`\`json\n${snippet},\n\`\`\`\n`;
    return `https://github.com/${encodeURIComponent(u)}/${encodeURIComponent(r)}/issues/new` +
           `?title=${encodeURIComponent('Date idea: ' + idea.name)}&body=${encodeURIComponent(body)}`;
  }

  $('#ideaForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#ideaName').value.trim();
    const description = $('#ideaDesc').value.trim();
    const location_ = $('#ideaLoc').value.trim();
    if (!name) { toast('Give the date a name first'); $('#ideaName').focus(); return; }

    const idea = { name, description, location: location_, added: Date.now() };
    const saved = saveLocal(idea);
    const url = issueUrl(idea);
    if (url) {
      window.open(url, '_blank', 'noopener');
      toast('Almost there: press “Submit new issue” on GitHub to send it');
    } else {
      toast(saved ? 'Saved! 💗' : 'Could not save on this device');
    }
    e.target.reset();
  });

  /* ---------------- 4 · RANDOM DATE ---------------- */
  const keyOf = i => `${i.name}|${i.description}`.toLowerCase();
  function allIdeas() {
    const approved = Array.isArray(window.APPROVED_IDEAS) ? window.APPROVED_IDEAS : [];
    const seen = new Set(), out = [];
    [...approved, ...readLocal()].forEach(i => {
      if (!i || !i.name) return;
      const k = keyOf(i);
      if (!seen.has(k)) { seen.add(k); out.push(i); }
    });
    return out;
  }
  function mapsUrl(loc) {
    const t = (loc || '').trim();
    if (!t) return null;
    if (/^https?:\/\//i.test(t)) return t;
    if (/^(www\.)?(google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(t)) return 'https://' + t;
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(t);
  }
  let lastKey = null;
  function showRandom() {
    const list = allIdeas();
    const nameEl = $('#rName'), descEl = $('#rDesc span'), locEl = $('#rLoc');
    if (!list.length) {
      nameEl.textContent = 'No dates yet';
      descEl.textContent = 'Add one with “Insert Date Idea”';
      locEl.textContent = '';
      locEl.removeAttribute('href');
      return;
    }
    const pool = list.length > 1 ? list.filter(i => keyOf(i) !== lastKey) : list;
    const idea = pool[Math.floor(Math.random() * pool.length)];
    lastKey = keyOf(idea);
    nameEl.textContent = idea.name;
    nameEl.title = idea.name;
    descEl.textContent = idea.description || '';
    const url = mapsUrl(idea.location);
    locEl.textContent = idea.location || '';
    if (url) locEl.setAttribute('href', url); else locEl.removeAttribute('href');
  }
  $('#again').addEventListener('click', e => {
    showRandom();
    const b = e.currentTarget; b.classList.remove('beat'); void b.offsetWidth; b.classList.add('beat');
  });

  /* ---------------- 5/6 · MEMORIES ---------------- */
  const memList = $('#memList');
  MEMORIES.forEach(m => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#/memory/${m.slug}`;
    a.textContent = m.label;
    li.appendChild(a);
    memList.appendChild(li);
  });
  function showMemory(slug) {
    const m = MEMORIES.find(x => x.slug === slug);
    if (!m) { location.hash = '#/memories'; return false; }
    const t = $('#memTitle');
    t.src = `assets/titles/${m.slug}.png`;
    t.alt = m.title;
    t.style.transform = m.shift ? `translateX(${m.shift / 16}rem)` : '';
    const p = $('#memPhoto');
    p.src = `assets/memories/${m.slug}.png`;
    p.alt = `Photo from ${m.title}`;
    return true;
  }

  /* ---------------- ROUTER ---------------- */
  function show(name) {
    $$('.view').forEach(v => v.classList.toggle('active', v.dataset.view === name));
    name === 'home' ? startTimer() : stopTimer();
    window.scrollTo(0, 0);
    if (name === 'lock') setTimeout(() => dateInput.focus({ preventScroll: true }), 50);
  }
  function route() {
    if (!unlocked()) { show('lock'); return; }
    const [page, arg] = location.hash.replace(/^#\/?/, '').split('/');
    switch (page) {
      case 'idea':     show('idea'); break;
      case 'random':   showRandom(); show('random'); break;
      case 'memories': show('memories'); break;
      case 'memory':   if (showMemory(arg)) show('memory'); break;
      default:         show('home');
    }
  }
  window.addEventListener('hashchange', route);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && timer) tick(); });
  route();
})();
