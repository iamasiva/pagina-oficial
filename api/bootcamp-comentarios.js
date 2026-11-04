// Comentarios de una clase del bootcamp en repetición (tabla bootcamp_comentarios,
// sql/bootcamp-comentarios.sql). Sustituyen al chat cuando la clase ya terminó.
//
//   GET    /api/bootcamp-comentarios?clase=1          lista (hilos de un nivel)
//   POST   /api/bootcamp-comentarios  { clase, texto, parent_id? }
//   DELETE /api/bootcamp-comentarios?id=<uuid>        borra el propio; quien modera, cualquiera
//
// Mismo control de acceso que el ticket del video: sesión + compra aprobada del
// bootcamp (o admin / equipo). Se escribe solo con la clase terminada
// (ended_pending_upload o evergreen_ready); quien modera, en cualquier estado.
import { adminClient, userFromRequest } from './_lib.js';

const PRODUCT_ID = '6c01d354-e05d-47be-a6d6-3075abcc16d3';
const ABIERTOS = ['ended_pending_upload', 'evergreen_ready'];
const PAUSA_SEG = 20;      // entre dos comentarios de la misma persona
const MAX_LISTA = 500;

function alias(perfil, user) {
  const nombre = String(perfil?.nombre ?? user?.user_metadata?.nombre ?? '').trim();
  if (nombre) {
    const [primero, segundo] = nombre.split(/\s+/);
    return (primero + (segundo ? ' ' + segundo[0] + '.' : '')).slice(0, 24);
  }
  return 'Alumno';
}

function publico(c, uid) {
  return { id: c.id, nombre: c.nombre, texto: c.texto, parent_id: c.parent_id, es_equipo: c.es_equipo, creado_en: c.creado_en, mio: c.user_id === uid };
}

export default async function handler(req, res) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    if (!['GET', 'POST', 'DELETE'].includes(req.method)) return res.status(405).json({ error: 'Método no permitido' });

    const user = await userFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Inicia sesión para ver los comentarios' });

    const body = req.method === 'POST' ? (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})) : {};
    const db = adminClient();

    // DELETE: solo hace falta saber quién es y si modera
    if (req.method === 'DELETE') {
      const id = String(req.query.id || '');
      if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: 'Comentario inválido' });
      const [{ data: perfil }, { data: equipo }, { data: fila }] = await Promise.all([
        db.from('profiles').select('es_admin').eq('id', user.id).maybeSingle(),
        db.from('bootcamp_equipo').select('*').eq('product_id', PRODUCT_ID).eq('email', String(user.email ?? '').toLowerCase()).maybeSingle(),
        db.from('bootcamp_comentarios').select('id, user_id').eq('id', id).eq('product_id', PRODUCT_ID).maybeSingle(),
      ]);
      const modera = !!perfil?.es_admin || equipo?.modera === true;
      if (!fila) return res.status(404).json({ error: 'Comentario no encontrado' });
      if (!modera && fila.user_id !== user.id) return res.status(403).json({ error: 'Solo puedes borrar tus comentarios' });
      // Se borra el hilo completo (las respuestas cuelgan del comentario)
      const { error } = await db.from('bootcamp_comentarios').update({ borrado: true }).or(`id.eq.${id},parent_id.eq.${id}`);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    const numero = Number(req.method === 'GET' ? req.query.clase : body.clase);
    if (!Number.isInteger(numero) || numero < 1 || numero > 9) return res.status(400).json({ error: 'Clase inválida' });

    const [{ data: perfil }, { data: compra }, { data: config }, { data: clase }, { data: equipo }] = await Promise.all([
      db.from('profiles').select('es_admin, nombre').eq('id', user.id).maybeSingle(),
      db.from('purchases').select('id').eq('user_id', user.id).eq('product_id', PRODUCT_ID).eq('estado', 'APROBADA').limit(1).maybeSingle(),
      db.from('bootcamp_config').select('admin_only').eq('product_id', PRODUCT_ID).maybeSingle(),
      db.from('bootcamp_clases').select('numero, estado').eq('product_id', PRODUCT_ID).eq('numero', numero).maybeSingle(),
      db.from('bootcamp_equipo').select('*').eq('product_id', PRODUCT_ID).eq('email', String(user.email ?? '').toLowerCase()).maybeSingle(),
    ]);
    const esAdmin = !!perfil?.es_admin;
    const acceso = esAdmin || !!equipo;
    const modera = esAdmin || equipo?.modera === true;
    if (!acceso) {
      if (!compra) return res.status(403).json({ error: 'Los comentarios son para compradores del bootcamp' });
      if (!config || config.admin_only) return res.status(403).json({ error: 'El bootcamp todavía no está abierto' });
    }
    if (!clase) return res.status(404).json({ error: 'Clase no encontrada' });
    const abierto = modera || ABIERTOS.includes(clase.estado);

    if (req.method === 'GET') {
      const { data, error } = await db.from('bootcamp_comentarios')
        .select('id, user_id, nombre, texto, parent_id, es_equipo, creado_en')
        .eq('product_id', PRODUCT_ID).eq('numero', numero).eq('borrado', false)
        .order('creado_en', { ascending: true }).limit(MAX_LISTA);
      // Tabla aún no creada (42P01 en Postgres, PGRST205 en la caché de PostgREST): aviso amable, no el error crudo
      const sinTabla = error && (error.code === '42P01' || error.code === 'PGRST205' || /bootcamp_comentarios/.test(error.message || ''));
      if (error) return res.status(sinTabla ? 503 : 500).json({ error: sinTabla ? 'Los comentarios estarán disponibles en un momento' : error.message });
      return res.status(200).json({ abierto, modera, nombre: alias(perfil, user), comentarios: (data || []).map(c => publico(c, user.id)) });
    }

    // POST
    if (!abierto) return res.status(409).json({ error: 'Los comentarios se abren cuando termina la clase' });
    const texto = String(body.texto ?? '').replace(/\r\n?/g, '\n').trim().slice(0, 1000);
    if (!texto) return res.status(400).json({ error: 'Escribe algo primero' });
    let parent_id = body.parent_id ? String(body.parent_id) : null;
    if (parent_id) {
      if (!/^[0-9a-f-]{36}$/i.test(parent_id)) return res.status(400).json({ error: 'Respuesta inválida' });
      const { data: padre } = await db.from('bootcamp_comentarios').select('id, parent_id, numero, borrado').eq('id', parent_id).eq('product_id', PRODUCT_ID).maybeSingle();
      if (!padre || padre.borrado || padre.numero !== numero) return res.status(404).json({ error: 'Ese comentario ya no está' });
      if (padre.parent_id) parent_id = padre.parent_id;   // un solo nivel: la respuesta a una respuesta cuelga del hilo
    }
    if (!modera) {
      const desde = new Date(Date.now() - PAUSA_SEG * 1000).toISOString();
      const { data: reciente } = await db.from('bootcamp_comentarios').select('id').eq('user_id', user.id).gte('creado_en', desde).limit(1).maybeSingle();
      if (reciente) return res.status(429).json({ error: `Espera ${PAUSA_SEG} segundos entre comentarios` });
    }
    const fila = { product_id: PRODUCT_ID, numero, user_id: user.id, nombre: alias(perfil, user), texto, parent_id, es_equipo: modera };
    const { data, error } = await db.from('bootcamp_comentarios').insert(fila).select('id, user_id, nombre, texto, parent_id, es_equipo, creado_en').single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ comentario: publico(data, user.id) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
