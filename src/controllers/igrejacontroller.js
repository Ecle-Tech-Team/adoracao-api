import express from 'express';
import { createIgreja, getIgreja, listIgrejas } from '../services/igrejaservices.js';

const route = express.Router();
const validId = (value) => /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));

route.get('/', async (req, res, next) => {
  try {
    const search = req.query.search ?? '';
    const requestedLimit = req.query.limit ?? '20';
    if (typeof search !== 'string' || search.length > 150 || !validId(String(requestedLimit))) {
      return res.status(400).json({ error: 'INVALID_CHURCH_DATA', message: 'Busca inválida.' });
    }
    return res.json(await listIgrejas(search, Math.min(Number(requestedLimit), 20)));
  } catch (error) { return next(error); }
});

route.get('/:id', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'INVALID_CHURCH_DATA', message: 'ID inválido.' });
    const igreja = await getIgreja(Number(req.params.id));
    if (!igreja) return res.status(404).json({ error: 'CHURCH_NOT_FOUND', message: 'Igreja não encontrada.' });
    return res.json(igreja);
  } catch (error) { return next(error); }
});

route.post('/', async (req, res, next) => {
  try {
    return res.status(201).json(await createIgreja(req.body));
  } catch (error) {
    if (error.code === 'INVALID_CHURCH_DATA') return res.status(400).json({ error: error.code, message: error.message });
    if (error.code === 'CHURCH_ALREADY_EXISTS') return res.status(409).json({ error: error.code, message: error.message });
    return next(error);
  }
});

export default route;
