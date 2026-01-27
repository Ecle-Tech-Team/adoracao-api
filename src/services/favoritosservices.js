import db from '../repository/connection.js';
import { fetchHinoByIdAndHinario, fetchHinoById } from './dbservices.js';

export const addFavorito = async (id_user, hinoId, tipo_hino) => {
  const conn = await db.connect();
  try {
    const sql = `
      INSERT INTO favoritos (id_usuario, hino_id, tipo_hino)
      VALUES (?, ?, ?)
    `;
    await conn.query(sql, [id_user, hinoId, tipo_hino]);
  } finally {
    conn.end();
  }
};

export const removeFavorito = async (id_user, hinoId) => {
  const conn = await db.connect();
  try {
    const sql = `
      DELETE FROM favoritos 
      WHERE id_usuario = ? AND hino_id = ?
    `;
    await conn.query(sql, [id_user, hinoId]);
  } finally {
    conn.end();
  }
};

export const getFavoritos = async (id_user) => {
  const conn = await db.connect();
  const favoritos = [];

  const mapHinarios = {
    HARPA: 'harpa_crista',
    CCB: 'hinario_ccb',
    CANTOR: 'cantor_cristao'
  };

  try {
    const [rows] = await conn.query(
      `SELECT hino_id, tipo_hino FROM favoritos WHERE id_usuario = ?`,
      [id_user]
    );

    for (const row of rows) {
      try {
        let hino;

        if (row.tipo_hino === 'GERAL') {
          hino = await fetchHinoById(row.hino_id);

          if (hino) {
            // 🔥 REMOVE "numero" DOS HINOS GERAIS
            const { numero, ...hinoSemNumero } = hino;

            favoritos.push({
              ...hinoSemNumero,
              tipo_hino: 'GERAL'
            });
          }
        } else {
          const collection = mapHinarios[row.tipo_hino];
          if (!collection) continue;

          hino = await fetchHinoByIdAndHinario(row.hino_id, collection);

          if (hino) {
            favoritos.push({
              ...hino,
              tipo_hino: row.tipo_hino
            });
          }
        }
      } catch (err) {
        console.warn(
          `Erro ao buscar hino ${row.hino_id}:`,
          err.message
        );
      }
    }

    return favoritos;
  } finally {
    conn.end();
  }
};

export default {
  addFavorito,
  removeFavorito,
  getFavoritos
};
