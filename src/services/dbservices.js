import dbConnections from '../repository/connection.js';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const COLLECTION_HARPA = process.env.COLLECTION_HARPA;
const COLLECTION_CCB = process.env.COLLECTION_CCB;
const COLLECTION_HINARIO_GERAL = process.env.COLLECTION_HINARIO_GERAL;

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
  switch (hinario) {
    case 'harpa':
      return COLLECTION_HARPA;
    case 'ccb':
      return COLLECTION_CCB;
    default:
      throw new Error('Hinário inválido');
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

export const fetchHinoByIdAndHinario = async (hinario, id) => {
  const collection = getCollectionByHinario(hinario);
  const { client, db } = await dbConnections.connectMongoDB();

  try {
    return await db
      .collection(collection)
      .findOne({ _id: new ObjectId(id) });
  } finally {
    client.close();
  }
};
