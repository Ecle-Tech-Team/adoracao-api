import express from 'express';
import { getUserById } from '../services/authservices.js';
import { listSongs, getSong, createSong, updateSong, deleteSong } from '../services/churchSongService.js';

const router = express.Router();
async function requireChurch(req, res, next) {
  try {
    const user = await getUserById(req.auth.userId);
    const id = Number(user?.id_igreja);
    if (!Number.isSafeInteger(id) || id <= 0) return res.status(403).json({ error: 'USER_WITHOUT_CHURCH', message: 'Usuário sem igreja vinculada.' });
    req.churchId = id;
    next();
  } catch (error) { next(error); }
}
// Central point for future church editing permissions.
function authorizeSongEdit(req, res, next) { next(); }
function handleError(error, res, next) {
  if (['INVALID_CHURCH_SONG', 'RIGHTS_CONFIRMATION_REQUIRED', 'INVALID_YOUTUBE_URL'].includes(error.code)) return res.status(400).json({ error: error.code, message: error.message });
  return next(error);
}
router.use(requireChurch);
router.get('/', async (req, res, next) => {
  try {
    if (typeof req.query.search !== 'undefined' && (typeof req.query.search !== 'string' || req.query.search.length > 200)) return res.status(400).json({ error: 'INVALID_SEARCH', message: 'Busca inválida.' });
    res.json(await listSongs(req.churchId, req.query.search ?? ''));
  } catch (error) { next(error); }
});
router.get('/:id', async (req, res, next) => {
  try { const song = await getSong(req.churchId, req.params.id); return song ? res.json(song) : res.status(404).json({ message: 'Hino não encontrado.' }); }
  catch (error) { next(error); }
});
router.post('/', authorizeSongEdit, async (req, res, next) => {
  try { res.status(201).json(await createSong(req.churchId, req.auth.userId, req.body)); }
  catch (error) { handleError(error, res, next); }
});
router.put('/:id', authorizeSongEdit, async (req, res, next) => {
  try { const song = await updateSong(req.churchId, req.auth.userId, req.params.id, req.body); return song ? res.json(song) : res.status(404).json({ message: 'Hino não encontrado.' }); }
  catch (error) { handleError(error, res, next); }
});
router.delete('/:id', authorizeSongEdit, async (req, res, next) => {
  try { return await deleteSong(req.churchId, req.auth.userId, req.params.id) ? res.status(204).end() : res.status(404).json({ message: 'Hino não encontrado.' }); }
  catch (error) { next(error); }
});
export default router;
