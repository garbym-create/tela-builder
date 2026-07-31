/* תל"א — בונה תוכנית לימודים אישית
   כל הלוגיקה. הנתונים נשארים במכשיר. */
(function () {
'use strict';

var BANK = JSON.parse(document.getElementById('bank').textContent);
var ST = {};   // statements by id
BANK.statements.forEach(function (s) { ST[s.id] = s; });
var BY_SUB = {};
BANK.statements.forEach(function (s) { (BY_SUB[s.subdomain] = BY_SUB[s.subdomain] || []).push(s); });
var DOM_LABEL = {};
BANK.domains.forEach(function (d) { DOM_LABEL[d.id] = d.label; });

/* ---------- הגדרות תוכן ---------- */

var GRADES = ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ז׳','ח׳','ט׳','י׳','י״א','י״ב'];

function bandOf(grade) {
  var i = GRADES.indexOf(grade);
  if (i < 0) return '3-4';
  if (i <= 1) return '1-2';
  if (i <= 3) return '3-4';
  if (i <= 5) return '5-6';
  return '7-9';
}

var DISABILITIES = ['לקות למידה','הפרעת קשב','ASD','לקות שפתית','עיכוב התפתחותי','מוגבלות שכלית','חושי או פיזי','אחר'];

var SETTINGS = [
  { v: 'regular_integrated', label: 'כיתה רגילה עם שילוב' },
  { v: 'special_class',      label: 'כיתת חינוך מיוחד' },
  { v: 'special_school',     label: 'בית ספר לחינוך מיוחד' }
];

var DOMAIN_CARDS = [
  { id: 'academic',   icon: '📘', label: 'לימודי',              sub: 'קריאה · כתיבה · שפה · מתמטיקה' },
  { id: 'learner',    icon: '🎒', label: 'תלמידאות ועצמאות',    sub: 'התארגנות · קשב · עבודה עצמאית' },
  { id: 'social_emo', icon: '💬', label: 'חברתי ורגשי',          sub: 'קשרים · ויסות · כללים' },
  { id: 'motor_adl',  icon: '✋', label: 'מוטורי ו-ADL',         sub: 'מוטוריקה · ניידות · תפקוד יומיומי' }
];

/* תחומי משנה: כל אחד מוביל לתת-תחום אחד או לשאלת הסתעפות */
var SUBAREAS = {
  academic: [
    { v: 'reading', label: 'קריאה', branch: 'הקושי בפענוח ובשטף, או בהבנת הנקרא?',
      opts: [{ v: 'reading_fluency', label: 'פענוח ושטף' }, { v: 'reading_comprehension', label: 'הבנת הנקרא' }] },
    { v: 'writing', label: 'כתיבה', branch: 'הקושי בכתב היד ובארגון הדף, או בהבעה בכתב?',
      opts: [{ v: 'writing_motor', label: 'כתב יד וארגון הדף' }, { v: 'writing_expression', label: 'הבעה בכתב וכתיב' }] },
    { v: 'math', label: 'מתמטיקה', branch: 'הקושי במושג המספר, או בפעולות ובבעיות?',
      opts: [{ v: 'math_numbers', label: 'מושג המספר ומבנה עשרוני' }, { v: 'math_operations', label: 'פעולות ובעיות מילוליות' }, { v: 'math_geometry', label: 'צורות ומדידות' }] },
    { v: 'language', label: 'שפה בעל פה', sd: 'language_oral' }
  ],
  learner: [
    { v: 'organization', label: 'התארגנות וציוד', sd: 'organization' },
    { v: 'attention',    label: 'קשב וריכוז',     sd: 'attention' },
    { v: 'independence', label: 'עבודה עצמאית ומוטיבציה', branch: 'הקושי בעצמאות בעבודה, או במוטיבציה וברצון?',
      opts: [{ v: 'independence', label: 'עצמאות והתמדה' }, { v: 'motivation', label: 'מוטיבציה ורצון' }] },
    { v: 'instructions', label: 'הבנת הוראות', sd: 'comprehension_instructions' }
  ],
  social_emo: [
    { v: 'peers', label: 'קשרים עם בני הגיל', branch: 'הקושי ביצירת הקשר עצמו, או בהבנת מצבים ובפתרון קונפליקטים?',
      opts: [{ v: 'peer_relations', label: 'יצירת קשר ויוזמה' }, { v: 'social_cognition', label: 'הבנת מצבים ופתרון קונפליקטים' }] },
    { v: 'emotional', label: 'ויסות רגשי ותסכול', sd: 'emotional_regulation' },
    { v: 'rules',     label: 'כללים, מעברים ומרחב אישי', sd: 'rules_authority' },
    { v: 'self',      label: 'סינגור עצמי ודימוי עצמי', sd: 'self_advocacy' }
  ],
  motor_adl: [
    { v: 'fine',  label: 'מוטוריקה עדינה וציוד', sd: 'fine_motor' },
    { v: 'gross', label: 'מוטוריקה גסה ופעילות תנועתית', sd: 'gross_motor' },
    { v: 'adl',   label: 'תפקוד יומיומי ועצמאות', sd: 'adl' }
  ]
};

var EXAMPLE_PLACEHOLDER = {
  academic:   'לדוגמה: בשיעור חשבון, כשיש בעיה מילולית בת שתי שורות, הוא קורא אותה, מסתכל עליי ואומר "אני לא מבין מה עושים". אם אני מקריאה ומציירת — פותר לבד.',
  learner:    'לדוגמה: בתחילת השיעור כולם מוציאים מחברת, והיא עדיין מחפשת בתיק. אחרי כשבע דקות עוד לא התחילה, גם אם הזכרתי פעמיים.',
  social_emo: 'לדוגמה: בהפסקה הוא עומד ליד המשחק ומסתכל, ולא ניגש לבקש להצטרף. כשילד אחר מזמין אותו — הוא משחק בשמחה עשר דקות.',
  motor_adl:  'לדוגמה: בזמן גזירה היא מחזיקה את המספריים בשתי ידיים והדף זז. במטלת הדבקה נדרשת עזרה של הסייעת כמעט לכל שלב.'
};

var WORKED_OPTIONS = [
  'ישיבה בקדמת הכיתה או ליד איש צוות','פיצול המשימה לשלבים קצרים','טיימר או שעון חול גלוי',
  'כרטיסיית ניווט חזותית','חיזוקים מיידיים ותוכנית חיזוקים','הקראת ההוראות בעל פה',
  'עבודה בקבוצה קטנה','בן זוג ללמידה','הפסקות תנועה מתוכננות','הכנה מראש לפני מעברים ושינויים',
  'תבניות דיבור ופתיחי משפט','סימון בצבע והדגשה','התאמת כלי הכתיבה או הדף','הפחתת כמות המטלה',
  'הדהיית תיווך הדרגתית','שיח אישי ומשוב רפלקטיבי'
];

var PROVIDERS = ['מורת שילוב','סייעת','טיפול פרטני','מורה מקצועית','צוות פארא-רפואי','אחר'];

var EVAL = {
  academic: {
    mid: 'תצפית שבועית בשיעור, דגימות ביצוע במחברת ורישום במחוון אישי. משוב מיידי לתלמיד/ה בסיום כל מטלה.',
    end: 'מבדק תואם רמה בסוף התקופה, השוואה לנתוני הפתיחה, סיכום המחוונים ודיווח בישיבת הצוות.'
  },
  learner: {
    mid: 'רישום יומי במחוון ההתארגנות והקשב, שיח משוב שבועי קצר עם התלמיד/ה, דיווח מהמורים המקצועיים.',
    end: 'סיכום המחוונים לאורך התקופה, תצפית מובנית בסוף המחצית והשוואה לנקודת הפתיחה.'
  },
  social_emo: {
    mid: 'תצפית בכיתה, בהפסקה ובחצר; יומן אירועים שבועי; שיח רפלקטיבי עם התלמיד/ה לאחר אירועים.',
    end: 'סיכום התצפיות ויומן האירועים, משוב מחנכת ומצוות הכיתה, דיווח בוועדת מעקב.'
  },
  motor_adl: {
    mid: 'תצפית מובנית בזמן הפעולה ורישום מידת העצמאות בכל שלב, אחת לשבוע.',
    end: 'השוואת רמת העצמאות לתחילת התקופה וסיכום משותף עם הסייעת והצוות הפארא-רפואי.'
  }
};

var PERIOD_MID = 'עד סוף מחצית א׳';
var PERIOD_END = 'עד סוף שנת הלימודים';

/* ---------- מצב ---------- */

var S = null;
function blankState() {
  return { grade: '', disability: '', disability_note: '', setting: '', prior: '', prior_note: '',
           domains: [], d: {}, o: {}, worked: [], worked_note: '', hours: '', providers: [],
           profile: null, tables: null, step: 0 };
}

var KEY = 'tela.draft.v1';
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
function loadDraft() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
function clearDraft() { try { localStorage.removeItem(KEY); } catch (e) {} }

function get(path) {
  var p = path.split('.'), o = S;
  for (var i = 0; i < p.length; i++) { if (o == null) return undefined; o = o[p[i]]; }
  return o;
}
function set(path, val) {
  var p = path.split('.'), o = S;
  for (var i = 0; i < p.length - 1; i++) { if (o[p[i]] == null) o[p[i]] = {}; o = o[p[i]]; }
  o[p[p.length - 1]] = val;
  save();
}

/* ---------- בניית רצף השאלות ---------- */

function subareaOf(domId, v) {
  var list = SUBAREAS[domId] || [];
  for (var i = 0; i < list.length; i++) if (list[i].v === v) return list[i];
  return null;
}

function chosenSubdomain(domId) {
  var sa = subareaOf(domId, get('d.' + domId + '.subarea'));
  if (!sa) return null;
  if (sa.sd) return sa.sd;
  return get('d.' + domId + '.subdomain') || null;
}

function buildSteps() {
  var steps = [];
  steps.push({ key: 'grade', kind: 'single', q: 'באיזו כיתה לומד/ת התלמיד/ה?', grid: 'grades',
               options: GRADES.map(function (g) { return { v: g, label: g }; }) });
  steps.push({ key: 'disability', kind: 'single', q: 'מה אפיון המוגבלות?', note: true,
               openNoteFor: ['אחר'], notePlaceholder: 'מה האפיון?',
               options: DISABILITIES.map(function (x) { return { v: x, label: x }; }) });
  steps.push({ key: 'setting', kind: 'single', q: 'באיזו מסגרת לומד/ת התלמיד/ה?',
               options: SETTINGS });
  steps.push({ key: 'prior', kind: 'single', q: 'יש תוכנית קודמת או אבחון עדכני?',
               options: [{ v: 'yes', label: 'כן' }, { v: 'no', label: 'לא' }],
               noteIf: 'yes', notePlaceholder: 'מה עלה בתוכנית הקודמת או באבחון? מה כדאי להמשיך?' });
  steps.push({ key: 'domains', kind: 'cards', q: 'באילו תחומים הקושי המרכזי?',
               sub: 'אפשר לבחור עד שלושה. התחומים שייבחרו יקבלו שאלות עומק.', max: 3 });

  (S.domains || []).forEach(function (domId) {
    var base = 'd.' + domId;
    var list = SUBAREAS[domId] || [];
    steps.push({ key: base + '.subarea', kind: 'single', tag: DOM_LABEL[domId],
                 q: 'בתוך התחום ה' + DOM_LABEL[domId] + ', היכן הקושי המרכזי?',
                 options: list.map(function (x) { return { v: x.v, label: x.label }; }) });

    var sa = subareaOf(domId, get(base + '.subarea'));
    if (sa && sa.branch) {
      steps.push({ key: base + '.subdomain', kind: 'single', tag: DOM_LABEL[domId], q: sa.branch,
                   options: sa.opts, resets: [base + '.r'] });
    }
    var sd = chosenSubdomain(domId);
    if (sd) {
      (BY_SUB[sd] || []).slice(0, 3).forEach(function (st) {
        steps.push({ key: base + '.r.' + st.id, kind: 'single', tag: DOM_LABEL[domId],
                     q: st.prompt, sub: 'מה מתאר הכי טוב את המצב היום?', stack: true, note: true,
                     options: [
                       { v: 'strength', label: st.strength,  hint: 'חוזק' },
                       { v: 'partial',  label: st.partial,   hint: 'חלקי' },
                       { v: 'weakness', label: st.weakness,  hint: 'קושי' }
                     ] });
      });
      steps.push({ key: base + '.example', kind: 'text', tag: DOM_LABEL[domId],
                   q: 'תן/י דוגמה קונקרטית ממה שקורה בשיעור',
                   sub: 'משפט-שניים. הדוגמה נכנסת לפרופיל התלמיד/ה.',
                   placeholder: EXAMPLE_PLACEHOLDER[domId] });
    }
  });

  DOMAIN_CARDS.forEach(function (c) {
    if ((S.domains || []).indexOf(c.id) > -1) return;
    steps.push({ key: 'o.' + c.id, kind: 'single', tag: DOM_LABEL[c.id],
                 q: 'בתחום ה' + c.label + ' — יש משהו שכדאי לדעת?',
                 options: [{ v: 'ok', label: 'התחום תקין' }, { v: 'note', label: 'יש משהו שכדאי לדעת' }],
                 noteIf: 'note', notePlaceholder: 'מה כדאי לדעת?' });
  });

  steps.push({ key: 'worked', kind: 'multi', q: 'מה כבר ניסיתם והצליח, ולו חלקית?',
               sub: 'זה הבסיס לעמודת הדרכים והאמצעים. אפשר לבחור כמה שרוצים.', note: true,
               options: WORKED_OPTIONS.map(function (x) { return { v: x, label: x }; }) });
  steps.push({ key: 'support', kind: 'support', q: 'כמה שעות תמיכה שבועיות, ומי נותן אותן?' });
  return steps;
}

/* ---------- הפקת התוכנית ---------- */

function ratingsOf(domId) { return get('d.' + domId + '.r') || {}; }

/* מטרה נבחרת רק אם יש קושי מתועד שמפעיל אותה. אין מטרה בלי קושי. */
function pickGoal(domId, exclude) {
  var r = ratingsOf(domId), band = bandOf(S.grade), sd = chosenSubdomain(domId);
  var scored = BANK.goals.filter(function (g) {
    return g.domain === domId && (exclude || []).indexOf(g.id) < 0;
  }).map(function (g) {
    var trig = 0, bonus = 0;
    g.triggeredBy.forEach(function (id) {
      var v = r[id];
      if (v === 'weakness') trig += 3;
      else if (v === 'partial') trig += 2;
      if (sd && ST[id] && ST[id].subdomain === sd) bonus += 1;
    });
    bonus += g.gradeBands.indexOf(band) > -1 ? 1 : -1;
    return { g: g, trig: trig, sc: trig + bonus };
  }).filter(function (x) { return x.trig > 0; })
    .sort(function (a, b) { return b.sc - a.sc; });
  return scored.length ? scored[0].g : null;
}

function methodsFor(goal) {
  var out = [];
  var worked = (S.worked || []).slice(0, 4);
  if (S.worked_note) worked.push(S.worked_note);
  if (worked.length) out.push('נשען על מה שכבר עובד: ' + worked.join('; ') + '.');
  goal.methods.slice(0, 5).forEach(function (m) { out.push(m); });
  var sup = [];
  if (S.hours) sup.push(S.hours + ' שעות תמיכה שבועיות');
  if ((S.providers || []).length) sup.push('במתן ' + S.providers.join(', '));
  if (sup.length) out.push('מסגרת הביצוע: ' + sup.join(', ') + '.');
  return out;
}

function criteriaFor(goal, when) {
  var band = bandOf(S.grade), parts = [];
  if (goal.criteriaNumeric && goal.criteriaNumeric[band]) parts.push(goal.criteriaNumeric[band][when]);
  parts.push(goal.criteria[when]);
  return parts.join(' · ');
}

function buildTable(goal) {
  var objs = goal.objectives.slice();
  var half = Math.ceil(objs.length / 2);
  var midObjs = objs.slice(0, half);
  var endObjs = objs.slice(half);
  if (!endObjs.length) endObjs = objs.slice();
  var ev = EVAL[goal.domain];
  var methods = methodsFor(goal);
  return {
    goalId: goal.id,
    title: goal.title,
    domain: goal.domain,
    rows: [
      { period: PERIOD_MID, objectives: midObjs, methods: methods, criteria: criteriaFor(goal, 'mid'),
        formative: ev.mid, summative: 'בדיקת עמידה ביעד בסוף מחצית א׳ והצגתו בישיבת הצוות.' },
      { period: PERIOD_END, objectives: endObjs, methods: methods, criteria: criteriaFor(goal, 'end'),
        formative: ev.mid, summative: ev.end }
    ]
  };
}

function buildProfile() {
  var strengths = [], needs = [];
  (S.domains || []).forEach(function (domId) {
    var r = ratingsOf(domId);
    Object.keys(r).forEach(function (id) {
      var st = ST[id]; if (!st) return;
      if (r[id] === 'strength') strengths.push(st.strength);
      else needs.push(st[r[id]]);
    });
    var ex = get('d.' + domId + '.example');
    if (ex) needs.push('דוגמה מהשיעור (' + DOM_LABEL[domId] + '): ' + ex);
    var notes = get('d.' + domId + '.r_notes') || {};
    Object.keys(notes).forEach(function (k) { if (notes[k]) needs.push(notes[k]); });
  });
  Object.keys(S.o || {}).forEach(function (k) {
    var note = get('o.' + k + '_note');
    if (S.o[k] === 'note' && note) needs.push(DOM_LABEL[k] + ': ' + note);
  });
  if (S.prior === 'yes' && S.prior_note) strengths.push('מתוך התוכנית הקודמת: ' + S.prior_note);

  var worked = (S.worked || []).slice();
  if (S.worked_note) worked.push(S.worked_note);
  var sup = [];
  if (S.hours) sup.push(S.hours + ' שעות שבועיות');
  if ((S.providers || []).length) sup.push(S.providers.join(', '));

  var settingLabel = '';
  SETTINGS.forEach(function (x) { if (x.v === S.setting) settingLabel = x.label; });

  return {
    grade: 'כיתה ' + S.grade + (settingLabel ? ' · ' + settingLabel : ''),
    disability: S.disability + (S.disability_note ? ' · ' + S.disability_note : ''),
    strengths: strengths.length ? strengths : ['לא סומנו מוקדי כוח בשלב המיפוי'],
    needs: needs.length ? needs : ['לא סומנו מוקדים לחיזוק'],
    worked: worked.length ? worked : ['טרם נוסו אסטרטגיות מובנות'],
    support: sup.length ? sup : ['לא דווחו שעות תמיכה']
  };
}

function programLabel() {
  var pt = S.setting === 'regular_integrated' ? 'regular_integrated' : 'special_ed';
  return BANK.programTypes[pt];
}

/* ---------- תצוגה ---------- */

var app = document.getElementById('app');
var screen = 'home'; // home | q | summary | loading | result

function el(tag, cls, txt) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  return e;
}

function render() {
  app.innerHTML = '';
  if (screen === 'home') return renderHome();
  if (screen === 'summary') return renderSummary();
  if (screen === 'loading') return renderLoading();
  if (screen === 'result') return renderResult();
  renderQuestion();
}

var CREDIT = 'ממעבדת הניסויים של מרי גרבי בשיתוף שרון רז';

function credit() {
  var p = el('p', 'credit', CREDIT);
  return p;
}

function renderHome() {
  var w = el('div', 'home');
  w.appendChild(el('div', 'logo', 'תל״א · תח״י'));
  w.appendChild(el('h1', null, 'בונה תל״א – תח״י'));
  w.appendChild(el('p', 'lead', 'מיפוי של שלוש דקות, ובסוף תוכנית מוכנה להגשה.'));
  var b = el('button', 'btn primary big', 'התחלה');
  b.onclick = function () { S = blankState(); save(); screen = 'q'; render(); };
  w.appendChild(b);
  var draft = loadDraft();
  if (draft && (draft.grade || (draft.domains && draft.domains.length))) {
    var b2 = el('button', 'btn ghost', 'המשך טיוטה שמורה');
    b2.onclick = function () { S = draft; screen = S.tables ? 'result' : 'q'; render(); };
    w.appendChild(b2);
  }
  w.appendChild(el('p', 'privacy', '🔒 הנתונים נשארים במכשיר שלך.'));
  w.appendChild(credit());
  app.appendChild(w);
}

function goto(i) {
  var steps = buildSteps();
  if (i >= steps.length) { S.profile = buildProfile(); screen = 'summary'; save(); render(); return; }
  S.step = Math.max(0, i);
  save();
  render();
}

function renderQuestion() {
  var steps = buildSteps();
  if (S.step >= steps.length) { goto(steps.length); return; }
  var st = steps[S.step];

  var bar = el('div', 'progress');
  var fill = el('div', 'fill');
  fill.style.width = ((S.step) / steps.length * 100) + '%';
  bar.appendChild(fill);
  app.appendChild(bar);

  var head = el('div', 'qhead');
  var back = el('button', 'back', '→ חזרה');
  back.setAttribute('aria-label', 'חזרה לשאלה הקודמת');
  back.onclick = function () { if (S.step === 0) { screen = 'home'; render(); } else goto(S.step - 1); };
  head.appendChild(back);
  head.appendChild(el('span', 'count', 'שאלה ' + (S.step + 1) + ' מתוך ' + steps.length));
  app.appendChild(head);

  var card = el('div', 'card enter');
  if (st.tag) card.appendChild(el('div', 'tag', st.tag));
  card.appendChild(el('h2', null, st.q));
  if (st.sub) card.appendChild(el('p', 'sub', st.sub));

  if (st.kind === 'single') renderSingle(card, st);
  else if (st.kind === 'multi') renderMulti(card, st);
  else if (st.kind === 'cards') renderCards(card, st);
  else if (st.kind === 'text') renderText(card, st);
  else if (st.kind === 'support') renderSupport(card, st);

  app.appendChild(card);
  var f = card.querySelector('button, textarea');
  if (f) f.focus({ preventScroll: true });
}

function nextBtn(card, label, fn, disabled) {
  var b = el('button', 'btn primary next', label || 'המשך');
  b.disabled = !!disabled;
  b.onclick = fn;
  card.appendChild(b);
  return b;
}

var forceNote = null;

function noteBox(card, path, placeholder, onInput, startOpen) {
  var wrap = el('div', 'notewrap');
  var toggle = el('button', 'link', '＋ להוסיף במילים שלי');
  var ta = el('textarea', 'note');
  ta.placeholder = placeholder || 'אפשר להוסיף כאן כל מה שחשוב';
  ta.value = get(path) || '';
  ta.setAttribute('aria-label', 'הערה חופשית');
  ta.hidden = true;
  ta.oninput = function () { set(path, ta.value); if (onInput) onInput(); };
  toggle.onclick = function () {
    ta.hidden = !ta.hidden;
    toggle.textContent = ta.hidden ? '＋ להוסיף במילים שלי' : '− סגירת ההערה';
    if (!ta.hidden) ta.focus();
    if (onInput) onInput();
  };
  if (ta.value || startOpen) { ta.hidden = false; toggle.textContent = '− סגירת ההערה'; }
  wrap.appendChild(toggle); wrap.appendChild(ta);
  card.appendChild(wrap);
  if (startOpen) setTimeout(function () { ta.focus(); }, 60);
  return ta;
}

function renderSingle(card, st) {
  var list = el('div', st.grid === 'grades' ? 'opts grid' : (st.stack ? 'opts stack' : 'opts'));
  var cur = get(st.key);
  var noteEl = null;
  var showNext = st.note || (st.noteIf && cur === st.noteIf);

  st.options.forEach(function (o) {
    var b = el('button', 'opt' + (cur === o.v ? ' on' : ''));
    if (o.hint) b.appendChild(el('span', 'hint', o.hint));
    b.appendChild(el('span', 'lbl', o.label));
    if (o.desc) b.appendChild(el('span', 'desc', o.desc));
    b.setAttribute('aria-pressed', cur === o.v ? 'true' : 'false');
    b.onclick = function () {
      if (st.resets) st.resets.forEach(function (p) { set(p, {}); });
      if (get(st.key) !== o.v && st.key.indexOf('.subarea') > -1) {
        set(st.key.replace('.subarea', '.subdomain'), '');
        set(st.key.replace('.subarea', '.r'), {});
      }
      set(st.key, o.v);
      var noteOpen = noteEl && !noteEl.hidden && noteEl.value;
      if (st.noteIf && o.v === st.noteIf) { render(); return; }
      if ((st.openNoteFor || []).indexOf(o.v) > -1) { forceNote = st.key; render(); return; }
      if (noteOpen) { render(); return; }
      goto(S.step + 1);
    };
    list.appendChild(b);
  });
  card.appendChild(list);

  if (st.note || (st.noteIf && cur === st.noteIf)) {
    var path = st.key.indexOf('.r.') > -1
      ? st.key.replace('.r.', '.r_notes.')
      : st.key + '_note';
    var open = forceNote === st.key || (st.noteIf && cur === st.noteIf);
    if (forceNote === st.key) forceNote = null;
    noteEl = noteBox(card, path, st.notePlaceholder, null, open);
  }
  if (showNext || cur) nextBtn(card, 'המשך', function () { goto(S.step + 1); }, !cur);
}

function renderMulti(card, st) {
  var cur = get(st.key) || [];
  var list = el('div', 'opts stack');
  st.options.forEach(function (o) {
    var on = cur.indexOf(o.v) > -1;
    var b = el('button', 'opt' + (on ? ' on' : ''));
    b.appendChild(el('span', 'lbl', o.label));
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.onclick = function () {
      var arr = (get(st.key) || []).slice();
      var i = arr.indexOf(o.v);
      if (i > -1) arr.splice(i, 1); else arr.push(o.v);
      set(st.key, arr); render();
    };
    list.appendChild(b);
  });
  card.appendChild(list);
  if (st.note) noteBox(card, st.key + '_note', 'אסטרטגיה נוספת שעבדה');
  nextBtn(card, cur.length ? 'המשך' : 'דילוג', function () { goto(S.step + 1); });
}

function renderCards(card, st) {
  var cur = S.domains || [];
  var list = el('div', 'domaincards');
  DOMAIN_CARDS.forEach(function (c) {
    var on = cur.indexOf(c.id) > -1;
    var full = cur.length >= st.max && !on;
    var b = el('button', 'dcard' + (on ? ' on' : '') + (full ? ' dim' : ''));
    b.appendChild(el('span', 'ico', c.icon));
    var t = el('span', 'txt');
    t.appendChild(el('span', 'lbl', c.label));
    t.appendChild(el('span', 'desc', c.sub));
    b.appendChild(t);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.onclick = function () {
      var arr = (S.domains || []).slice();
      var i = arr.indexOf(c.id);
      if (i > -1) arr.splice(i, 1);
      else { if (arr.length >= st.max) return; arr.push(c.id); }
      S.domains = arr; save(); render();
    };
    list.appendChild(b);
  });
  card.appendChild(list);
  card.appendChild(el('p', 'counter', 'נבחרו ' + cur.length + ' מתוך ' + st.max));
  nextBtn(card, 'המשך', function () { goto(S.step + 1); }, cur.length === 0);
}

function renderText(card, st) {
  var ta = el('textarea', 'big');
  ta.placeholder = st.placeholder || '';
  ta.value = get(st.key) || '';
  ta.setAttribute('aria-label', st.q);
  card.appendChild(ta);
  var b = nextBtn(card, ta.value ? 'המשך' : 'דילוג', function () { goto(S.step + 1); });
  ta.oninput = function () { set(st.key, ta.value); b.textContent = ta.value.trim() ? 'המשך' : 'דילוג'; };
}

function renderSupport(card, st) {
  card.appendChild(el('p', 'sub2', 'כמה שעות שבועיות?'));
  var hours = ['0','1','2','3','4','5','6+'];
  var g = el('div', 'opts grid');
  hours.forEach(function (h) {
    var b = el('button', 'opt' + (S.hours === h ? ' on' : ''));
    b.appendChild(el('span', 'lbl', h));
    b.setAttribute('aria-pressed', S.hours === h ? 'true' : 'false');
    b.onclick = function () { S.hours = h; save(); render(); };
    g.appendChild(b);
  });
  card.appendChild(g);
  card.appendChild(el('p', 'sub2', 'מי נותן אותן?'));
  var list = el('div', 'opts');
  PROVIDERS.forEach(function (p) {
    var on = (S.providers || []).indexOf(p) > -1;
    var b = el('button', 'opt' + (on ? ' on' : ''));
    b.appendChild(el('span', 'lbl', p));
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.onclick = function () {
      var arr = (S.providers || []).slice(), i = arr.indexOf(p);
      if (i > -1) arr.splice(i, 1); else arr.push(p);
      S.providers = arr; save(); render();
    };
    list.appendChild(b);
  });
  card.appendChild(list);
  nextBtn(card, 'סיום המיפוי', function () { goto(S.step + 1); });
}

/* ---------- מסך סיכום ---------- */

function renderSummary() {
  var p = S.profile;
  var head = el('div', 'qhead');
  var back = el('button', 'back', '→ חזרה לשאלות');
  back.onclick = function () { screen = 'q'; goto(buildSteps().length - 1); };
  head.appendChild(back);
  app.appendChild(head);

  var card = el('div', 'card wide enter');
  card.appendChild(el('h2', null, 'פרופיל התלמיד/ה'));
  card.appendChild(el('p', 'sub', 'אפשר לערוך כל שדה לפני ההפקה. לחיצה על העיפרון פותחת עריכה.'));

  addProfileCard(card, 'כיתה ומסגרת', 'grade', [p.grade]);
  addProfileCard(card, 'אפיון', 'disability', [p.disability]);
  addProfileCard(card, 'מוקדי כוח', 'strengths', p.strengths);
  addProfileCard(card, 'מוקדים לחיזוק', 'needs', p.needs);
  addProfileCard(card, 'מה שכבר עובד', 'worked', p.worked);
  addProfileCard(card, 'משאבי תמיכה', 'support', p.support);

  nextBtn(card, 'אישור והפקת התוכנית', function () { produce(); });
  app.appendChild(card);
}

function addProfileCard(parent, title, key, items) {
  var box = el('div', 'pcard');
  var h = el('div', 'phead');
  h.appendChild(el('span', 'ptitle', title));
  var edit = el('button', 'pencil', '✎');
  edit.setAttribute('aria-label', 'עריכת ' + title);
  h.appendChild(edit);
  box.appendChild(h);

  var ul = el('ul', 'plist');
  items.forEach(function (t) { ul.appendChild(el('li', null, t)); });
  box.appendChild(ul);

  var ta = el('textarea', 'pedit');
  ta.hidden = true;
  ta.value = items.join('\n');
  ta.setAttribute('aria-label', 'עריכת ' + title);
  box.appendChild(ta);

  edit.onclick = function () {
    if (ta.hidden) { ta.hidden = false; ul.hidden = true; ta.focus(); edit.textContent = '✓'; }
    else {
      var arr = ta.value.split('\n').filter(function (x) { return x.trim(); });
      S.profile[key] = arr.length ? arr : items;
      save();
      ul.innerHTML = '';
      S.profile[key].forEach(function (t) { ul.appendChild(el('li', null, t)); });
      ta.hidden = true; ul.hidden = false; edit.textContent = '✎';
    }
  };
  parent.appendChild(box);
}

/* ---------- מסך טעינה והפקה ---------- */

var LOAD_MSGS = ['קורא את הפרופיל…','בוחר מטרות שמתאימות לקשיים שסומנו…',
                 'מנסח את היעדים לפי שכבת הגיל…','מתאים את אמות המידה…','מרכיב את הטבלאות…'];

function produce() {
  screen = 'loading'; render();
  var used = [], tables = [], skipped = [];
  (S.domains || []).forEach(function (domId) {
    var g = pickGoal(domId, used);
    if (g) { used.push(g.id); tables.push(buildTable(g)); }
    else skipped.push(DOM_LABEL[domId]);
  });
  setTimeout(function () {
    S.skipped = skipped;
    if (!tables.length) {
      screen = 'summary'; render();
      showError('לא סומן קושי שמפעיל מטרה מהמאגר, ולכן לא נבנתה תוכנית. כדאי לחזור למסכי העומק ולסמן "חלקי" או "קושי", או להוסיף מטרה ידנית.',
                function () { screen = 'q'; goto(4); });
      return;
    }
    S.tables = tables; save();
    screen = 'result'; render();
  }, 1400);
}

function renderLoading() {
  var w = el('div', 'loading');
  w.appendChild(el('div', 'spin'));
  var msg = el('p', 'lmsg', LOAD_MSGS[0]);
  w.appendChild(msg);
  app.appendChild(w);
  var i = 0;
  var t = setInterval(function () {
    i++;
    if (i >= LOAD_MSGS.length || screen !== 'loading') { clearInterval(t); return; }
    msg.textContent = LOAD_MSGS[i];
  }, 320);
}

/* ---------- מסך התוצר ---------- */

var COLS = ['יעד/יעדים','פרק זמן','דרכי ההוראה, השיטות והאמצעים','אמות מידה להערכה','הערכה מעצבת','הערכה מסכמת'];

function renderResult() {
  var pt = programLabel();
  var head = el('div', 'rhead');
  var t = el('div');
  t.appendChild(el('h2', null, pt.fullName + ' — ' + (S.profile ? S.profile.grade : '')));
  t.appendChild(el('p', 'sub', 'כל תא ניתן לעריכה ישירות במסך. השינויים נשמרים ונכנסים לקובץ.'));
  head.appendChild(t);
  app.appendChild(head);

  if ((S.skipped || []).length) {
    var n = el('div', 'notice');
    n.appendChild(el('strong', null, 'בתחום ' + S.skipped.join(' וב') + ' לא נבנתה מטרה. '));
    n.appendChild(document.createTextNode(
      'לא סומן קושי שמפעיל מטרה מהמאגר, ולכן לא נוצרה מטרה יש מאין. אפשר להוסיף מטרה מהמאגר בכפתור למטה.'));
    app.appendChild(n);
  }

  S.tables.forEach(function (tb, ti) {
    var box = el('div', 'tbox enter');
    var th = el('div', 'thead');
    var title = el('h3', null, 'מטרה ' + (ti + 1) + ': ' + tb.title);
    title.contentEditable = 'true';
    title.oninput = function () { tb.title = title.textContent.replace(/^מטרה \d+: /, ''); save(); };
    th.appendChild(title);
    th.appendChild(el('span', 'dtag', DOM_LABEL[tb.domain]));
    var del = el('button', 'xbtn', '✕');
    del.setAttribute('aria-label', 'הסרת המטרה');
    del.onclick = function () { S.tables.splice(ti, 1); save(); render(); };
    th.appendChild(del);
    box.appendChild(th);

    var table = el('table', 'plan');
    var tr = el('tr');
    COLS.forEach(function (c) { tr.appendChild(el('th', null, c)); });
    var thead = el('thead'); thead.appendChild(tr); table.appendChild(thead);
    var tbody = el('tbody');
    tb.rows.forEach(function (row, ri) {
      var r = el('tr');
      r.appendChild(cell(COLS[0], listHtml(row.objectives), function (v) { row.objectives = v.split('\n').filter(Boolean); }));
      r.appendChild(cell(COLS[1], row.period, function (v) { row.period = v; }));
      r.appendChild(cell(COLS[2], listHtml(row.methods), function (v) { row.methods = v.split('\n').filter(Boolean); }));
      r.appendChild(cell(COLS[3], row.criteria, function (v) { row.criteria = v; }));
      r.appendChild(cell(COLS[4], row.formative, function (v) { row.formative = v; }));
      r.appendChild(cell(COLS[5], row.summative, function (v) { row.summative = v; }));
      tbody.appendChild(r);
    });
    table.appendChild(tbody);
    box.appendChild(table);
    app.appendChild(box);
  });

  var acts = el('div', 'actions');
  addAct(acts, 'הורדה כ-Word', 'primary', downloadDocx);
  addAct(acts, 'העתקה ללוח', '', copyAll);
  addAct(acts, 'הוספת מטרה נוספת', '', addGoalDialog);
  addAct(acts, 'התחלת תלמיד/ה חדש/ה', 'ghost', function () {
    if (!confirm('להתחיל תלמיד/ה חדש/ה? התוכנית הנוכחית תימחק מהמכשיר.')) return;
    clearDraft(); S = blankState(); screen = 'home'; render();
  });
  app.appendChild(acts);
  app.appendChild(credit());
}

function cell(label, text, onEdit) {
  var td = el('td');
  td.setAttribute('data-label', label);
  td.contentEditable = 'true';
  td.textContent = text;
  td.oninput = function () { onEdit(td.textContent); save(); };
  return td;
}
function listHtml(arr) { return arr.join('\n'); }

function addAct(parent, label, cls, fn) {
  var b = el('button', 'btn ' + cls, label);
  b.onclick = fn;
  parent.appendChild(b);
}

function addGoalDialog() {
  var back = el('div', 'modalback');
  var m = el('div', 'modal');
  m.appendChild(el('h3', null, 'הוספת מטרה מהמאגר'));
  var used = S.tables.map(function (t) { return t.goalId; });
  var band = bandOf(S.grade);
  BANK.domains.forEach(function (d) {
    var gs = BANK.goals.filter(function (g) { return g.domain === d.id && used.indexOf(g.id) < 0; });
    if (!gs.length) return;
    m.appendChild(el('div', 'mdom', d.label));
    gs.forEach(function (g) {
      var b = el('button', 'opt');
      b.appendChild(el('span', 'lbl', g.title));
      if (g.gradeBands.indexOf(band) < 0) b.appendChild(el('span', 'desc', 'מותאם בעיקר לשכבות ' + g.gradeBands.join(', ')));
      b.onclick = function () { S.tables.push(buildTable(g)); save(); document.body.removeChild(back); render(); };
      m.appendChild(b);
    });
  });
  var c = el('button', 'btn ghost', 'ביטול');
  c.onclick = function () { document.body.removeChild(back); };
  m.appendChild(c);
  back.appendChild(m);
  back.onclick = function (e) { if (e.target === back) document.body.removeChild(back); };
  document.body.appendChild(back);
}

/* ---------- העתקה ---------- */

function planText() {
  var pt = programLabel();
  var out = [pt.fullName + ' (' + pt.label + ')', S.profile.grade, ''];
  out.push('מוקדי כוח: ' + S.profile.strengths.join('; '));
  out.push('מוקדים לחיזוק: ' + S.profile.needs.join('; '));
  out.push('מה שכבר עובד: ' + S.profile.worked.join('; '));
  out.push('משאבי תמיכה: ' + S.profile.support.join('; '));
  out.push('');
  S.tables.forEach(function (tb, i) {
    out.push('מטרה ' + (i + 1) + ': ' + tb.title);
    tb.rows.forEach(function (r) {
      out.push('  ' + r.period);
      out.push('  יעדים: ' + r.objectives.join(' | '));
      out.push('  דרכים ואמצעים: ' + r.methods.join(' | '));
      out.push('  אמות מידה: ' + r.criteria);
      out.push('  הערכה מעצבת: ' + r.formative);
      out.push('  הערכה מסכמת: ' + r.summative);
      out.push('');
    });
  });
  return out.join('\n');
}

function copyAll() {
  var txt = planText();
  function done() { toast('הועתק ללוח'); }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).then(done, fallback);
  } else fallback();
  function fallback() {
    var ta = document.createElement('textarea');
    ta.value = txt; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { alert('ההעתקה נכשלה. אפשר לסמן ולהעתיק ידנית.'); }
    document.body.removeChild(ta);
  }
}

function toast(msg) {
  var t = el('div', 'toast', msg);
  document.body.appendChild(t);
  setTimeout(function () { t.classList.add('out'); }, 1600);
  setTimeout(function () { if (t.parentNode) document.body.removeChild(t); }, 2100);
}

/* ---------- יצוא DOCX ---------- */

function xesc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function wp(text, opts) {
  opts = opts || {};
  var rpr = '<w:rPr><w:rtl/>' + (opts.bold ? '<w:b/>' : '') + (opts.size ? '<w:sz w:val="' + opts.size + '"/>' : '') + '</w:rPr>';
  return '<w:p><w:pPr><w:bidi/>' + (opts.align ? '<w:jc w:val="' + opts.align + '"/>' : '') +
         '</w:pPr><w:r>' + rpr + '<w:t xml:space="preserve">' + xesc(text) + '</w:t></w:r></w:p>';
}
function wcell(lines, width, opts) {
  var body = (Array.isArray(lines) ? lines : [lines]).map(function (l) { return wp(l, opts); }).join('');
  if (!body) body = wp('');
  return '<w:tc><w:tcPr><w:tcW w:w="' + width + '" w:type="dxa"/>' +
         (opts && opts.shade ? '<w:shd w:val="clear" w:fill="E8F0EE"/>' : '') +
         '<w:vAlign w:val="top"/></w:tcPr>' + body + '</w:tc>';
}

function docXml() {
  var pt = programLabel();
  var widths = [2600, 1300, 3400, 2600, 2200, 2200];
  var body = '';
  body += wp(pt.fullName + ' — ' + pt.label, { bold: true, size: 32 });
  body += wp(S.profile.grade + ' · ' + S.profile.disability, { size: 24 });
  body += wp('');
  body += wp('מוקדי כוח: ' + S.profile.strengths.join('; '), { size: 22 });
  body += wp('מוקדים לחיזוק: ' + S.profile.needs.join('; '), { size: 22 });
  body += wp('מה שכבר עובד: ' + S.profile.worked.join('; '), { size: 22 });
  body += wp('משאבי תמיכה: ' + S.profile.support.join('; '), { size: 22 });
  body += wp('');

  S.tables.forEach(function (tb, i) {
    body += wp('מטרה ' + (i + 1) + ': ' + tb.title, { bold: true, size: 26 });
    var rows = '<w:tr><w:trPr><w:tblHeader/></w:trPr>' +
      COLS.map(function (c, ci) { return wcell(c, widths[ci], { bold: true, shade: true, size: 20 }); }).join('') + '</w:tr>';
    tb.rows.forEach(function (r) {
      rows += '<w:tr>' +
        wcell(r.objectives, widths[0], { size: 20 }) +
        wcell(r.period, widths[1], { size: 20 }) +
        wcell(r.methods, widths[2], { size: 20 }) +
        wcell(r.criteria, widths[3], { size: 20 }) +
        wcell(r.formative, widths[4], { size: 20 }) +
        wcell(r.summative, widths[5], { size: 20 }) + '</w:tr>';
    });
    var borders = '<w:tblBorders>' +
      ['top','left','bottom','right','insideH','insideV'].map(function (b) {
        return '<w:' + b + ' w:val="single" w:sz="6" w:space="0" w:color="9AA6A3"/>';
      }).join('') + '</w:tblBorders>';
    body += '<w:tbl><w:tblPr><w:bidiVisual/><w:tblW w:w="14300" w:type="dxa"/>' + borders +
            '<w:tblCellMar><w:top w:w="60" w:type="dxa"/><w:left w:w="80" w:type="dxa"/>' +
            '<w:bottom w:w="60" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr>' +
            rows + '</w:tbl>';
    body += wp('');
  });

  body += wp(CREDIT, { size: 18 });

  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    '<w:body>' + body +
    '<w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>' +
    '<w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/><w:bidi/></w:sectPr>' +
    '</w:body></w:document>';
}

/* ZIP מינימלי, ללא דחיסה */
var CRC_TABLE = (function () {
  var t = new Uint32Array(256);
  for (var n = 0; n < 256; n++) {
    var c = n;
    for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  var c = 0xFFFFFFFF;
  for (var i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function utf8(str) { return new TextEncoder().encode(str); }

function zip(files) {
  var chunks = [], central = [], offset = 0;
  function u16(n) { return [n & 255, (n >> 8) & 255]; }
  function u32(n) { return [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255]; }

  files.forEach(function (f) {
    var name = utf8(f.name), data = utf8(f.data), crc = crc32(data);
    var local = [].concat([0x50, 0x4B, 0x03, 0x04], u16(20), u16(0x0800), u16(0), u16(0), u16(0),
                          u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0));
    chunks.push(new Uint8Array(local), name, data);
    central.push({ name: name, crc: crc, size: data.length, offset: offset });
    offset += local.length + name.length + data.length;
  });

  var cdir = [], cdirLen = 0;
  central.forEach(function (c) {
    var head = [].concat([0x50, 0x4B, 0x01, 0x02], u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0),
                         u32(c.crc), u32(c.size), u32(c.size), u16(c.name.length),
                         u16(0), u16(0), u16(0), u16(0), u32(0), u32(c.offset));
    cdir.push(new Uint8Array(head), c.name);
    cdirLen += head.length + c.name.length;
  });
  var end = new Uint8Array([].concat([0x50, 0x4B, 0x05, 0x06], u16(0), u16(0),
                                     u16(central.length), u16(central.length), u32(cdirLen), u32(offset), u16(0)));
  var all = chunks.concat(cdir, [end]);
  var total = all.reduce(function (a, b) { return a + b.length; }, 0);
  var out = new Uint8Array(total), pos = 0;
  all.forEach(function (b) { out.set(b, pos); pos += b.length; });
  return out;
}

function downloadDocx() {
  try {
    var files = [
      { name: '[Content_Types].xml', data:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
        '</Types>' },
      { name: '_rels/.rels', data:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
        '</Relationships>' },
      { name: 'word/document.xml', data: docXml() }
    ];
    var blob = new Blob([zip(files)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = programLabel().label.replace(/"/g, '') + ' — ' + (S.grade ? 'כיתה ' + S.grade : 'תוכנית') + '.docx';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    toast('הקובץ ירד');
  } catch (e) {
    showError('לא הצלחנו ליצור את קובץ ה-Word.', downloadDocx);
  }
}

function showError(msg, retry) {
  var back = el('div', 'modalback');
  var m = el('div', 'modal');
  m.appendChild(el('h3', null, 'משהו השתבש'));
  m.appendChild(el('p', null, msg + ' התשובות שלך נשמרו ולא הלכו לאיבוד.'));
  var r = el('button', 'btn primary', 'ניסיון חוזר');
  r.onclick = function () { document.body.removeChild(back); retry(); };
  var c = el('button', 'btn ghost', 'סגירה');
  c.onclick = function () { document.body.removeChild(back); };
  m.appendChild(r); m.appendChild(c);
  back.appendChild(m); document.body.appendChild(back);
}

/* ---------- הפעלה ---------- */

window.addEventListener('error', function () { save(); });
S = blankState();
render();

})();
