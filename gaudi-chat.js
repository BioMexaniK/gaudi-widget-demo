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
 *   data-offset-mobile  px from the bottom on narrow screens (default: same as data-offset) —
 *                   raise it to clear a fixed bottom menu
 *   data-mobile-breakpoint  width below which the mobile offset applies, default 900
 *   data-invite     "off" disables the proactive invite bubble (on by default)
 *   data-invite-delay   seconds on the page before it appears, default 30
 *   data-invite-sound   "off" mutes the soft click that plays with the invite (on by default)
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
  var MOB_BP = parseInt(A('mobile-breakpoint', '900'), 10) || 900;
  var MOB_OFFSET = parseInt(A('offset-mobile', String(OFFSET)), 10);
  if (isNaN(MOB_OFFSET)) MOB_OFFSET = OFFSET;
  var INVITE_ON = A('invite', 'on') !== 'off';
  var INVITE_DELAY = (parseInt(A('invite-delay', '30'), 10) || 30) * 1000;
  var INVITE_TEXT = A('invite-text', '');
  var INVITE_SOUND = A('invite-sound', 'on') !== 'off';
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

  // gaudidecor.eu publishes the page language in a Content-Language meta tag — most reliable.
  function langFromMeta() {
    var metas = document.getElementsByTagName('meta');
    for (var i = 0; i < metas.length; i++) {
      var eq = (metas[i].getAttribute('http-equiv') || metas[i].getAttribute('name') || '').toLowerCase();
      if (eq === 'content-language') {
        var v = (metas[i].getAttribute('content') || '').slice(0, 2).toLowerCase();
        if (SUPPORTED.indexOf(v) !== -1) return v;
      }
    }
    return '';
  }

  // URLs are /<country>/<language>/..., e.g. /de/en/ is Germany in English — so the SECOND
  // segment is the language. Reading the first one would call that page German.
  function langFromPath() {
    var parts = location.pathname.toLowerCase().split('/').filter(Boolean);
    return (parts.length > 1 && SUPPORTED.indexOf(parts[1]) !== -1) ? parts[1] : '';
  }

  // <html lang> is not consulted: the site had it hardcoded to "ru" everywhere and has now
  // removed it altogether.
  var L = String(A('lang', '') || langFromMeta() || langFromPath() || navigator.language || 'en')
            .slice(0, 2).toLowerCase();
  var NAME = 'Toni';
  var STR = {
    en: { title: NAME, sub: 'GAUDI AI assistant', ph: 'Write a message…', send: 'Send',
          open: 'Chat with us', close: 'Close chat',
          consent: 'To answer you, we keep this conversation.', policy: 'Privacy policy',
          accept: 'Start chat', hint: 'Ask about decor, sizes, delivery', typing: 'typing…',
          slow: 'Still working on it…', err: 'Connection problem. Try again.',
          manager: 'manager', contactCta: 'Leave your phone number and we will reply',
          email: 'E-mail', name: 'Name (optional)', save: 'Send', saved: 'Thank you — we will be in touch.' , invite: 'Need a hand choosing? Ask me about sizes, styles or delivery.' , phonePh: 'Phone number', barText: 'Leave a phone number so this chat is not lost', barCta: 'Add', barSaved: 'Saved — thank you.' , tg: 'Continue in Telegram' },
    ru: { title: NAME, sub: 'ИИ-ассистент GAUDI', ph: 'Напишите сообщение…', send: 'Отправить',
          open: 'Написать нам', close: 'Закрыть чат',
          consent: 'Чтобы ответить, мы сохраняем переписку.', policy: 'Политика конфиденциальности',
          accept: 'Начать чат', hint: 'Спросите про декор, размеры, доставку', typing: 'печатает…',
          slow: 'Ещё думаю…', err: 'Проблема со связью. Попробуйте ещё раз.',
          manager: 'менеджер', contactCta: 'Оставьте телефон, и мы ответим',
          email: 'E-mail', name: 'Имя (необязательно)', save: 'Отправить', saved: 'Спасибо, мы свяжемся с вами.' , invite: 'Помочь с подбором? Спросите про размеры, стиль или доставку.' , phonePh: 'Телефон', barText: 'Оставьте номер, чтобы не потерять диалог', barCta: 'Добавить', barSaved: 'Сохранено, спасибо.' , tg: 'Продолжить в Telegram' },
    de: { title: NAME, sub: 'KI-Assistent von GAUDI', ph: 'Nachricht schreiben…', send: 'Senden',
          open: 'Schreiben Sie uns', close: 'Chat schließen',
          consent: 'Um zu antworten, speichern wir diesen Chat.', policy: 'Datenschutz',
          accept: 'Chat starten', hint: 'Fragen zu Dekor, Maßen, Lieferung', typing: 'schreibt…',
          slow: 'Einen Moment noch…', err: 'Verbindungsproblem. Bitte erneut versuchen.',
          manager: 'Berater', contactCta: 'Telefonnummer hinterlassen, wir melden uns',
          email: 'E-Mail', name: 'Name (optional)', save: 'Senden', saved: 'Danke — wir melden uns.' , invite: 'Brauchen Sie Hilfe bei der Auswahl? Fragen Sie nach Maßen, Stilen oder Lieferung.' , phonePh: 'Telefonnummer', barText: 'Nummer hinterlassen, damit der Chat nicht verloren geht', barCta: 'Hinzufügen', barSaved: 'Gespeichert — danke.' , tg: 'In Telegram fortsetzen' },
    fr: { title: NAME, sub: 'Assistant IA de GAUDI', ph: 'Écrivez un message…', send: 'Envoyer',
          open: 'Écrivez-nous', close: 'Fermer',
          consent: 'Pour vous répondre, nous conservons cette conversation.', policy: 'Confidentialité',
          accept: 'Démarrer', hint: 'Décor, dimensions, livraison', typing: 'écrit…',
          slow: 'Je réfléchis encore…', err: 'Problème de connexion. Réessayez.',
          manager: 'conseiller', contactCta: 'Laissez votre numéro, nous vous rappellerons',
          email: 'E-mail', name: 'Nom (facultatif)', save: 'Envoyer', saved: 'Merci — nous vous recontactons.' , invite: 'Besoin d’aide pour choisir ? Dimensions, styles, livraison — demandez.' , phonePh: 'Numéro de téléphone', barText: 'Laissez un numéro pour ne pas perdre la conversation', barCta: 'Ajouter', barSaved: 'Enregistré — merci.' , tg: 'Continuer sur Telegram' },
    es: { title: NAME, sub: 'Asistente de IA de GAUDI', ph: 'Escriba un mensaje…', send: 'Enviar',
          open: 'Escríbanos', close: 'Cerrar',
          consent: 'Para responderle, guardamos esta conversación.', policy: 'Privacidad',
          accept: 'Empezar', hint: 'Decoración, medidas, envío', typing: 'escribiendo…',
          slow: 'Sigo pensando…', err: 'Problema de conexión. Inténtelo de nuevo.',
          manager: 'gestor', contactCta: 'Deje su teléfono y le responderemos',
          email: 'E-mail', name: 'Nombre (opcional)', save: 'Enviar', saved: 'Gracias, le contactaremos.' , invite: '¿Le ayudo a elegir? Pregunte por medidas, estilos o envío.' , phonePh: 'Número de teléfono', barText: 'Deje un número para no perder la conversación', barCta: 'Añadir', barSaved: 'Guardado — gracias.' , tg: 'Continuar en Telegram' },
    it: { title: NAME, sub: 'Assistente IA di GAUDI', ph: 'Scrivi un messaggio…', send: 'Invia',
          open: 'Scrivici', close: 'Chiudi',
          consent: 'Per risponderti conserviamo questa conversazione.', policy: 'Privacy',
          accept: 'Inizia', hint: 'Decori, misure, spedizione', typing: 'sta scrivendo…',
          slow: 'Ci sto ancora lavorando…', err: 'Problema di connessione. Riprova.',
          manager: 'referente', contactCta: 'Lascia il tuo numero, ti ricontattiamo',
          email: 'E-mail', name: 'Nome (facoltativo)', save: 'Invia', saved: 'Grazie, ti contatteremo.' , invite: 'Ti aiuto a scegliere? Chiedi di misure, stili o spedizione.' , phonePh: 'Numero di telefono', barText: 'Lascia un numero per non perdere la conversazione', barCta: 'Aggiungi', barSaved: 'Salvato — grazie.' , tg: 'Continua su Telegram' },
    nl: { title: NAME, sub: 'AI-assistent van GAUDI', ph: 'Schrijf een bericht…', send: 'Versturen',
          open: 'Schrijf ons', close: 'Sluiten',
          consent: 'Om te antwoorden bewaren wij dit gesprek.', policy: 'Privacybeleid',
          accept: 'Start chat', hint: 'Decor, maten, levering', typing: 'typt…',
          slow: 'Nog even…', err: 'Verbindingsprobleem. Probeer opnieuw.',
          manager: 'medewerker', contactCta: 'Laat uw telefoonnummer achter, wij reageren',
          email: 'E-mail', name: 'Naam (optioneel)', save: 'Versturen', saved: 'Dank u — wij nemen contact op.' , invite: 'Hulp bij het kiezen? Vraag naar maten, stijlen of levering.' , phonePh: 'Telefoonnummer', barText: 'Laat een nummer achter zodat dit gesprek niet verloren gaat', barCta: 'Toevoegen', barSaved: 'Opgeslagen — dank u.' , tg: 'Verder in Telegram' },
    pl: { title: NAME, sub: 'Asystent AI GAUDI', ph: 'Napisz wiadomość…', send: 'Wyślij',
          open: 'Napisz do nas', close: 'Zamknij',
          consent: 'Aby odpowiedzieć, zachowujemy tę rozmowę.', policy: 'Prywatność',
          accept: 'Rozpocznij', hint: 'Dekory, wymiary, dostawa', typing: 'pisze…',
          slow: 'Jeszcze myślę…', err: 'Problem z połączeniem. Spróbuj ponownie.',
          manager: 'opiekun', contactCta: 'Zostaw numer telefonu, odezwiemy się',
          email: 'E-mail', name: 'Imię (opcjonalnie)', save: 'Wyślij', saved: 'Dziękujemy — odezwiemy się.' , invite: 'Pomóc w wyborze? Zapytaj o wymiary, style lub dostawę.' , phonePh: 'Numer telefonu', barText: 'Zostaw numer, aby nie zgubić rozmowy', barCta: 'Dodaj', barSaved: 'Zapisano — dziękujemy.' , tg: 'Kontynuuj w Telegramie' }
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

  form.composer { position: relative; display: flex; gap: 8px; padding: 12px; border-top: 1px solid rgba(0,0,0,.07);
                  background: #fff; }
  textarea { flex: 1; resize: none; border: 1px solid rgba(0,0,0,.14); border-radius: 10px;
             padding: 10px 12px; font-size: 14.5px; line-height: 1.4; max-height: 120px;
             outline: none; background: #fbfaf8; }
  textarea:focus { border-color: ${ACCENT}; }
  .go { background: ${ACCENT}; color: #fff; border: none; border-radius: 10px; width: 42px;
        cursor: pointer; flex: none; display: grid; place-items: center; }
  .go:disabled { opacity: .45; cursor: default; }

  /* "continue in Telegram": a small rounded square above the send button. Hidden until the
     composer is hovered or focused on pointer devices; always visible (dimmed) on touch, where
     there is no hover at all. */
  .tg {
    position: absolute; right: 19px; bottom: 70px; width: 22px; height: 22px; border-radius: 7px;
    background: #2aabee; border: none; display: grid; place-items: center; cursor: pointer;
    box-shadow: 0 3px 9px rgba(0,0,0,.25); padding: 0;
    opacity: 0; transform: translateY(5px) scale(.85);
    transition: opacity .16s ease, transform .16s ease;
  }
  .tg svg { width: 12px; height: 12px; fill: #fff; }
  .composer:hover .tg, .composer:focus-within .tg, .tg:focus-visible { opacity: 1; transform: none; }
  .tg:focus-visible { outline: 2px solid ${ACCENT}; outline-offset: 2px; }
  @media (hover: none) { .tg { opacity: .55; transform: none; } }
  .tg[hidden] { display: none !important; }
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
  .teaser .tx {
    background: transparent; border: none; color: #97918f; font-size: 17px; line-height: 1;
    cursor: pointer; padding: 2px 3px; margin: -3px -2px 0 0; border-radius: 5px; flex: none;
  }
  .teaser .tx:hover { background: rgba(0,0,0,.06); color: #1c1c1a; }
  @media (max-width: 480px) { .teaser { max-width: calc(100vw - 92px); ${SIDE}: 16px; } }

  /* amber strip under the header: visible but not a modal — the visitor can ignore it */
  .bar {
    display: flex; align-items: center; gap: 9px; padding: 10px 12px;
    background: #fdf1ce; border-bottom: 1px solid #eedda2; color: #6b5518;
    font-size: 13px; line-height: 1.35; cursor: pointer;
  }
  .bar[hidden] { display: none !important; }
  .bar .txt { flex: 1; }
  .bar .go2 { background: #6b5518; color: #fff; border: none; border-radius: 7px;
              padding: 6px 11px; font-size: 12.5px; cursor: pointer; flex: none; }
  .bar form { display: flex; gap: 7px; width: 100%; }
  .bar input { flex: 1; min-width: 0; border: 1px solid #dfc98a; border-radius: 7px;
               padding: 7px 9px; font-size: 13px; outline: none; background: #fffdf6; }
  .bar input:focus { border-color: #6b5518; }
  .bar.done { background: #eef5ec; border-bottom-color: #cfe0cb; color: #335c3a; cursor: default; }

  .gate .phone { border: 1px solid rgba(0,0,0,.14); border-radius: 10px; padding: 10px 12px;
                 font-size: 14.5px; outline: none; width: 100%; }
  .gate .phone:focus { border-color: ${ACCENT}; }

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

  /* Narrow screens: the site keeps a fixed bottom menu there, so the launcher and the invite
     get their own offset (data-offset-mobile) above whatever that menu occupies. */
  @media (max-width: ${MOB_BP}px) {
    .launcher { ${SIDE}: 16px; bottom: ${MOB_OFFSET}px; }
    .teaser { bottom: ${MOB_OFFSET + 58}px; }
  }
  @media (max-width: 480px) {
    .panel { ${SIDE}: 0; bottom: 0; width: 100vw; max-width: 100vw; height: 100dvh;
             max-height: 100dvh; border-radius: 0; }
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
      '<button class="tx" aria-label="' + esc(T.close) + '">&times;</button></aside>' +
    '<section class="panel" role="dialog" aria-modal="false" aria-label="' + esc(T.title + ' — ' + T.sub) + '">' +
      '<header><div><div class="t">' + esc(T.title) + '</div><div class="s">' + esc(T.sub) + '</div></div>' +
        '<div class="grow"></div><button class="x" aria-label="' + esc(T.close) + '">&times;</button></header>' +
      '<div class="gate" hidden><p>' + esc(T.consent) +
        (POLICY ? ' <a href="' + encodeURI(POLICY) + '" target="_blank" rel="noopener noreferrer">' + esc(T.policy) + '</a>' : '') +
        '</p><input class="phone" type="text" inputmode="tel" autocomplete="tel" placeholder="' +
        esc(T.phonePh) + '"><button class="ok">' + esc(T.accept) + '</button></div>' +
      '<aside class="bar" hidden><span class="txt">' + esc(T.barText) + '</span>' +
        '<button class="go2" type="button">' + esc(T.barCta) + '</button></aside>' +
      '<div class="thread" role="log" aria-live="polite"></div>' +
      '<form class="composer" hidden>' +
        '<button class="tg" type="button" title="' + esc(T.tg) + '" aria-label="' + esc(T.tg) + '">' +
          '<svg viewBox="0 0 24 24"><path d="M21.9 4.3 18.9 19c-.2 1-.8 1.2-1.6.8l-4.5-3.3-2.2 2.1c-.2.2-.4.4-.9.4l.3-4.6L18.4 7c.4-.3-.1-.5-.6-.2L7.5 13.3l-4.4-1.4c-1-.3-1-1 .2-1.4l17.2-6.6c.8-.3 1.5.2 1.4 1.4Z"/></svg>' + '</button>' +
        '<textarea rows="1" placeholder="' + esc(T.ph) + '" maxlength="2000"></textarea>' +
        '<button class="go" type="submit" aria-label="' + esc(T.send) + '">' + ICON_SEND + '</button></form>' +
      '<form class="contact" hidden><p>' + esc(T.contactCta) + '</p>' +
        '<input name="name" placeholder="' + esc(T.name) + '" autocomplete="name">' +
        '<input name="phone" type="text" inputmode="tel" placeholder="' + esc(T.phonePh) + '" autocomplete="tel" required>' +
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
    if (m.role !== 'client') m = { ...m, body: handleMarker(String(m.body || '')) };
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
        if (m.role !== 'client') { fastUntil = 0; setTimeout(function () { showBar(false); }, 1200); }        // answer arrived: back to the lazy cadence
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
  $('.panel .x').addEventListener('click', close);
  root.addEventListener('keydown', function (e) { if (e.key === 'Escape' && opened) close(); });

  $('.ok').addEventListener('click', function () {
    var typed = $('.gate .phone') ? $('.gate .phone').value : '';
    api('/consent', { sid: sid, granted: true, text: T.consent, page_url: location.href, lang: L })
      .then(function () { return typed ? saveContact(typed) : null; })
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
    api('/contact', { sid: sid, name: f.get('name') || '', phone: f.get('phone') || '' })
      .then(function () {
        contact.hidden = true; contactGiven = true; bar.hidden = true;
        try { localStorage.setItem('gaudi_contact_given', '1'); } catch (e) {}
        note(T.saved);
      })
      .catch(function () { note(T.err); });
  });

  // ---------------------------------------------------------------- contact capture
  // The phone is never required: it is optional on the consent screen, and afterwards it lives in
  // an amber strip under the header that the visitor can ignore. The strip also opens on demand —
  // the agent emits [[contact]] when it reaches a point where leaving a contact makes sense
  // (a shortlist to send, a quote to follow up), and that marker is stripped from the text.
  var bar = $('.bar'), contactGiven = false;
  var CONTACT_KEY = 'gaudi_contact_given';
  try { contactGiven = !!localStorage.getItem(CONTACT_KEY); } catch (e) {}

  function saveContact(value) {
    var v = String(value || '').trim();
    if (!v) return Promise.resolve(false);
    var body = { sid: sid };
    body[v.indexOf('@') > 0 ? 'email' : 'phone'] = v;
    return api('/contact', body).then(function () {
      contactGiven = true;
      try { localStorage.setItem(CONTACT_KEY, '1'); } catch (e) {}
      return true;
    }).catch(function () { return false; });
  }

  function showBar(expanded) {
    if (contactGiven) { bar.hidden = true; return; }
    bar.hidden = false;
    if (expanded) openBarForm();
  }

  function openBarForm() {
    if (bar.querySelector('form') || contactGiven) return;
    var f = document.createElement('form');
    f.innerHTML = '<input type="text" inputmode="tel" autocomplete="tel" placeholder="' +
                  esc(T.phonePh) + '"><button class="go2" type="submit">' + esc(T.barCta) + '</button>';
    bar.innerHTML = '';
    bar.appendChild(f);
    f.querySelector('input').focus();
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      saveContact(f.querySelector('input').value).then(function (ok) {
        if (!ok) return;
        bar.classList.add('done');
        bar.innerHTML = '<span class="txt">' + esc(T.barSaved) + '</span>';
        setTimeout(function () { bar.hidden = true; }, 2600);
      });
    });
  }

  bar.addEventListener('click', function (e) {
    if (!bar.querySelector('form') && !bar.classList.contains('done')) openBarForm();
  });

  // [[contact]] anywhere in a bot reply opens the strip; it is never shown to the visitor
  var CONTACT_MARK = /\[\[contact\]\]/gi;
  function handleMarker(text) {
    if (!CONTACT_MARK.test(text)) return text;
    CONTACT_MARK.lastIndex = 0;
    setTimeout(function () { showBar(true); }, 300);
    return text.replace(CONTACT_MARK, '').replace(/\s{2,}/g, ' ').trim();
  }

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

  // A short, soft click when the invite appears. Synthesised with WebAudio so nothing extra is
  // downloaded. Browsers block audio until the visitor has interacted with the page, so this is
  // best-effort by design: if the context cannot start, we stay silent rather than retry.
  // Skipped for visitors who asked for reduced motion — they generally want less of everything.
  function playClick() {
    if (!INVITE_SOUND) return;
    try {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      var ctx = new Ctx();
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
      var t = ctx.currentTime;
      var osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(540, t + 0.05);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.05, t + 0.008);   // quiet on purpose
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
      osc.onended = function () { try { ctx.close(); } catch (e) {} };
    } catch (e) { /* audio unavailable — the invite is still visible */ }
  }

  function showInvite() {
    if (!inviteAllowed()) return;
    teaser.hidden = false;
    // setTimeout, not requestAnimationFrame: rAF is frozen while the tab is in the background,
    // which left the bubble in the DOM but permanently at opacity 0.
    setTimeout(function () { teaser.classList.add('in'); }, 20);
    playClick();
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
      if (e.target.closest('.tx')) { hideInvite(true); return; }
      hideInvite(false);
      open();
      note(INVITE_TEXT || T.invite);        // carry the greeting into the thread
    });
  }

  // ---------------------------------------------------------------- continue in Telegram
  // Opens the bot with a single-use code so the same conversation carries on there. The window is
  // opened synchronously on the click and its location filled in afterwards — opening it inside
  // the fetch callback would be blocked as a pop-up.
  var tgBtn = $('.tg');
  if (tgBtn) {
    tgBtn.addEventListener('click', function () {
      var w = window.open('', '_blank');
      api('/tg-link', { sid: sid, page_url: location.href, lang: L })
        .then(function (d) {
          if (d && d.url) { if (w) w.location.href = d.url; else location.href = d.url; }
          else if (w) w.close();
        })
        .catch(function () { if (w) w.close(); note(T.err); });
    });
  }

  // public hook so the site can open the chat from its own button
  window.gaudiChat = { open: open, close: close, askContact: function () { contact.hidden = false; } };
})();
