import {
  getHinos,
  getHinoByNumero,
  getHinoByIdHinario,
  getHinosGeral,
  getHinoGeralById
} from '../services/hinosservices.js';

/* ===== Harpa & CCB ===== */

const mapTipoHino = (hinario) => {
  switch (hinario) {
    case 'harpa': return 'HARPA';
    case 'ccb':   return 'CCB';
    case 'cantor': return 'CANTOR';
    default:      return null;
  }
};

export const fetchHinos = async (req, res) => {
  const { hinario } = req.params;
  const tipo = mapTipoHino(hinario);

  try {
    const hinos = await getHinos(hinario);
    const hinosComTipo = hinos.map(h => ({ ...h, tipo_hino: tipo }));
    res.json(hinosComTipo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const fetchHinoByNumero = async (req, res) => {
  const { hinario, numero } = req.params;
  const tipo = mapTipoHino(hinario);

  try {
    const hino = await getHinoByNumero(hinario, Number(numero));
    if (!hino) return res.status(404).send('Hino não encontrado');
    res.json({ ...hino, tipo_hino: tipo });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const fetchHinoById = async (req, res) => {
  const { hinario, id } = req.params;
  const tipo = mapTipoHino(hinario);

  try {
    const hino = await getHinoByIdHinario(hinario, id);
    if (!hino) return res.status(404).send('Hino não encontrado');
    res.json({ ...hino, tipo_hino: tipo });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ===== Hinário Geral ===== */

export const fetchHinosGeralController = async (req, res) => {
  try {
    const hinos = await getHinosGeral();
    const hinosComTipo = hinos.map(h => ({ ...h, tipo_hino: 'GERAL' }));
    res.json(hinosComTipo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const fetchHinoGeralByIdController = async (req, res) => {
  const { id } = req.params;

  try {
    const hino = await getHinoGeralById(id);
    if (!hino) return res.status(404).send('Hino não encontrado');
    res.json({ ...hino, tipo_hino: 'GERAL' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
