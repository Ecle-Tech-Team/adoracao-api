import mysql from 'mysql2/promise';
import { fetchHinoByIdAndHinario, fetchHinoById } from './dbservices.js';

const dbConfig = {
  host: process.env.SQL_HOST || 'mysql',
  user: process.env.SQL_USER || 'root',
  password: process.env.SQL_PASSWORD || '',
  database: process.env.SQL_DB || 'adoracao_app',
};

const mapHinarios = {
  HARPA: 'harpa_crista',
  CCB: 'hinario_ccb',
  CANTOR: 'cantor_cristao'
};

async function getConnection() {
  return mysql.createConnection(dbConfig);
}

async function getGrupoPlaylists(id_grupo) {
  const conn = await getConnection();
  try {
    const [rows] = await conn.execute(
      `SELECT gp.*,
              (SELECT COUNT(*) FROM grupo_playlist_hinos WHERE playlist_id = gp.id) AS hinos_count
       FROM grupo_playlists gp
       WHERE gp.id_grupo = ?
       ORDER BY gp.created_at DESC`,
      [id_grupo]
    );
    return rows;
  } finally {
    await conn.end();
  }
}

async function createGrupoPlaylist(id_grupo, nome, descricao) {
  const conn = await getConnection();
  try {
    const [result] = await conn.execute(
      'INSERT INTO grupo_playlists (id_grupo, nome, descricao) VALUES (?, ?, ?)',
      [id_grupo, nome, descricao || null]
    );
    return { id: result.insertId, id_grupo, nome, descricao };
  } finally {
    await conn.end();
  }
}

async function updateGrupoPlaylist(id_grupo, playlist_id, nome, descricao) {
  const conn = await getConnection();
  try {
    await conn.execute(
      'UPDATE grupo_playlists SET nome = ?, descricao = ? WHERE id = ? AND id_grupo = ?',
      [nome, descricao || null, playlist_id, id_grupo]
    );
    return { id: parseInt(playlist_id), nome, descricao };
  } finally {
    await conn.end();
  }
}

async function deleteGrupoPlaylist(id_grupo, playlist_id) {
  const conn = await getConnection();
  try {
    await conn.execute(
      'DELETE FROM grupo_playlists WHERE id = ? AND id_grupo = ?',
      [playlist_id, id_grupo]
    );
    return { success: true };
  } finally {
    await conn.end();
  }
}

async function addHinoToPlaylist(playlist_id, hino_id, tipo_hino) {
  const conn = await getConnection();
  try {
    const [result] = await conn.execute(
      'INSERT INTO grupo_playlist_hinos (playlist_id, hino_id, tipo_hino) VALUES (?, ?, ?)',
      [playlist_id, hino_id, tipo_hino]
    );
    return { id: result.insertId, playlist_id, hino_id, tipo_hino };
  } finally {
    await conn.end();
  }
}

async function removeHinoFromPlaylist(playlist_id, hino_id) {
  const conn = await getConnection();
  try {
    await conn.execute(
      'DELETE FROM grupo_playlist_hinos WHERE playlist_id = ? AND hino_id = ?',
      [playlist_id, hino_id]
    );
    return { success: true };
  } finally {
    await conn.end();
  }
}

async function getGrupoPlaylistDetalhes(playlist_id) {
  const conn = await getConnection();
  try {
    const [playlist] = await conn.execute(
      'SELECT * FROM grupo_playlists WHERE id = ?',
      [playlist_id]
    );
    if (playlist.length === 0) return null;

    const [hinos] = await conn.execute(
      'SELECT * FROM grupo_playlist_hinos WHERE playlist_id = ? ORDER BY added_at ASC',
      [playlist_id]
    );

    // Buscar dados completos de cada hino no MongoDB
    const hinosCompletos = await Promise.all(
      hinos.map(async (hino) => {
        try {
          if (hino.tipo_hino === 'GERAL') {
            const hinoData = await fetchHinoById(hino.hino_id);
            return hinoData
              ? { ...hino, _id: hinoData._id, titulo: hinoData.titulo, numero: hinoData.numero, hinario: hinoData.hinario }
              : hino;
          } else {
            const hinarioKey = mapHinarios[hino.tipo_hino] || hino.tipo_hino.toLowerCase();
            const hinoData = await fetchHinoByIdAndHinario(hino.hino_id, hinarioKey);
            return hinoData
              ? { ...hino, _id: hinoData._id, titulo: hinoData.titulo, numero: hinoData.numero, hinario: hinoData.hinario }
              : hino;
          }
        } catch (err) {
          console.error(`Erro ao buscar hino ${hino.hino_id}:`, err.message);
          return hino;
        }
      })
    );

    return { ...playlist[0], hinos: hinosCompletos };
  } finally {
    await conn.end();
  }
}

export default {
  getGrupoPlaylists,
  createGrupoPlaylist,
  updateGrupoPlaylist,
  deleteGrupoPlaylist,
  addHinoToPlaylist,
  removeHinoFromPlaylist,
  getGrupoPlaylistDetalhes,
};
