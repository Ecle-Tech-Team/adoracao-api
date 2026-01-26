import {
  getHinos,
  getHinoByNumero,
  getHinoByIdHinario,
  getHinosGeral,
  getHinoGeralById
} from '../services/hinosservices.js';

/* ===== Harpa & CCB ===== */

export const fetchHinos = async (req, res) => {
  const { hinario } = req.params;

  try {
    const hinos = await getHinos(hinario);
    res.json(hinos);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const fetchHinoByNumero = async (req, res) => {
  const { hinario, numero } = req.params;

  try {
    const hino = await getHinoByNumero(hinario, Number(numero));
    if (!hino) return res.status(404).send('Hino não encontrado');
    res.json(hino);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const fetchHinoById = async (req, res) => {
  const { hinario, id } = req.params;

  try {
    const hino = await getHinoByIdHinario(hinario, id);
    if (!hino) return res.status(404).send('Hino não encontrado');
    res.json(hino);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ===== Hinário Geral ===== */

export const fetchHinosGeralController = async (req, res) => {
  try {
    const hinos = await getHinosGeral();
    res.json(hinos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const fetchHinoGeralByIdController = async (req, res) => {
  const { id } = req.params;

  try {
    const hino = await getHinoGeralById(id);
    if (!hino) return res.status(404).send('Hino não encontrado');
    res.json(hino);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
