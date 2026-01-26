import db from '../repository/connection.js';
import { fetchHinoById, fetchHinoByIdAndHinario } from './dbservices.js';

export const addFavorito = async (id_user, hinoId, tipo_hino) => {
    const conn = await db.connect();
    try {
        const sql = "INSERT INTO favoritos (id_usuario, hino_id, tipo_hino) VALUES (?, ?, ?)";
        await conn.query(sql, [id_user, hinoId, tipo_hino]);
    } finally {
        conn.end();
    }
};

export const removeFavorito = async (id_user, hinoId) => {
    const conn = await db.connect();
    try {
        const sql = "DELETE FROM favoritos WHERE id_usuario = ? AND hino_id = ?";
        await conn.query(sql, [id_user, hinoId]);
    } finally {
        conn.end();
    }
};

export const getFavoritos = async (id_user) => {
    const conn = await db.connect();
    const favoritos = [];
    
    try {
      const sql = "SELECT hino_id, tipo_hino FROM favoritos WHERE id_usuario = ?";
      const [rows] = await conn.query(sql, [id_user]);
  
      for (const row of rows) {
        try {
          if (row.tipo_hino === "Harpa") {
            const hino = await fetchHinoByIdAndHinario(row.hino_id); // Busca pela função unificada
            favoritos.push({ ...hino, tipo_hino: "Harpa" });
          } else if (row.tipo_hino === "Geral") {
            const hino = await fetchHinoById(row.hino_id); // Busca pelo hinário geral
            favoritos.push({ ...hino, tipo_hino: "Geral" });
          } else {
            console.warn(`Tipo de hino desconhecido: ${row.tipo_hino}`);
          }
        } catch (error) {
          console.warn(`Erro ao buscar hino favorito: ${error.message}`);
        }
      }
  
      return favoritos;
    } catch (error) {
      console.error("Erro ao buscar favoritos:", error.message);
      throw error;
    } finally {
      conn.end();
    }
  };
  

export default { addFavorito, removeFavorito, getFavoritos };
