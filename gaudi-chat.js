/*!
 * GAUDI site chat widget. Single file, no dependencies, no build step.
 * Contract: supabase/WEB_API.md. Plan: WEB_WIDGET_PLAN.md.
 *
 * Install (one line, pasted once by the site developer):
 *   <script src="https://<ref>.supabase.co/storage/v1/object/public/widget/gaudi-chat.js"
 *           data-gaudi-chat defer></script>
 *
 * Optional attributes on that tag:
 *   data-lang       force the widget's language (e.g. "en"); by default it is taken from the URL
 *                   path (/nl/nl/, /de/de/ ...), then the browser. Set it only for pages whose
 *                   URL carries no language segment.
 *   data-endpoint   full URL of the chat function (defaults to the constant below)
 *   data-accent     accent colour, default #1c1c1a
 *   data-policy     privacy policy URL shown in the consent line
 *   data-position    "right" (default) | "left"  — the site already has WhatsApp/Telegram
 *                    bubbles bottom-right, so "left" may be the right call there
 *   data-offset     px from the bottom, default 24 — raise it to clear those bubbles
 *   data-invite     "off" disables the proactive invite bubble (on by default)
 *   data-invite-delay   seconds on the page before it appears, default 40
 *   data-invite-text    override the invite copy (otherwise localised, see STR.invite)
 *   data-invite-exclude comma-separated URL fragments where it must never appear,
 *                   default "contact,faq,download,privacy,cart,checkout"
 */
(function () {
  'use strict';
  if (window.__gaudiChatLoaded) return;
  window.__gaudiChatLoaded = true;

  var SCRIPT = document.currentScript || (function () {
    var s = document.querySelectorAll('script[data-gaudi-chat]');
    return s[s.length - 1];
  })();
  var A = function (name, dflt) {
    return (SCRIPT && SCRIPT.getAttribute('data-' + name)) || dflt;
  };

  var ENDPOINT = A('endpoint', 'https://plcjkuhxtodofyjnusjf.supabase.co/functions/v1/chat');
  var ACCENT = A('accent', '#1c1c1a');
  var POLICY = A('policy', '');
  var SIDE = A('position', 'right') === 'left' ? 'left' : 'right';
  var OFFSET = parseInt(A('offset', '24'), 10) || 24;
  var INVITE_ON = A('invite', 'on') !== 'off';
  var INVITE_DELAY = (parseInt(A('invite-delay', '40'), 10) || 40) * 1000;
  var INVITE_TEXT = A('invite-text', '');
  var INVITE_EXCLUDE = A('invite-exclude', 'contact,faq,download,privacy,cart,checkout')
                         .split(',').map(function (x) { return x.trim().toLowerCase(); }).filter(Boolean);

  // ---------------------------------------------------------------- i18n
  // Language detection, in priority order:
  //   1. an explicit data-lang on the script tag;
  //   2. the URL path — gaudidecor.eu serves /<country>/<language>/..., e.g. /nl/nl/, /de/de/,
  //      /fr/fr/, so the first path segment that is a language we support wins;
  //   3. the browser's language;
  //   4. English.
  // <html lang> is deliberately NOT used: on gaudidecor.eu it is hardcoded to "ru" on every page,
  // including the Dutch and German ones (checked 2026-09-02). Trusting it would show a Russian
  // widget to Dutch visitors. If that attribute is ever fixed site-wide, it can be added back.
  var SUPPORTED = ['en', 'ru', 'de', 'fr', 'es', 'it', 'nl', 'pl'];
  function langFromPath() {
    var parts = location.pathname.toLowerCase().split('/').filter(Boolean).slice(0, 2);
    for (var i = 0; i < parts.length; i++) {
      if (SUPPORTED.indexOf(parts[i]) !== -1) return parts[i];
    }
    return '';
  }
  var L = String(A('lang', '') || langFromPath() || navigator.language || 'en')
            .slice(0, 2).toLowerCase();
  var NAME = 'Toni';
  var STR = {
    en: { title: NAME, sub: 'GAUDI AI assistant', ph: 'Write a message…', send: 'Send',
          open: 'Chat with us', close: 'Close chat',
          consent: 'To answer you, we keep this conversation.', policy: 'Privacy policy',
          accept: 'Start chat', hint: 'Ask about decor, sizes, delivery', typing: 'typing…',
          slow: 'Still working on it…', err: 'Connection problem. Try again.',
          manager: 'manager', contactCta: 'Leave your e-mail and we will reply',
          email: 'E-mail', name: 'Name (optional)', save: 'Send', saved: 'Thank you — we will be in touch.' , invite: 'Need a hand choosing? Ask me about sizes, styles or delivery.' },
    ru: { title: NAME, sub: 'ИИ-ассистент GAUDI', ph: 'Напишите сообщение…', send: 'Отправить',
          open: 'Написать нам', close: 'Закрыть чат',
          consent: 'Чтобы ответить, мы сохраняем переписку.', policy: 'Политика конфиденциальности',
          accept: 'Начать чат', hint: 'Спросите про декор, размеры, доставку', typing: 'печатает…',
          slow: 'Ещё думаю…', err: 'Проблема со связью. Попробуйте ещё раз.',
          manager: 'менеджер', contactCta: 'Оставьте e-mail, и мы ответим',
          email: 'E-mail', name: 'Имя (необязательно)', save: 'Отправить', saved: 'Спасибо, мы свяжемся с вами.' , invite: 'Помочь с подбором? Спросите про размеры, стиль или доставку.' },
    de: { title: NAME, sub: 'KI-Assistent von GAUDI', ph: 'Nachricht schreiben…', send: 'Senden',
          open: 'Schreiben Sie uns', close: 'Chat schließen',
          consent: 'Um zu antworten, speichern wir diesen Chat.', policy: 'Datenschutz',
          accept: 'Chat starten', hint: 'Fragen zu Dekor, Maßen, Lieferung', typing: 'schreibt…',
          slow: 'Einen Moment noch…', err: 'Verbindungsproblem. Bitte erneut versuchen.',
          manager: 'Berater', contactCta: 'E-Mail hinterlassen, wir antworten',
          email: 'E-Mail', name: 'Name (optional)', save: 'Senden', saved: 'Danke — wir melden uns.' , invite: 'Brauchen Sie Hilfe bei der Auswahl? Fragen Sie nach Maßen, Stilen oder Lieferung.' },
    fr: { title: NAME, sub: 'Assistant IA de GAUDI', ph: 'Écrivez un message…', send: 'Envoyer',
          open: 'Écrivez-nous', close: 'Fermer',
          consent: 'Pour vous répondre, nous conservons cette conversation.', policy: 'Confidentialité',
          accept: 'Démarrer', hint: 'Décor, dimensions, livraison', typing: 'écrit…',
          slow: 'Je réfléchis encore…', err: 'Problème de connexion. Réessayez.',
          manager: 'conseiller', contactCta: 'Laissez votre e-mail, nous répondrons',
          email: 'E-mail', name: 'Nom (facultatif)', save: 'Envoyer', saved: 'Merci — nous vous recontactons.' , invite: 'Besoin d’aide pour choisir ? Dimensions, styles, livraison — demandez.' },
    es: { title: NAME, sub: 'Asistente de IA de GAUDI', ph: 'Escriba un mensaje…', send: 'Enviar',
          open: 'Escríbanos', close: 'Cerrar',
          consent: 'Para responderle, guardamos esta conversación.', policy: 'Privacidad',
          accept: 'Empezar', hint: 'Decoración, medidas, envío', typing: 'escribiendo…',
          slow: 'Sigo pensando…', err: 'Problema de conexión. Inténtelo de nuevo.',
          manager: 'gestor', contactCta: 'Deje su e-mail y le responderemos',
          email: 'E-mail', name: 'Nombre (opcional)', save: 'Enviar', saved: 'Gracias, le contactaremos.' , invite: '¿Le ayudo a elegir? Pregunte por medidas, estilos o envío.' },
    it: { title: NAME, sub: 'Assistente IA di GAUDI', ph: 'Scrivi un messaggio…', send: 'Invia',
          open: 'Scrivici', close: 'Chiudi',
          consent: 'Per risponderti conserviamo questa conversazione.', policy: 'Privacy',
          accept: 'Inizia', hint: 'Decori, misure, spedizione', typing: 'sta scrivendo…',
          slow: 'Ci sto ancora lavorando…', err: 'Problema di connessione. Riprova.',
          manager: 'referente', contactCta: 'Lascia la tua e-mail, ti risponderemo',
          email: 'E-mail', name: 'Nome (facoltativo)', save: 'Invia', saved: 'Grazie, ti contatteremo.' , invite: 'Ti aiuto a scegliere? Chiedi di misure, stili o spedizione.' },
    nl: { title: NAME, sub: 'AI-assistent van GAUDI', ph: 'Schrijf een bericht…', send: 'Versturen',
          open: 'Schrijf ons', close: 'Sluiten',
          consent: 'Om te antwoorden bewaren wij dit gesprek.', policy: 'Privacybeleid',
          accept: 'Start chat', hint: 'Decor, maten, levering', typing: 'typt…',
          slow: 'Nog even…', err: 'Verbindingsprobleem. Probeer opnieuw.',
          manager: 'medewerker', contactCta: 'Laat uw e-mail achter, wij antwoorden',
          email: 'E-mail', name: 'Naam (optioneel)', save: 'Versturen', saved: 'Dank u — wij nemen contact op.' , invite: 'Hulp bij het kiezen? Vraag naar maten, stijlen of levering.' },
    pl: { title: NAME, sub: 'Asystent AI GAUDI', ph: 'Napisz wiadomość…', send: 'Wyślij',
          open: 'Napisz do nas', close: 'Zamknij',
          consent: 'Aby odpowiedzieć, zachowujemy tę rozmowę.', policy: 'Prywatność',
          accept: 'Rozpocznij', hint: 'Dekory, wymiary, dostawa', typing: 'pisze…',
          slow: 'Jeszcze myślę…', err: 'Problem z połączeniem. Spróbuj ponownie.',
          manager: 'opiekun', contactCta: 'Zostaw e-mail, odpowiemy',
          email: 'E-mail', name: 'Imię (opcjonalnie)', save: 'Wyślij', saved: 'Dziękujemy — odezwiemy się.' , invite: 'Pomóc w wyborze? Zapytaj o wymiary, style lub dostawę.' }
  };
  var T = STR[L] || STR.en;

  // ---------------------------------------------------------------- state
  var SID_KEY = 'gaudi_sid';
  var sid;
  try {
    sid = localStorage.getItem(SID_KEY);
    if (!sid) { sid = uuid(); localStorage.setItem(SID_KEY, sid); }
  } catch (e) { sid = uuid(); }                    // private mode: session-only id

  function uuid() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0, v = c === 'x' ? r : ((r & 0x3) | 0x8);
      return v.toString(16);
    });
  }

  var lastId = 0, started = false, consentDone = false, opened = false;
  var pollTimer = null, fastUntil = 0, sending = false, humanName = null;

  // ---------------------------------------------------------------- transport
  function api(path, body, isGet) {
    var opts = { method: isGet ? 'GET' : 'POST', headers: {} };
    if (!isGet) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    return fetch(ENDPOINT + path, opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) { var e = new Error(j.error || 'http_' + r.status); e.payload = j; e.status = r.status; throw e; }
        return j;
      });
    });
  }

  // ---------------------------------------------------------------- shadow DOM
  var host = document.createElement('div');
  host.setAttribute('data-gaudi-chat-root', '');
  var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
  document.body.appendChild(host);

  var css = `
  :host { all: initial; }
  /* must beat the display:flex rules below, or hidden panels stay visible */
  [hidden] { display: none !important; }
  * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  .launcher {
    position: fixed; ${SIDE}: 24px; bottom: ${OFFSET}px; z-index: 2147483000;
    display: flex; align-items: center; gap: 10px; padding: 13px 20px 13px 17px;
    background: ${ACCENT}; color: #fff; border: none; border-radius: 999px; cursor: pointer;
    font-size: 15px; line-height: 1; box-shadow: 0 6px 24px rgba(0,0,0,.22);
    transition: transform .18s ease, box-shadow .18s ease;
  }
  .launcher:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0,0,0,.28); }
  .launcher svg { width: 19px; height: 19px; flex: none; }
  .launcher[hidden] { display: none; }

  .panel {
    position: fixed; ${SIDE}: 24px; bottom: ${OFFSET}px; z-index: 2147483001;
    width: 384px; max-width: calc(100vw - 32px); height: 600px; max-height: calc(100vh - 48px);
    display: flex; flex-direction: column; overflow: hidden;
    background: #fbfaf8; color: #1c1c1a; border-radius: 16px;
    box-shadow: 0 18px 60px rgba(0,0,0,.26); border: 1px solid rgba(0,0,0,.07);
    opacity: 0; transform: translateY(12px) scale(.98); pointer-events: none;
    transition: opacity .18s ease, transform .18s ease;
  }
  .panel.open { opacity: 1; transform: none; pointer-events: auto; }

  header { display: flex; align-items: center; gap: 12px; padding: 16px 16px 14px;
           background: ${ACCENT}; color: #fff; }
  header .t { font-size: 15px; font-weight: 600; letter-spacing: .2px; }
  header .s { font-size: 12px; opacity: .72; margin-top: 3px; }   /* AI disclosure — do not remove */
  header .grow { flex: 1; }
  header button { background: transparent; border: none; color: #fff; opacity: .8; cursor: pointer;
                  font-size: 22px; line-height: 1; padding: 4px 6px; border-radius: 6px; }
  header button:hover { opacity: 1; background: rgba(255,255,255,.12); }

  .thread { flex: 1; overflow-y: auto; padding: 18px 16px 8px; display: flex;
            flex-direction: column; gap: 12px; scroll-behavior: smooth; }
  .msg { max-width: 86%; padding: 11px 14px; border-radius: 14px; font-size: 14.5px;
         line-height: 1.5; white-space: pre-wrap; word-wrap: break-word; }
  .msg a { color: inherit; text-decoration: underline; text-underline-offset: 2px; }
  .client { align-self: flex-end; background: ${ACCENT}; color: #fff; border-bottom-right-radius: 5px; }
  .bot { align-self: flex-start; background: #fff; border: 1px solid rgba(0,0,0,.08);
         border-bottom-left-radius: 5px; }
  .manager { align-self: flex-start; background: #eef3ee; border: 1px solid #cfdccf;
             border-bottom-left-radius: 5px; }
  .who { font-size: 11px; text-transform: uppercase; letter-spacing: .6px; opacity: .6;
         margin-bottom: 4px; }
  .note { align-self: center; font-size: 12.5px; color: #8a8a84; text-align: center;
          max-width: 90%; padding: 4px 0; }

  .dots { align-self: flex-start; display: flex; gap: 4px; padding: 13px 15px; background: #fff;
          border: 1px solid rgba(0,0,0,.08); border-radius: 14px; border-bottom-left-radius: 5px; }
  .dots i { width: 6px; height: 6px; border-radius: 50%; background: #b3b3ac; display: block;
            animation: b 1.2s infinite ease-in-out; }
  .dots i:nth-child(2) { animation-delay: .18s } .dots i:nth-child(3) { animation-delay: .36s }
  @keyframes b { 0%,60%,100% { opacity: .3; transform: translateY(0) } 30% { opacity: 1; transform: translateY(-3px) } }

  form.composer { display: flex; gap: 8px; padding: 12px; border-top: 1px solid rgba(0,0,0,.07);
                  background: #fff; }
  textarea { flex: 1; resize: none; border: 1px solid rgba(0,0,0,.14); border-radius: 10px;
             padding: 10px 12px; font-size: 14.5px; line-height: 1.4; max-height: 120px;
             outline: none; background: #fbfaf8; }
  textarea:focus { border-color: ${ACCENT}; }
  .go { background: ${ACCENT}; color: #fff; border: none; border-radius: 10px; width: 42px;
        cursor: pointer; flex: none; display: grid; place-items: center; }
  .go:disabled { opacity: .45; cursor: default; }
  .go svg { width: 18px; height: 18px; }

  /* proactive invite: a small bubble beside the launcher, never a forced pop-up */
  .teaser {
    position: fixed; ${SIDE}: 24px; bottom: ${OFFSET + 58}px; z-index: 2147483000;
    max-width: 268px; display: flex; align-items: flex-start; gap: 10px;
    background: #fff; color: #1c1c1a; border: 1px solid rgba(0,0,0,.09);
    border-radius: 14px; padding: 13px 12px 13px 14px; font-size: 13.5px; line-height: 1.45;
    box-shadow: 0 10px 30px rgba(0,0,0,.18); cursor: pointer;
    opacity: 0; transform: translateY(8px); transition: opacity .28s ease, transform .28s ease;
  }
  .teaser.in { opacity: 1; transform: none; }
  .teaser[hidden] { display: none !important; }
  .teaser .tname { font-weight: 600; display: block; margin-bottom: 3px; color: #1c1c1a; }
  .teaser .tmsg { display: block; color: #4a4442; }
  .teaser .x {
    background: transparent; border: none; color: #97918f; font-size: 17px; line-height: 1;
    cursor: pointer; padding: 2px 3px; margin: -3px -2px 0 0; border-radius: 5px; flex: none;
  }
  .teaser .x:hover { background: rgba(0,0,0,.06); color: #1c1c1a; }
  @media (max-width: 480px) { .teaser { max-width: calc(100vw - 92px); ${SIDE}: 16px; bottom: 74px; } }

  .gate { padding: 20px 18px; display: flex; flex-direction: column; gap: 14px; }
  .gate p { margin: 0; font-size: 13.5px; line-height: 1.55; color: #55554f; }
  .gate a { color: ${ACCENT}; }
  .gate button, .contact button { background: ${ACCENT}; color: #fff; border: none;
        border-radius: 10px; padding: 12px 16px; font-size: 14.5px; cursor: pointer; }
  .contact { padding: 14px 16px; border-top: 1px solid rgba(0,0,0,.07); background: #fff;
             display: flex; flex-direction: column; gap: 8px; }
  .contact p { margin: 0 0 2px; font-size: 13px; color: #55554f; }
  .contact input { border: 1px solid rgba(0,0,0,.14); border-radius: 9px; padding: 9px 11px;
                   font-size: 14px; outline: none; }
  .contact input:focus { border-color: ${ACCENT}; }

  @media (max-width: 480px) {
    .panel { ${SIDE}: 0; bottom: 0; width: 100vw; max-width: 100vw; height: 100dvh;
             max-height: 100dvh; border-radius: 0; }
    .launcher { ${SIDE}: 16px; bottom: 16px; }
  }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important } }
  `;

  var ICON_CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-4-.9L3 21l1.9-4.6A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4Z"/></svg>';
  var ICON_SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m4 12 16-8-6 16-2.5-6.5L4 12Z"/></svg>';

  var wrap = document.createElement('div');
  wrap.innerHTML =
    '<style>' + css + '</style>' +
    '<button class="launcher" aria-haspopup="dialog">' + ICON_CHAT + '<span>' + esc(T.open) + '</span></button>' +
    '<aside class="teaser" role="note" hidden><div><span class="tname">' + esc(NAME) + '</span>' +
      '<span class="tmsg">' + esc(INVITE_TEXT || T.invite) + '</span></div>' +
      '<button class="x" aria-label="' + esc(T.close) + '">&times;</button></aside>' +
    '<section class="panel" role="dialog" aria-modal="false" aria-label="' + esc(T.title + ' — ' + T.sub) + '">' +
      '<header><div><div class="t">' + esc(T.title) + '</div><div class="s">' + esc(T.sub) + '</div></div>' +
        '<div class="grow"></div><button class="x" aria-label="' + esc(T.close) + '">&times;</button></header>' +
      '<div class="gate" hidden><p>' + esc(T.consent) +
        (POLICY ? ' <a href="' + encodeURI(POLICY) + '" target="_blank" rel="noopener noreferrer">' + esc(T.policy) + '</a>' : '') +
        '</p><button class="ok">' + esc(T.accept) + '</button></div>' +
      '<div class="thread" role="log" aria-live="polite"></div>' +
      '<form class="composer" hidden><textarea rows="1" placeholder="' + esc(T.ph) + '" maxlength="2000"></textarea>' +
        '<button class="go" type="submit" aria-label="' + esc(T.send) + '">' + ICON_SEND + '</button></form>' +
      '<form class="contact" hidden><p>' + esc(T.contactCta) + '</p>' +
        '<input name="name" placeholder="' + esc(T.name) + '" autocomplete="name">' +
        '<input name="email" type="email" placeholder="' + esc(T.email) + '" autocomplete="email" required>' +
        '<button type="submit">' + esc(T.save) + '</button></form>' +
    '</section>';
  root.appendChild(wrap);

  var $ = function (s) { return root.querySelector(s); };
  var launcher = $('.launcher'), panel = $('.panel'), thread = $('.thread'),
      composer = $('.composer'), input = $('textarea'), gate = $('.gate'),
      contact = $('.contact'), go = $('.go');

  // ---------------------------------------------------------------- rendering
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* The server (Формат Web) already escapes and whitelists. This is the second lock: rebuild the
     markup from a parsed tree, keeping only b/strong/i/em/u/s/br and http(s) links. */
  function safeHtml(raw) {
    var tpl = document.createElement('template');
    tpl.innerHTML = String(raw);
    var okTags = { B: 1, STRONG: 1, I: 1, EM: 1, U: 1, S: 1, BR: 1, A: 1 };
    (function walk(node) {
      var kids = Array.prototype.slice.call(node.childNodes);
      kids.forEach(function (n) {
        if (n.nodeType === 3) return;
        if (n.nodeType !== 1 || !okTags[n.tagName]) {
          var txt = document.createTextNode(n.textContent || '');
          n.parentNode.replaceChild(txt, n);
          return;
        }
        Array.prototype.slice.call(n.attributes).forEach(function (a) {
          if (n.tagName === 'A' && a.name === 'href' && /^https?:\/\//i.test(a.value)) return;
          n.removeAttribute(a.name);
        });
        if (n.tagName === 'A') { n.setAttribute('target', '_blank'); n.setAttribute('rel', 'noopener noreferrer'); }
        walk(n);
      });
    })(tpl.content);
    return tpl.innerHTML;
  }

  function addMsg(m) {
    var el = document.createElement('div');
    el.className = 'msg ' + (m.role === 'client' ? 'client' : m.role === 'manager' ? 'manager' : 'bot');
    if (m.role === 'manager') {
      var who = document.createElement('div');
      who.className = 'who';
      who.textContent = (m.manager_name || T.manager);
      el.appendChild(who);
    }
    var body = document.createElement('div');
    body.innerHTML = safeHtml(m.body);
    el.appendChild(body);
    thread.appendChild(el);
    if (m.id && m.id > lastId) lastId = m.id;
    scroll();
  }

  function note(text) {
    var el = document.createElement('div');
    el.className = 'note'; el.textContent = text;
    thread.appendChild(el); scroll();
  }

  function scroll() { thread.scrollTop = thread.scrollHeight; }

  function typing(on) {
    var d = $('.dots');
    if (on && !d) {
      d = document.createElement('div');
      d.className = 'dots'; d.setAttribute('aria-label', T.typing);
      d.innerHTML = '<i></i><i></i><i></i>';
      thread.appendChild(d); scroll();
    } else if (!on && d) { d.remove(); }
  }

  // ---------------------------------------------------------------- polling
  function schedule() {
    clearTimeout(pollTimer);
    if (!opened) return;
    if (document.hidden) return;                       // paused while the tab is in the background
    var delay = Date.now() < fastUntil ? 1500 : 8000;
    pollTimer = setTimeout(poll, delay);
  }

  function poll() {
    if (!opened) return;
    api('/poll?sid=' + sid + '&since=' + lastId, null, true).then(function (d) {
      if (d.last_id && d.last_id < lastId) { lastId = 0; thread.innerHTML = ''; return start(); }
      (d.messages || []).forEach(function (m) {
        if (m.role === 'client' && m.id <= lastId) return;
        typing(false); addMsg(m);
        if (m.role !== 'client') fastUntil = 0;        // answer arrived: back to the lazy cadence
      });
      if (d.human_active && d.human_name && d.human_name !== humanName) {
        humanName = d.human_name;
      }
      typing(!!d.typing);
    }).catch(function () { /* transient: the next tick retries */ }).then(schedule);
  }

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && opened) { poll(); }
    else { clearTimeout(pollTimer); }
  });

  // ---------------------------------------------------------------- flows
  function start() {
    return api('/start', { sid: sid, page_url: location.href, lang: L }).then(function (d) {
      started = true;
      consentDone = !d.consent_required;
      (d.history || []).forEach(addMsg);
      lastId = d.last_id || lastId;
      humanName = d.human_name || null;
      gate.hidden = consentDone;
      composer.hidden = !consentDone;
      if (consentDone && !(d.history || []).length) note(T.hint);
      schedule();
    }).catch(function () { note(T.err); });
  }

  function send(text) {
    if (sending || !text.trim()) return;
    sending = true; go.disabled = true;
    try { localStorage.setItem('gaudi_talked', '1'); } catch (e) {}
    addMsg({ role: 'client', body: esc(text), id: 0 });
    typing(true);
    fastUntil = Date.now() + 45000;
    var slow = setTimeout(function () { note(T.slow); }, 45000);
    api('/send', { sid: sid, text: text, page_url: location.href, lang: L })
      .then(function (d) { if (d.message_id) lastId = Math.max(lastId, d.message_id); })
      .catch(function (e) {
        typing(false);
        note((e.payload && e.payload.message) || T.err);
        if (e.status === 429 || e.status === 503) contact.hidden = false;
      })
      .then(function () {
        clearTimeout(slow); sending = false; go.disabled = false; schedule();
      });
  }

  // ---------------------------------------------------------------- events
  function open() {
    opened = true;
    if (typeof hideInvite === 'function') hideInvite(false);
    panel.classList.add('open');
    launcher.hidden = true;
    if (!started) start(); else { poll(); }
    setTimeout(function () { (consentDone ? input : $('.ok')).focus(); }, 180);
  }
  function close() {
    opened = false; clearTimeout(pollTimer);
    panel.classList.remove('open'); launcher.hidden = false; launcher.focus();
  }

  launcher.addEventListener('click', open);
  $('.x').addEventListener('click', close);
  root.addEventListener('keydown', function (e) { if (e.key === 'Escape' && opened) close(); });

  $('.ok').addEventListener('click', function () {
    api('/consent', { sid: sid, granted: true, text: T.consent, page_url: location.href, lang: L })
      .then(function () {
        consentDone = true; gate.hidden = true; composer.hidden = false;
        note(T.hint); input.focus();
      })
      .catch(function () { note(T.err); });
  });

  function submitNow() {
    var v = input.value; input.value = ''; input.style.height = 'auto';
    send(v);
  }
  composer.addEventListener('submit', function (e) { e.preventDefault(); submitNow(); });
  input.addEventListener('input', function () {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });
  input.addEventListener('keydown', function (e) {
    // call the sender directly: a synthetic 'submit' Event is not reliable across browsers
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitNow(); }
  });

  contact.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = new FormData(contact);
    api('/contact', { sid: sid, name: f.get('name') || '', email: f.get('email') || '' })
      .then(function () { contact.hidden = true; note(T.saved); })
      .catch(function () { note(T.err); });
  });

  // ---------------------------------------------------------------- proactive invite
  // A bubble, never a forced panel: an uninvited full-screen chat reads as a pop-up, and on
  // mobile it covers the page the visitor was reading. Shown once per visit, silenced for a day
  // once dismissed, and never to someone who has already written to us. Costs nothing until the
  // visitor answers — the text is local, no request is made.
  var teaser = $('.teaser'), inviteTimer = null;
  var TALKED_KEY = 'gaudi_talked', HUSH_KEY = 'gaudi_invite_hushed';

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  function inviteAllowed() {
    if (!INVITE_ON || opened || store(TALKED_KEY)) return false;
    var path = (location.pathname + location.search).toLowerCase();
    for (var i = 0; i < INVITE_EXCLUDE.length; i++) {
      if (path.indexOf(INVITE_EXCLUDE[i]) !== -1) return false;
    }
    var hushed = store(HUSH_KEY);
    return !(hushed && (Date.now() - Number(hushed)) < 86400000);
  }

  function showInvite() {
    if (!inviteAllowed()) return;
    teaser.hidden = false;
    requestAnimationFrame(function () { teaser.classList.add('in'); });
  }

  function hideInvite(hush) {
    clearTimeout(inviteTimer);
    teaser.classList.remove('in');
    teaser.hidden = true;
    if (hush) store(HUSH_KEY, String(Date.now()));
  }

  if (INVITE_ON) {
    inviteTimer = setTimeout(showInvite, INVITE_DELAY);
    teaser.addEventListener('click', function (e) {
      if (e.target.closest('.x')) { hideInvite(true); return; }
      hideInvite(false);
      open();
      note(INVITE_TEXT || T.invite);        // carry the greeting into the thread
    });
  }

  // public hook so the site can open the chat from its own button
  window.gaudiChat = { open: open, close: close, askContact: function () { contact.hidden = false; } };
})();
