// POST /api/hotmart-webhook
// Recibe los eventos del Webhook 2.0 de Hotmart. Antes de confiar en nada,
// compara el token de la cabecera X-HOTMART-HOTTOK con HOTMART_HOTTOK (el
// que Hotmart muestra al crear el webhook en Herramientas > Webhook).
// Solo el servidor escribe estados de compra; el navegador jamás toca esto.
//
// Qué hace:
// - PURCHASE_APPROVED / PURCHASE_COMPLETE: habilita el producto. Si la compra
//   nació en pago.html, llega con nuestro código en purchase.sckPaymentLink
//   (el parámetro sck del link) y se actualiza esa fila PENDIENTE. Si llegó
//   por un link directo de Hotmart, se crea la fila con el correo del
//   comprador (user_id null) y /api/reclamar la engancha al registrarse.
//   Un pack desbloquea sus piezas (gateway 'bundle'), igual que con Wompi.
// - PURCHASE_REFUNDED / PURCHASE_CHARGEBACK / PURCHASE_CANCELED: quita el
//   acceso a la compra y a las piezas del pack (estado ANULADA: la tabla solo
//   admite PENDIENTE, APROBADA, DECLINADA, ANULADA y ERROR, y el acceso lo da
//   únicamente APROBADA).
// - Todo evento queda en hotmart_eventos (si la tabla existe) para depurar.
// Idempotente: Hotmart reintenta, y una transacción ya aprobada no se toca.
import crypto from 'node:crypto';
import { adminClient, componentesDelPack } from './_lib.js';
import { enviarEventoMeta } from './_meta.js';

const EVENTOS_ACCESO = new Set(['PURCHASE_APPROVED', 'PURCHASE_COMPLETE']);
const EVENTOS_REVOCAN = new Set(['PURCHASE_REFUNDED', 'PURCHASE_CHARGEBACK', 'PURCHASE_CANCELED']);

function tokenValido(req) {
  const recibido = Buffer.from(String(req.headers['x-hotmart-hottok'] ?? ''));
  const esperado = Buffer.from(String(process.env.HOTMART_HOTTOK ?? ''));
  if (!recibido.length || !esperado.length || recibido.length !== esperado.length) return false;
  return crypto.timingSafeEqual(recibido, esperado);
}

// El producto nuestro que corresponde al producto de Hotmart: primero la
// columna products.hotmart_id; si no existe aún, el mapa HOTMART_PRODUCTOS
// de las variables de entorno ({"id_hotmart": "uuid_nuestro"}).
async function productoNuestro(db, productoH) {
  const claves = [productoH?.id, productoH?.ucode].filter(v => v !== undefined && v !== null).map(String);
  if (!claves.length) return null;
  const columnas = 'id, guide_id, nombre, precio_usd_centavos, precio_promo_usd_centavos';
  const { data, error } = await db.from('products').select(columnas + ', hotmart_id').in('hotmart_id', claves).limit(1);
  if (!error && data?.length) return data[0];
  try {
    const mapa = JSON.parse(process.env.HOTMART_PRODUCTOS || '{}');
    const id = claves.map(c => mapa[c]).find(Boolean);
    if (id) {
      const { data: p } = await db.from('products').select(columnas).eq('id', id).maybeSingle();
      return p ?? null;
    }
  } catch (e) { /* mapa mal escrito: se trata como sin producto */ }
  return null;
}

async function registrar(db, evento, resumen) {
  try {
    const d = evento?.data ?? {};
    await db.from('hotmart_eventos').insert({
      evento: String(evento?.event ?? ''),
      hotmart_evento_id: String(evento?.id ?? ''),
      transaccion: String(d.purchase?.transaction ?? ''),
      correo: String(d.buyer?.email ?? '').toLowerCase() || null,
      producto_hotmart: String(d.product?.id ?? ''),
      resultado: resumen,
      cuerpo: evento ?? null,
    });
  } catch (e) { /* la bitácora nunca rompe el webhook */ }
}

async function perfilPorCorreo(db, correo) {
  if (!correo) return null;
  const patron = correo.replace(/([%_\\])/g, '\\$1');
  const { data } = await db.from('profiles').select('id, email').ilike('email', patron).limit(5);
  return (data ?? []).find(p => String(p.email ?? '').trim().toLowerCase() === correo) ?? null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const db = adminClient();
  if (!tokenValido(req)) {
    // Queda rastro del rechazo (sin el cuerpo, que no está verificado) para
    // diagnosticar un token mal puesto en Vercel o en Hotmart.
    const cab = String(req.headers['x-hotmart-hottok'] ?? '');
    await registrar(db, { event: String(req.body?.event ?? ''), id: String(req.body?.id ?? ''), data: {} },
      `rechazado: token inválido (${cab ? 'llegó token de ' + cab.length + ' caracteres' : 'sin cabecera X-HOTMART-HOTTOK'}; configurado en Vercel: ${process.env.HOTMART_HOTTOK ? 'sí' : 'NO'})`);
    return res.status(403).json({ error: 'Token inválido' });
  }

  const evento = req.body ?? {};
  const d = evento.data ?? {};
  const compra = d.purchase ?? {};
  const tipo = String(evento.event ?? '');
  const transaccion = String(compra.transaction ?? '').trim();
  const correo = String(d.buyer?.email ?? '').trim().toLowerCase() || null;

  try {
    if (!transaccion) {
      await registrar(db, evento, 'ignorado: sin transacción');
      return res.status(200).json({ ok: true });
    }

    if (EVENTOS_ACCESO.has(tipo)) {
      const resultado = await otorgar({ db, evento, d, compra, transaccion, correo });
      await registrar(db, evento, resultado);
      return res.status(200).json({ ok: true, resultado });
    }

    if (EVENTOS_REVOCAN.has(tipo)) {
      const resultado = await revocar({ db, compra, transaccion });
      await registrar(db, evento, resultado);
      return res.status(200).json({ ok: true, resultado });
    }

    await registrar(db, evento, 'ignorado: evento sin efecto');
    return res.status(200).json({ ok: true });
  } catch (err) {
    await registrar(db, evento, 'error: ' + err.message);
    // Un 500 hace que Hotmart reintente: correcto ante fallas transitorias.
    return res.status(500).json({ error: err.message });
  }
}

async function otorgar({ db, evento, d, compra, transaccion, correo }) {
  // 1) Idempotencia: la transacción ya está aprobada
  const { data: previa } = await db.from('purchases')
    .select('id, estado').eq('gateway', 'hotmart').eq('gateway_transaction_id', transaccion).maybeSingle();
  if (previa?.estado === 'APROBADA') return 'ya aprobada';

  // 2) Producto nuestro
  const producto = await productoNuestro(db, d.product);
  if (!producto) return 'producto desconocido: agrega el id de Hotmart al producto y reenvía el evento';

  // 3) Montos: en USD si el checkout fue en USD; si fue en otra moneda, el
  // valor de referencia en USD es el precio de lista vigente del producto.
  const precio = compra.price ?? {};
  const moneda = String(precio.currency_value ?? 'USD').toUpperCase();
  const centavos = Math.round(Number(precio.value ?? 0) * 100);
  const lista = producto.precio_promo_usd_centavos ?? producto.precio_usd_centavos ?? 0;
  const montoUsd = moneda === 'USD' && centavos > 0 ? centavos : lista;
  const ahora = new Date().toISOString();

  // 4) La fila PENDIENTE de pago.html (llega en sck), o una nueva por link directo
  const sck = String(compra.sckPaymentLink ?? '').trim();
  let fila = null;
  if (sck) {
    const { data } = await db.from('purchases').select('*').eq('referencia', sck).eq('gateway', 'hotmart').maybeSingle();
    if (data && data.estado !== 'APROBADA') fila = data;
  }
  const perfil = await perfilPorCorreo(db, correo);
  const userId = fila?.user_id ?? perfil?.id ?? null;

  const cambios = {
    estado: 'APROBADA',
    gateway_transaction_id: transaccion,
    email_comprador: correo ?? fila?.email_comprador ?? null,
    monto_centavos: centavos || montoUsd,
    moneda,
    monto_usd_centavos: montoUsd,
    purchased_at: compra.approved_date ? new Date(Number(compra.approved_date)).toISOString() : ahora,
  };
  if (!fila?.user_id && userId) cambios.user_id = userId;

  let compraId = fila?.id ?? previa?.id ?? null;
  let referencia = fila?.referencia ?? `hotmart__${transaccion}`;
  let error = null;
  if (compraId) {
    ({ error } = await db.from('purchases').update(cambios).eq('id', compraId));
  } else {
    const { data: nueva, error: e } = await db.from('purchases').insert({
      user_id: userId,
      product_id: producto.id,
      guide_id: producto.guide_id,
      gateway: 'hotmart',
      referencia,
      consintio_acceso: null,
      ...cambios,
    }).select('id').single();
    error = e; compraId = nueva?.id ?? null;
  }
  if (error) {
    // Choque con "una sola compra aprobada por producto": ya lo tenía. Se deja
    // como ERROR para revisar y reembolsar a mano, igual que con Wompi.
    const marca = { estado: 'ERROR', gateway_transaction_id: transaccion, email_comprador: correo };
    if (compraId) await db.from('purchases').update(marca).eq('id', compraId);
    else await db.from('purchases').insert({ user_id: null, product_id: producto.id, guide_id: producto.guide_id, gateway: 'hotmart', referencia: `hotmart__${transaccion}__dup`, monto_centavos: centavos, moneda, monto_usd_centavos: montoUsd, ...marca });
    return 'duplicada: el comprador ya tenía el producto (fila en ERROR para revisar)';
  }

  // 5) Meta: un Purchase por transacción real, deduplicado por referencia
  if (!fila?.meta_enviado && montoUsd > 0) {
    const enviado = await enviarEventoMeta({
      eventName: 'Purchase', eventId: referencia, email: correo,
      fbp: fila?.fbp ?? null, fbc: fila?.fbc ?? null, ip: fila?.ip_cliente ?? null, ua: fila?.ua_navegador ?? null,
      sourceUrl: 'https://iamasiva.co/confirmacion.html',
      customData: { currency: 'USD', value: montoUsd / 100, content_ids: [producto.id], content_type: 'product', content_name: producto.nombre },
    });
    if (enviado && compraId) await db.from('purchases').update({ meta_enviado: true }).eq('id', compraId);
  }

  // 6) Pack: una compra APROBADA por cada pieza (monto 0, gateway 'bundle')
  const componentes = await componentesDelPack(db, producto.id);
  let piezas = 0;
  for (const [i, componente] of componentes.entries()) {
    if (userId) {
      const { data: ya } = await db.from('purchases').select('id')
        .eq('user_id', userId).eq('product_id', componente).eq('estado', 'APROBADA').maybeSingle();
      if (ya) continue;
    }
    const { data: prod } = await db.from('products').select('guide_id').eq('id', componente).maybeSingle();
    const { error: e } = await db.from('purchases').insert({
      user_id: userId, email_comprador: correo, product_id: componente, guide_id: prod?.guide_id ?? null,
      estado: 'APROBADA', gateway: 'bundle', referencia: `${referencia}__c${i + 1}`,
      monto_centavos: 0, moneda: 'USD', monto_usd_centavos: 0, purchased_at: ahora,
      gateway_transaction_id: transaccion, consintio_acceso: fila?.consintio_acceso ?? null,
    });
    if (!e) piezas++;
  }
  return `aprobada${userId ? '' : ' (invitado, se reclama al registrarse)'}${componentes.length ? `, pack con ${piezas} piezas` : ''}`;
}

async function revocar({ db, compra, transaccion }) {
  // La compra y las piezas del pack comparten la transacción de Hotmart
  const { data: filas } = await db.from('purchases').select('id, estado, gateway')
    .eq('gateway_transaction_id', transaccion).in('gateway', ['hotmart', 'bundle']);
  const ids = (filas ?? []).filter(f => f.estado === 'APROBADA').map(f => f.id);
  if (ids.length) {
    const { error } = await db.from('purchases').update({ estado: 'ANULADA' }).in('id', ids);
    if (error) throw new Error('No se pudo retirar el acceso: ' + error.message);
  }
  // Una compra que nunca se aprobó (cancelada antes de pagar) queda cancelada
  const sck = String(compra.sckPaymentLink ?? '').trim();
  if (sck) await db.from('purchases').update({ estado: 'DECLINADA' }).eq('referencia', sck).eq('gateway', 'hotmart').eq('estado', 'PENDIENTE');
  return ids.length ? `acceso retirado a ${ids.length} fila(s)` : 'nada que retirar';
}
