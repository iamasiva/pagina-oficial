// Chat en vivo del bootcamp (fase 4 del plan maestro).
//
// Worker: recibe /sala/<n>?t=<ticket>, verifica la firma HMAC del ticket que
// emitió api/bootcamp-chat-ticket.js en Vercel (mismo secreto CHAT_TICKET_SECRET)
// y pasa la conexión a la sala de esa clase. No consulta ninguna base.
//
// SalaChat (Durable Object, una por clase): acepta WebSockets con la API de
// hibernación, guarda en su almacenamiento el modo, el anuncio, los últimos
// mensajes y las preguntas, aplica límites por usuario y reparte los mensajes.
// Si este chat se cae, el video no se entera: son componentes separados.

const MAX_TEXTO = 280;
const HISTORIAL = 150;
const MODOS = new Set(['normal', 'slow_mode', 'questions_only', 'read_only', 'off']);
const ESPERA_MS = { normal: 2000, slow_mode: 30000, questions_only: 10000 };

const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const deB64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

async function verificarTicket(ticket, secreto) {
  if (!ticket || !secreto) return null;
  const partes = ticket.split('.');
  if (partes.length !== 2) return null;
  const [cuerpo, firma] = partes;
  const llave = await crypto.subtle.importKey('raw', new TextEncoder().encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('HMAC', llave, deB64url(firma), new TextEncoder().encode(cuerpo));
  if (!ok) return null;
  let claims;
  try { claims = JSON.parse(new TextDecoder().decode(deB64url(cuerpo))); } catch (_) { return null; }
  if (!claims?.u || !claims?.n || !claims?.exp || claims.exp < Date.now() / 1000) return null;
  return claims;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/salud') return new Response('ok', { headers: { 'cache-control': 'no-store' } });
    const m = url.pathname.match(/^\/sala\/(\d{1,2})$/);
    if (!m) return new Response('No encontrado', { status: 404 });
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('Se esperaba una conexión WebSocket', { status: 426 });
    const claims = await verificarTicket(url.searchParams.get('t'), env.CHAT_TICKET_SECRET);
    if (!claims || String(claims.n) !== m[1]) return new Response('Ticket inválido', { status: 401 });
    const stub = env.SALAS.get(env.SALAS.idFromName('clase-' + m[1]));
    const cabeceras = new Headers(req.headers);
    cabeceras.set('x-claims', JSON.stringify(claims));
    return stub.fetch(new Request(req.url, { headers: cabeceras }));
  },
};

export class SalaChat {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async estado() {
    if (!this._estado) {
      const [modo, anuncio, mensajes, preguntas, silenciados] = await Promise.all([
        this.state.storage.get('modo'), this.state.storage.get('anuncio'), this.state.storage.get('mensajes'),
        this.state.storage.get('preguntas'), this.state.storage.get('silenciados'),
      ]);
      this._estado = { modo: modo || 'normal', anuncio: anuncio || '', mensajes: mensajes || [], preguntas: preguntas || [], silenciados: silenciados || {} };
    }
    return this._estado;
  }

  async guardar(campo) {
    const e = await this.estado();
    await this.state.storage.put(campo, e[campo]);
  }

  async fetch(req) {
    let claims;
    try { claims = JSON.parse(req.headers.get('x-claims') || 'null'); } catch (_) {}
    if (!claims) return new Response('Sin ticket', { status: 401 });
    const e = await this.estado();
    if (e.modo === 'off' && claims.r !== 'admin') return new Response('El chat está cerrado', { status: 403 });
    const par = new WebSocketPair();
    const [cliente, servidor] = [par[0], par[1]];
    servidor.serializeAttachment({ u: claims.u, a: claims.a || 'Alumno', r: claims.r || 'alumno', ultimo: 0 });
    this.state.acceptWebSocket(servidor, [claims.u]);
    servidor.send(JSON.stringify({ t: 'hola', modo: e.modo, anuncio: e.anuncio, mensajes: e.mensajes.slice(-60), preguntas: e.preguntas.slice(-60), rol: claims.r || 'alumno', alias: claims.a || 'Alumno', conectados: this.state.getWebSockets().length }));
    return new Response(null, { status: 101, webSocket: cliente });
  }

  difundir(obj, filtro) {
    const texto = JSON.stringify(obj);
    for (const ws of this.state.getWebSockets()) {
      try { if (!filtro || filtro(ws)) ws.send(texto); } catch (_) {}
    }
  }

  async webSocketMessage(ws, datos) {
    const e = await this.estado();
    const quien = ws.deserializeAttachment() || {};
    let m;
    try { m = JSON.parse(typeof datos === 'string' ? datos : new TextDecoder().decode(datos)); } catch (_) { return; }
    if (!m || typeof m.t !== 'string') return;
    const esAdmin = quien.r === 'admin';
    const ahora = Date.now();

    if (m.t === 'ping') { ws.send('{"t":"pong"}'); return; }

    // Moderación: solo admin
    if (esAdmin) {
      if (m.t === 'modo' && MODOS.has(m.modo)) { e.modo = m.modo; await this.guardar('modo'); this.difundir({ t: 'modo', modo: e.modo }); return; }
      if (m.t === 'anuncio') { e.anuncio = String(m.texto || '').slice(0, 300); await this.guardar('anuncio'); this.difundir({ t: 'anuncio', texto: e.anuncio }); return; }
      if (m.t === 'borrar' && m.id) {
        e.mensajes = e.mensajes.filter(x => x.id !== m.id); e.preguntas = e.preguntas.filter(x => x.id !== m.id);
        await Promise.all([this.guardar('mensajes'), this.guardar('preguntas')]); this.difundir({ t: 'borrar', id: m.id }); return;
      }
      if (m.t === 'destacar' && m.id) {
        const p = e.preguntas.find(x => x.id === m.id); if (p) { p.destacada = !p.destacada; await this.guardar('preguntas'); this.difundir({ t: 'pregunta', p }); } return;
      }
      if (m.t === 'respondida' && m.id) {
        const p = e.preguntas.find(x => x.id === m.id); if (p) { p.respondida = true; await this.guardar('preguntas'); this.difundir({ t: 'pregunta', p }); } return;
      }
      if (m.t === 'silenciar' && m.u) {
        const minutos = Math.min(Math.max(Number(m.min) || 10, 1), 600);
        e.silenciados[m.u] = ahora + minutos * 60000; await this.guardar('silenciados');
        this.difundir({ t: 'error', texto: `Quedaste en silencio ${minutos} min por moderación.` }, (s) => (s.deserializeAttachment() || {}).u === m.u);
        return;
      }
      if (m.t === 'limpiar') { e.mensajes = []; await this.guardar('mensajes'); this.difundir({ t: 'limpiar' }); return; }
    }

    if (m.t !== 'msg' && m.t !== 'pregunta') return;
    const texto = String(m.texto || '').replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').trim().slice(0, MAX_TEXTO);
    if (!texto) return;

    if (!esAdmin) {
      if (e.modo === 'off' || e.modo === 'read_only') { ws.send(JSON.stringify({ t: 'error', texto: 'El chat está en solo lectura.' })); return; }
      if (e.modo === 'questions_only' && m.t !== 'pregunta') { ws.send(JSON.stringify({ t: 'error', texto: 'Ahora solo se reciben preguntas para Sergio.' })); return; }
      if ((e.silenciados[quien.u] || 0) > ahora) { ws.send(JSON.stringify({ t: 'error', texto: 'Estás en silencio por moderación.' })); return; }
      const espera = ESPERA_MS[e.modo] ?? 2000;
      if (ahora - (quien.ultimo || 0) < espera) { ws.send(JSON.stringify({ t: 'error', texto: `Espera ${Math.ceil((espera - (ahora - quien.ultimo)) / 1000)} s antes de enviar otro mensaje.` })); return; }
      if (/https?:\/\/|www\./i.test(texto)) { ws.send(JSON.stringify({ t: 'error', texto: 'En el chat no se pueden compartir enlaces.' })); return; }
      quien.ultimo = ahora; ws.serializeAttachment(quien);
    }

    const registro = { id: crypto.randomUUID(), u: quien.u, a: quien.a, r: quien.r, texto, ts: ahora };
    if (m.t === 'msg') {
      e.mensajes.push(registro); if (e.mensajes.length > HISTORIAL) e.mensajes = e.mensajes.slice(-HISTORIAL);
      await this.guardar('mensajes'); this.difundir({ t: 'msg', m: registro });
    } else {
      registro.destacada = false; registro.respondida = false;
      e.preguntas.push(registro); if (e.preguntas.length > HISTORIAL) e.preguntas = e.preguntas.slice(-HISTORIAL);
      await this.guardar('preguntas'); this.difundir({ t: 'pregunta', p: registro });
    }
  }

  async webSocketClose(ws) { try { ws.close(); } catch (_) {} }
  async webSocketError(ws) { try { ws.close(); } catch (_) {} }
}
