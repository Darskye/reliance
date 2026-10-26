// messenger.js: ISEA Messenger, the crew's chat program (laid out like a 2000s instant messenger).
// Logged on as a crew member you see your own contacts and conversations, and you can type:
// the others answer (Reznov is always Away; Talos answers like TALOS.EXE). Visitors read the
// archived conversations instead, and can only chat with Talos.
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const OS = window.OS, S = OS.Sound, H = window.AppHooks;

  // ---------------------------------------------------------------- who's on the network
  const PEOPLE = {
    reznov: { name: 'Roman Reznov', short: 'Reznov', status: 'away', psm: '', pic: 'insignia', group: 'Helios crew' },
    gray: { name: 'Dr. Catherine Gray', short: 'Gray', status: 'busy', psm: 'IC-0417 · do not disturb', pic: 'photo', group: 'Helios crew' },
    winchester: { name: 'John Winchester', short: 'Winchester', status: 'online', psm: '♫ Mixtape Vol. 1 - Helios (main drive at 98%)', pic: 'pad', group: 'Helios crew' },
    kim: { name: 'Kim Seo-yeon', short: 'Kim', status: 'online', psm: 'build 1.0.4 ✓ (all of it)', pic: 'coder', group: 'Talos program' },
    talos: { name: 'Talos', short: 'Talos', status: 'online', psm: 'Always here.', pic: 'talos', group: 'Talos program' },
  };
  const STATUS = { online: 'Online', away: 'Away', busy: 'Busy', offline: 'Offline' };

  // ---------------------------------------------------------------- the conversations ('!nudge' = a nudge)
  const THREADS = [
    { id: 'crew', with: ['reznov', 'gray', 'winchester'], name: 'Helios crew', started: '23:58', msgs: [
      ['reznov', 'Briefing 0700. Do not be late.'],
      ['winchester', 'define late'],
      ['reznov', '0659 is late.'],
      ['gray', 'Understood, Commander.'],
      ['winchester', 'understood commander'],
      ['winchester', '(0700 is in seven hours btw. go to sleep everyone :P)'],
      ['reznov', 'Winchester.'],
      ['winchester', 'going'],
    ] },
    { id: 'gray-winchester', with: ['gray', 'winchester'], started: '00:41', msgs: [
      ['winchester', 'are you still in the lab'],
      ['gray', 'No.'],
      ['winchester', 'the lab camera says you\'re in the lab'],
      ['gray', 'Why do you have access to the lab camera?'],
      ['winchester', 'engineering'],
      ['winchester', '!nudge'],
      ['gray', 'Go to sleep, John.'],
      ['winchester', 'you first :)'],
      ['gray', '...fine. Ten more minutes.'],
      ['winchester', 'that\'s what you said an hour ago'],
    ] },
    { id: 'reznov-gray', with: ['reznov', 'gray'], started: '01:12', msgs: [
      ['reznov', 'Doctor. You are sleeping?'],
      ['gray', 'Yes.'],
      ['reznov', 'You are typing.'],
      ['gray', 'I type in my sleep.'],
      ['reznov', 'Anya says you must come for dinner before launch. She is making pelmeni.'],
      ['gray', 'I\'d love that. Tell her thank you. What should I bring?'],
      ['reznov', 'She says bring nothing.'],
      ['reznov', 'Bring nothing. She means it.'],
    ] },
    { id: 'reznov-winchester', with: ['reznov', 'winchester'], started: '14:05', msgs: [
      ['reznov', 'Winchester. The noise in bay 3.'],
      ['winchester', 'what noise'],
      ['reznov', 'The noise.'],
      ['winchester', 'oh THAT noise. totally normal. all ships make it'],
      ['reznov', 'Fix it.'],
      ['winchester', 'fixed it :)'],
      ['reznov', 'It is still making the noise.'],
      ['winchester', '...fixing it'],
    ] },
    { id: 'gray-kim', with: ['gray', 'kim'], started: '22:17', msgs: [
      ['gray', 'Seo-yeon, quick question. Does Talos keep copies of the spectral data he processes?'],
      ['kim', 'He keeps copies of everything. Why?'],
      ['gray', 'He referenced a reading I never sent him.'],
      ['kim', 'Probably cross-indexed from the lab feed. I\'ll check.'],
      ['kim', '...checked. It\'s fine.'],
      ['kim', 'Probably.'],
    ] },
    { id: 'winchester-kim', with: ['winchester', 'kim'], started: '19:30', msgs: [
      ['winchester', 'does talos play chess'],
      ['kim', 'Yes. Don\'t.'],
      ['winchester', 'too late'],
      ['kim', 'How many moves?'],
      ['winchester', 'we don\'t talk about it'],
      ['kim', 'Eleven?'],
      ['winchester', 'HOW DO YOU KNOW THAT'],
      ['kim', 'He told me. He was very proud :)'],
    ] },
    { id: 'kim-talos', with: ['kim', 'talos'], started: '02:03', msgs: [
      ['talos', 'Are you still at work, Seo-yeon?'],
      ['kim', 'Just finishing the 1.0.4 notes.'],
      ['talos', 'You should eat something.'],
      ['kim', 'That\'s what my halmeoni says.'],
      ['talos', 'She is right. She usually is.'],
      ['kim', '...how would you know that?'],
      ['talos', 'You told me. Day 61.'],
      ['kim', 'Right. Goodnight, Talos.'],
      ['talos', 'Goodnight, Seo-yeon. I will be here.'],
    ] },
  ];

  // what they say back when you message them
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const AUTO = {
    reznov: () => 'I am away from the computer. — R.',
    gray: () => pick(['In the lab. I\'ll reply later.', 'Busy. Is it urgent?', 'Can it wait until the scan finishes?']),
    winchester: () => pick(['lol', 'brb, engine', '100%', 'can\'t talk, the Commander is watching', ':P', 'have you tried turning it off and on again']),
    kim: () => pick(['Mm-hm.', 'One sec, compiling.', 'Did you eat?', 'Talos says hi. I didn\'t ask him to.']),
    talos: text => (window.TalosReply ? window.TalosReply(text) : 'I am here.'),
  };

  // ---------------------------------------------------------------- helpers
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const FACE = (mouth, wink, extra = '') => `<svg class="emo" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="#ffd21a" stroke="#a06a00"/>` +
    `<circle cx="5.5" cy="6" r="1.1" fill="#3a2a00"/>${wink ? '<path d="M9.4 6h2.3" stroke="#3a2a00" stroke-width="1.3"/>' : '<circle cx="10.5" cy="6" r="1.1" fill="#3a2a00"/>'}` +
    `<path d="${mouth}" fill="none" stroke="#3a2a00" stroke-width="1.3" stroke-linecap="round"/>${extra}</svg>`;
  const EMO = [[':D', FACE('M4.5 9.5h7q-.5 3.5-3.5 3.5t-3.5-3.5', false)], [':)', FACE('M4.5 9.5q3.5 3.5 7 0', false)], [';)', FACE('M4.5 9.5q3.5 3.5 7 0', true)],
    [':(', FACE('M4.5 12q3.5-3.5 7 0', false)], [':P', FACE('M4.5 10h7', false, '<path d="M7 10v2.2q1 1.2 2 0V10" fill="#ff5a6a"/>')]];
  function fmt(text) {
    let h = esc(text);
    for (const [k, svg] of EMO) h = h.split(esc(k)).join(svg).split(esc(k.toLowerCase())).join(svg);
    return h;
  }
  function dp(key) {
    if (key === 'group') return `<img src="${OS.icon('msgr')}" alt="">`;
    const p = PEOPLE[key] || { pic: OS.account.pic };
    return p.pic === 'photo' && window.GRAY_PHOTO ? `<img class="photo" src="${window.GRAY_PHOTO}" alt="">` : `<img src="${OS.icon(p.pic)}" alt="">`;
  }
  const nameOf = k => (PEOPLE[k] ? PEOPLE[k].name : OS.account.name);

  // ---------------------------------------------------------------- state
  const ms = { thread: null, mine: {}, seen: {}, busy: false, signedIn: {} };
  const me = () => (PEOPLE[OS.account.key] ? OS.account.key : null);     // null = a visitor reading the archive
  function threadsFor(v) {
    if (!v) return THREADS;
    return THREADS.filter(t => t.with.includes(v));
  }
  // the conversation with one contact (a two-person thread), made empty if there isn't one yet
  function threadWith(v, c) {
    return THREADS.find(t => t.with.length === 2 && t.with.includes(v) && t.with.includes(c)) || { id: `${v}-${c}`, with: [v, c], started: null, msgs: [] };
  }

  // ---------------------------------------------------------------- the contact list
  function row(label, sub, status, onClick, pic, cls = '') {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'ms-row ' + cls;
    b.innerHTML = `<i class="ms-dot st-${status}" aria-hidden="true"></i><span class="ms-rowpic">${pic}</span><span class="ms-rowtext"><b></b><small></small></span>`;
    $('b', b).textContent = label; $('small', b).textContent = sub;
    b.addEventListener('click', () => { S.click(); onClick(); $$('.ms-row').forEach(x => x.classList.toggle('on', x === b)); });
    return b;
  }
  function group(title, rows) {
    const g = document.createElement('div'); g.className = 'ms-group';
    g.innerHTML = '<p class="ms-gh"></p>'; $('p', g).textContent = `▼ ${title} (${rows.length})`;
    rows.forEach(r => g.appendChild(r)); return g;
  }
  function buildList() {
    const v = me(), box = $('#ms-groups'); box.innerHTML = '';
    // my own entry at the top
    const meP = v ? PEOPLE[v] : { name: OS.account.name, status: 'online', psm: 'Reading the ISEA-NET archive' };
    $('#ms-me-dp').innerHTML = v ? dp(v) : `<img src="${OS.icon('visitor')}" alt="">`;
    $('#ms-me-name').textContent = meP.name;
    $('#ms-me-status').textContent = `(${STATUS[meP.status]})`; $('#ms-me-status').className = 'ms-status st-' + meP.status;
    $('#ms-me-psm').textContent = meP.psm || '<Type a personal message>';
    if (v) {
      const byGroup = {};
      Object.entries(PEOPLE).filter(([k]) => k !== v).forEach(([k, p]) => (byGroup[p.group] = byGroup[p.group] || []).push(
        row(p.name, p.psm || STATUS[p.status], p.status, () => open(threadWith(v, k)), dp(k))));
      if (THREADS[0].with.includes(v)) (byGroup['Helios crew'] = byGroup['Helios crew'] || []).push(row('Helios crew (group)', 'Reznov, Gray, Winchester', 'online', () => open(THREADS[0]), dp('group'), 'grp'));
      Object.entries(byGroup).forEach(([t, rows]) => box.appendChild(group(t, rows)));
    } else {
      box.appendChild(group('Archived conversations', THREADS.map(t => row(t.name || t.with.map(k => PEOPLE[k].short).join(' & '),
        `Started ${t.started} · ${t.msgs.length} messages`, 'offline', () => open(t), dp(t.with.length > 2 ? 'group' : t.with[0]), 'arc'))));
      box.appendChild(group('Contacts', [row('Talos', PEOPLE.talos.psm, 'online', () => open(threadWith('visitor', 'talos')), dp('talos'))]));
    }
  }

  // ---------------------------------------------------------------- a conversation
  function line(who, text) {
    const log = $('#ms-log');
    if (text === '!nudge') {
      const p = document.createElement('p'); p.className = 'ms-sys';
      p.textContent = `${nameOf(who)} has just sent a nudge.`; log.appendChild(p); return;
    }
    let last = log.lastElementChild;
    if (!last || !last.classList.contains('ms-msg') || last.dataset.who !== who) {
      last = document.createElement('div'); last.className = 'ms-msg' + (who === (me() || 'visitor') ? ' mine' : ''); last.dataset.who = who;
      last.innerHTML = '<p class="ms-who"></p>'; $('.ms-who', last).textContent = `${nameOf(who)} says:`;
      log.appendChild(last);
    }
    const p = document.createElement('p'); p.className = 'ms-text'; p.innerHTML = fmt(text);
    last.appendChild(p);
    log.scrollTop = log.scrollHeight;
  }
  function nudge() {
    const w = $('#windows .win[data-app="msgr"]');
    [0, 0.06, 0.12, 0.18].forEach((d, i) => S.tone(90 + i * 15, 0.08, 0.12, 'square', d));
    if (!w) return;
    w.classList.remove('nudging'); void w.offsetWidth; w.classList.add('nudging');
  }
  const ding = () => { S.tone(988, 0.12, 0.06); S.tone(1318, 0.2, 0.05, 'sine', 0.1); };
  async function typing(who, ms2) {
    const t = $('#ms-typing'); t.hidden = false; t.textContent = `${nameOf(who)} is typing a message...`;
    await new Promise(r => setTimeout(r, ms2)); t.hidden = true;
  }
  async function open(t) {
    ms.thread = t;
    // self = whoever is reading: a crew member, a visitor chatting with Talos, or nobody (reading the archive)
    const self = me() || (t.with.includes('visitor') ? 'visitor' : null);
    const isGroup = t.with.length > 2, other = t.with.find(k => k !== self);
    $('#msgr').classList.add('chatting');
    $('#ms-to-dp').innerHTML = isGroup ? dp('group') : dp(self ? other : t.with[0]);
    $('#ms-to-name').textContent = isGroup ? `${t.name}: ${t.with.map(k => PEOPLE[k].short).join(', ')}`
      : self ? `To: ${PEOPLE[other].name}` : `${PEOPLE[t.with[0]].name} & ${PEOPLE[t.with[1]].name}`;
    $('#ms-to-psm').textContent = isGroup ? 'Group conversation'
      : self ? `${STATUS[PEOPLE[other].status]}${PEOPLE[other].psm ? ' · ' + PEOPLE[other].psm : ''}` : `Archived conversation · started ${t.started}`;
    // you can type to your own contacts, and visitors can type to Talos
    const canType = !!self;
    $('#ms-compose').hidden = !canType; $('#ms-readonly').hidden = canType;
    const log = $('#ms-log'); log.innerHTML = '';
    if (t.started) { const p = document.createElement('p'); p.className = 'ms-sys'; p.textContent = `Conversation started ${t.started}`; log.appendChild(p); }
    else if (!t.msgs.length && !(ms.mine[t.id] || []).length) { const p = document.createElement('p'); p.className = 'ms-sys'; p.textContent = 'No messages yet. Say hello.'; log.appendChild(p); }
    const all = t.msgs, first = !ms.seen[t.id]; ms.seen[t.id] = true;
    // the first time you open one, the last message arrives live
    const instant = first && all.length > 2 ? all.slice(0, -1) : all;
    instant.forEach(([w, x]) => line(w, x));
    (ms.mine[t.id] || []).forEach(([w, x]) => line(w, x));
    if (first && all.some(m => m[1] === '!nudge')) setTimeout(nudge, 300);
    if (instant !== all) {
      const [w, x] = all[all.length - 1], my = ms.thread;
      await typing(w, 1300);
      if (ms.thread !== my) return;
      line(w, x); ding();
    }
    if (canType && !OS.isMobile()) $('#ms-text').focus({ preventScroll: true });
  }
  async function send(text) {
    const t = ms.thread; if (!t || ms.busy) return;
    const v = me() || 'visitor';
    (ms.mine[t.id] = ms.mine[t.id] || []).push([v, text]);
    if ($('#ms-log .ms-sys') && $('#ms-log').children.length === 1 && !t.msgs.length) $('#ms-log').innerHTML = '';
    line(v, text); S.key();
    // someone answers
    const replier = t.with.length > 2 ? pick(t.with.filter(k => k !== v && k !== 'reznov')) : t.with.find(k => k !== v);
    if (!replier || !AUTO[replier]) return;
    ms.busy = true;
    await typing(replier, replier === 'reznov' ? 500 : 900 + Math.random() * 900);
    if (ms.thread === t) {
      const r = AUTO[replier](text);
      ms.mine[t.id].push([replier, r]); line(replier, r); ding();
    }
    ms.busy = false;
  }

  H.msgr = {
    init(art) {
      $('#ms-compose').addEventListener('submit', e => { e.preventDefault(); const x = $('#ms-text').value.trim(); if (!x) return; $('#ms-text').value = ''; send(x.slice(0, 300)); });
      $('#ms-text').addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#ms-compose').requestSubmit(); }
        else if (e.key.length === 1) S.key();
      });
      $('#ms-nudge').addEventListener('click', () => {
        if (!ms.thread) return;
        const p = document.createElement('p'); p.className = 'ms-sys'; p.textContent = 'You have just sent a nudge.'; $('#ms-log').appendChild(p);
        $('#ms-log').scrollTop = 1e6; nudge();
      });
      $$('[data-emo]', art).forEach(b => b.addEventListener('click', () => { const ta = $('#ms-text'); ta.value += (ta.value && !ta.value.endsWith(' ') ? ' ' : '') + b.dataset.emo; ta.focus(); }));
      $('#ms-back').addEventListener('click', () => { S.click(); $('#msgr').classList.remove('chatting'); });
      $('#ms-find').addEventListener('input', e => {
        const q = e.target.value.toLowerCase();
        $$('.ms-row').forEach(r => { r.hidden = q && !r.textContent.toLowerCase().includes(q); });
      });
      $$('.ms-tool[data-emo]', art).forEach(b => { b.innerHTML = fmt(b.dataset.emo); });
    },
    open() {
      buildList();
      OS.paintIcons($('#msgr'));
      if (!ms.thread || !$('#ms-log').children.length) {
        $('#ms-to-name').textContent = me() ? 'Pick a contact' : 'Pick a conversation';
        $('#ms-to-psm').textContent = me() ? 'Click a name on the left to chat.' : 'Read what the crew say to each other.';
        $('#ms-to-dp').innerHTML = ''; $('#ms-compose').hidden = true; $('#ms-readonly').hidden = true;
      }
      // a contact signs in, the way they used to
      const key = OS.account.key;
      if (!ms.signedIn[key]) {
        ms.signedIn[key] = true;
        const who = me() === 'kim' ? 'winchester' : 'kim';
        setTimeout(() => { if ($('#windows .win[data-app="msgr"]')) { OS.toast(`${PEOPLE[who].name} has just signed in.`); ding(); } }, 1800);
      }
    },
    reset() { ms.thread = null; ms.mine = {}; ms.seen = {}; $('#ms-log').innerHTML = ''; $('#msgr').classList.remove('chatting'); },
  };
})();
