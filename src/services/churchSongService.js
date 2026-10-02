import { ObjectId } from 'mongodb';
import dbConnections from '../repository/connection.js';
import { normalizeSongTitle, extractYouTubeVideoId } from '../helpers/churchSongs.js';

const COLLECTION = 'hinos_igreja';
const active = (churchId) => ({ id_igreja: churchId, status: 'ativo' });
const objectId = (id) => ObjectId.isValid(id) && String(new ObjectId(id)) === id ? new ObjectId(id) : null;

async function withCollection(action) {
  const { client, db } = await dbConnections.connectMongoDB();
  try { return await action(db.collection(COLLECTION)); }
  finally { await client.close(); }
}

export function validateSong(input, previous = null) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw invalid('Dados inválidos.');
  const title = input.titulo ?? previous?.titulo;
  if (typeof title !== 'string' || !title.trim() || title.length > 200) throw invalid('Título obrigatório (até 200 caracteres).');
  const fields = {};
  for (const key of ['autorInformado', 'letra', 'cifra']) {
    const value = input[key] === undefined ? previous?.[key] ?? null : input[key];
    if (value !== null && (typeof value !== 'string' || value.length > (key === 'autorInformado' ? 200 : 50000))) throw invalid(`${key} inválido.`);
    fields[key] = value?.trim() || null;
  }
  const youtubeUrl = input.youtubeUrl === undefined ? previous?.youtube?.url ?? null : input.youtubeUrl;
  if (youtubeUrl !== null && (typeof youtubeUrl !== 'string' || youtubeUrl.length > 2048)) throw invalid('Link do YouTube inválido.');
  const videoId = youtubeUrl ? extractYouTubeVideoId(youtubeUrl) : null;
  if (youtubeUrl && !videoId) throw invalid('Link do YouTube inválido.', 'INVALID_YOUTUBE_URL');
  const type = input.tipoDireitos ?? previous?.direitos?.tipo ?? 'uso_interno';
  if (!['autoral_proprio', 'dominio_publico', 'autorizado', 'uso_interno'].includes(type)) throw invalid('Tipo de direitos inválido.');
  const textChanged = !previous || fields.letra !== (previous.letra ?? null) || fields.cifra !== (previous.cifra ?? null);
  if ((fields.letra || fields.cifra) && textChanged && input.confirmacaoDireitos !== true) throw invalid('Confirme os direitos de uso da letra ou cifra.', 'RIGHTS_CONFIRMATION_REQUIRED');
  return {
    titulo: title.trim(), titulo_normalizado: normalizeSongTitle(title), ...fields,
    youtube: videoId ? { videoId, url: youtubeUrl } : null,
    direitos: { tipo: type, confirmacaoUsuario: Boolean((fields.letra || fields.cifra) && (input.confirmacaoDireitos === true || previous?.direitos?.confirmacaoUsuario)), confirmadoEm: (fields.letra || fields.cifra) && input.confirmacaoDireitos === true ? new Date() : previous?.direitos?.confirmadoEm ?? null },
  };
}

function invalid(message, code = 'INVALID_CHURCH_SONG') { return Object.assign(new Error(message), { code }); }

export async function listSongs(churchId, search = '') {
  return withCollection(async (collection) => {
    const songs = await collection.find(active(churchId)).sort({ titulo_normalizado: 1 }).toArray();
    if (!search) return songs;
    const term = normalizeSongTitle(search);
    return songs.filter(song => song.titulo_normalizado?.includes(term) || normalizeSongTitle(song.titulo ?? '').includes(term) || normalizeSongTitle(song.autorInformado ?? '').includes(term));
  });
}
export async function getSong(churchId, id) {
  const _id = objectId(id);
  if (!_id) return null;
  return withCollection(collection => collection.findOne({ _id, ...active(churchId) }));
}
export async function createSong(churchId, userId, input) {
  const song = validateSong(input);
  return withCollection(async (collection) => {
    const matches = await collection.find({ ...active(churchId), titulo_normalizado: song.titulo_normalizado }).project({ _id: 1, titulo: 1 }).limit(5).toArray();
    const now = new Date();
    const document = { ...song, id_igreja: churchId, criadoPor: userId, atualizadoPor: null, status: 'ativo', createdAt: now, updatedAt: now };
    const result = await collection.insertOne(document);
    return { song: { ...document, _id: result.insertedId }, possibleDuplicate: matches.length > 0, matches };
  });
}
export async function updateSong(churchId, userId, id, input) {
  const existing = await getSong(churchId, id);
  if (!existing) return null;
  const fields = validateSong(input, existing);
  return withCollection(async collection => {
    const result = await collection.findOneAndUpdate({ _id: existing._id, ...active(churchId) }, { $set: { ...fields, atualizadoPor: userId, updatedAt: new Date() } }, { returnDocument: 'after' });
    return result?.value ?? result;
  });
}
export async function deleteSong(churchId, userId, id) {
  const _id = objectId(id);
  if (!_id) return false;
  return withCollection(async collection => (await collection.updateOne({ _id, ...active(churchId) }, { $set: { status: 'removido', atualizadoPor: userId, updatedAt: new Date() } })).matchedCount > 0);
}
