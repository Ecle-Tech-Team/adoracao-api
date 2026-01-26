import {
  fetchHinosByHinario,
  fetchHinoByNumeroAndHinario,
  fetchHinoByIdAndHinario,
  fetchHinosGeral,
  fetchHinoById
} from './dbservices.js';

/* ========= HARPAS & CCB ========= */

export const getHinos = (hinario) => {
  return fetchHinosByHinario(hinario);
};

export const getHinoByNumero = (hinario, numero) => {
  return fetchHinoByNumeroAndHinario(hinario, numero);
};

export const getHinoByIdHinario = (hinario, id) => {
  return fetchHinoByIdAndHinario(hinario, id);
};

/* ========= HINÁRIO GERAL ========= */

export const getHinosGeral = () => {
  return fetchHinosGeral();
};

export const getHinoGeralById = (id) => {
  return fetchHinoById(id);
};
