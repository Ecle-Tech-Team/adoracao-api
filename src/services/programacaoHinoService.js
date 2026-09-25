import {
  fetchProgramacaoHino,
  fetchProgramacoesHinosPorData,
  saveProgramacaoHino,
  deleteProgramacaoHino,
} from "./dbservices.js";

/* ========= PROGRAMAÇÃO DE HINOS ========= */

export const getProgramacaoHino = (
  idGrupo,
  dataCulto
) => {
  return fetchProgramacaoHino(
    idGrupo,
    dataCulto
  );
};

export const getProgramacoesHinosPorData = (
  dataCulto
) => {
  return fetchProgramacoesHinosPorData(
    dataCulto
  );
};

export const salvarProgramacaoHino = (
  dados
) => {
  return saveProgramacaoHino(dados);
};

export const removerProgramacaoHino = (
  idGrupo,
  dataCulto
) => {
  return deleteProgramacaoHino(
    idGrupo,
    dataCulto
  );
};