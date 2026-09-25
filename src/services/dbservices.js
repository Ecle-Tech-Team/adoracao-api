import dbConnections from "../repository/connection.js";
import { ObjectId } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const COLLECTION_HARPA = process.env.COLLECTION_HARPA;
const COLLECTION_CCB = process.env.COLLECTION_CCB;
const COLLECTION_HINARIO_GERAL = process.env.COLLECTION_HINARIO_GERAL;
const COLLECTION_PROGRAMACAO_HINOS = process.env.COLLECTION_PROGRAMACAO_HINOS;

/* ===============================
   HINÁRIO GERAL (LEGADO)
================================ */

export const fetchHinosGeral = async () => {
  const { client, db } = await dbConnections.connectMongoDB();
  try {
    return await db.collection(COLLECTION_HINARIO_GERAL).find({}).toArray();
  } finally {
    client.close();
  }
};

export const fetchHinoById = async (hinoId) => {
  const { client, db } = await dbConnections.connectMongoDB();
  try {
    return await db
      .collection(COLLECTION_HINARIO_GERAL)
      .findOne({ _id: new ObjectId(hinoId) });
  } finally {
    client.close();
  }
};

/* ===============================
   HARPAS & CCB (NOVO)
================================ */

const getCollectionByHinario = (hinario) => {
  const hinarioNormalizado = hinario.toLowerCase().trim();

  switch (hinarioNormalizado) {
    case "harpa":
    case "harpa_crista":
      return COLLECTION_HARPA;

    case "ccb":
    case "hinario_ccb":
      return COLLECTION_CCB;

    default:
      throw new Error(`Hinário inválido: ${hinario}`);
  }
};

export const fetchHinosByHinario = async (hinario) => {
  const collection = getCollectionByHinario(hinario);
  const { client, db } = await dbConnections.connectMongoDB();

  try {
    return await db.collection(collection).find({}).toArray();
  } finally {
    client.close();
  }
};

export const fetchHinoByNumeroAndHinario = async (hinario, numero) => {
  const collection = getCollectionByHinario(hinario);
  const { client, db } = await dbConnections.connectMongoDB();

  try {
    return await db.collection(collection).findOne({ numero });
  } finally {
    client.close();
  }
};

export const fetchHinoByIdAndHinario = async (id, hinario) => {
  const collectionName = getCollectionByHinario(hinario);

  if (!ObjectId.isValid(id)) {
    throw new Error("ID do hino inválido");
  }

  const { client, db } = await dbConnections.connectMongoDB();

  try {
    const hino = await db.collection(collectionName).findOne({
      _id: new ObjectId(id),
    });

    return hino;
  } finally {
    await client.close();
  }
};

/* ===============================
   PROGRAMAÇÃO DE HINOS DOS GRUPOS
================================ */

export const fetchProgramacaoHino = async (idGrupo, dataCulto) => {
  const { client, db } = await dbConnections.connectMongoDB();

  try {
    return await db.collection(COLLECTION_PROGRAMACAO_HINOS).findOne({
      id_grupo: String(idGrupo),
      data_culto: String(dataCulto),
    });
  } finally {
    await client.close();
  }
};

/**
 * Busca todas as programações de uma determinada data.
 */
export const fetchProgramacoesHinosPorData = async (dataCulto) => {
  const { client, db } = await dbConnections.connectMongoDB();

  try {
    return await db
      .collection(COLLECTION_PROGRAMACAO_HINOS)
      .find({
        data_culto: String(dataCulto),
      })
      .sort({
        id_grupo: 1,
      })
      .toArray();
  } finally {
    await client.close();
  }
};

/**
 * Cria ou atualiza o hino de um grupo para uma determinada data.
 */
export const saveProgramacaoHino = async ({
  idGrupo,
  idIgreja,
  dataCulto,
  idHino,
  tipoHino,
  numero,
  titulo,
  autor,
  hinario,
}) => {
  const { client, db } = await dbConnections.connectMongoDB();

  try {
    const filtro = {
      id_grupo: String(idGrupo),
      data_culto: String(dataCulto),
    };

    const documento = {
      id_grupo: String(idGrupo),
      id_igreja: String(idIgreja),

      data_culto: String(dataCulto),

      id_hino: String(idHino),
      tipo_hino: String(tipoHino),

      numero: numero !== undefined && numero !== null ? String(numero) : "",

      titulo: titulo !== undefined && titulo !== null ? String(titulo) : "",

      autor: autor !== undefined && autor !== null ? String(autor) : "",

      hinario: hinario !== undefined && hinario !== null ? String(hinario) : "",

      updatedAt: new Date(),
    };

    await db.collection(COLLECTION_PROGRAMACAO_HINOS).updateOne(
      filtro,
      {
        $set: documento,
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      {
        upsert: true,
      },
    );

    return await db.collection(COLLECTION_PROGRAMACAO_HINOS).findOne(filtro);
  } finally {
    await client.close();
  }
};

/**
 * Remove o hino de um grupo em determinada data.
 */
export const deleteProgramacaoHino = async (idGrupo, dataCulto) => {
  const { client, db } = await dbConnections.connectMongoDB();

  try {
    const result = await db.collection(COLLECTION_PROGRAMACAO_HINOS).deleteOne({
      id_grupo: String(idGrupo),
      data_culto: String(dataCulto),
    });

    return result.deletedCount > 0;
  } finally {
    await client.close();
  }
};
