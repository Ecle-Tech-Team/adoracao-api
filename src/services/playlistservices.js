import db from '../repository/connection.js';
import { fetchHinoByIdAndHinario, fetchHinoById } from './dbservices.js';

const mapHinarios = {
  HARPA: 'harpa_crista',
  CCB: 'hinario_ccb',
  CANTOR: 'cantor_cristao'
};

export const createPlaylist = async (userId, nome, descricao) => {
  const conn = await db.connect();
  try {
    const [result] = await conn.query(
      'INSERT INTO playlists (user_id, nome, descricao) VALUES (?, ?, ?)',
      [userId, nome, descricao || null]
    );
    return { id: result.insertId, nome, descricao };
  } finally {
    conn.end();
  }
};

export const getUserPlaylists = async (userId) => {
  const conn = await db.connect();
  try {
    const [rows] = await conn.query(
      `SELECT p.*, (SELECT COUNT(*) FROM playlist_hinos WHERE playlist_id = p.id) AS total_hinos
       FROM playlists p WHERE p.user_id = ? ORDER BY p.created_at DESC`,
      [userId]
    );
    return rows;
  } finally {
    conn.end();
  }
};

export const getPlaylistById = async (playlistId, userId) => {
  const conn = await db.connect();
  try {
    const [rows] = await conn.query(
      'SELECT * FROM playlists WHERE id = ? AND user_id = ?',
      [playlistId, userId]
    );
    return rows[0] || null;
  } finally {
    conn.end();
  }
};

export const updatePlaylist = async (playlistId, userId, nome, descricao) => {
  const conn = await db.connect();
  try {
    await conn.query(
      'UPDATE playlists SET nome = ?, descricao = ? WHERE id = ? AND user_id = ?',
      [nome, descricao || null, playlistId, userId]
    );
  } finally {
    conn.end();
  }
};

export const deletePlaylist = async (playlistId, userId) => {
  const conn = await db.connect();
  try {
    await conn.query(
      'DELETE FROM playlists WHERE id = ? AND user_id = ?',
      [playlistId, userId]
    );
  } finally {
    conn.end();
  }
};

export const addHinoToPlaylist = async (playlistId, userId, hinoId, tipoHino) => {
  const conn = await db.connect();
  try {
    // Verificar se a playlist pertence ao usuário
    const [playlists] = await conn.query(
      'SELECT id FROM playlists WHERE id = ? AND user_id = ?',
      [playlistId, userId]
    );
    if (playlists.length === 0) {
      throw new Error('Playlist não encontrada ou não pertence ao usuário');
    }

    await conn.query(
      'INSERT INTO playlist_hinos (playlist_id, hino_id, tipo_hino) VALUES (?, ?, ?)',
      [playlistId, hinoId, tipoHino]
    );
  } finally {
    conn.end();
  }
};

export const removeHinoFromPlaylist = async (playlistId, userId, hinoId, tipoHino) => {
  const conn = await db.connect();
  try {
    // Verificar se a playlist pertence ao usuário
    const [playlists] = await conn.query(
      'SELECT id FROM playlists WHERE id = ? AND user_id = ?',
      [playlistId, userId]
    );
    if (playlists.length === 0) {
      throw new Error('Playlist não encontrada ou não pertence ao usuário');
    }

    await conn.query(
      'DELETE FROM playlist_hinos WHERE playlist_id = ? AND hino_id = ? AND tipo_hino = ?',
      [playlistId, hinoId, tipoHino]
    );
  } finally {
    conn.end();
  }
};

export const getPlaylistHinos = async (playlistId, userId) => {
  const conn = await db.connect();
  const hinos = [];

  try {
    // Verificar ownership
    const [playlists] = await conn.query(
      'SELECT id FROM playlists WHERE id = ? AND user_id = ?',
      [playlistId, userId]
    );
    if (playlists.length === 0) {
      throw new Error('Playlist não encontrada ou não pertence ao usuário');
    }

    const [rows] = await conn.query(
      'SELECT hino_id, tipo_hino, added_at FROM playlist_hinos WHERE playlist_id = ? ORDER BY added_at ASC',
      [playlistId]
    );

    for (const row of rows) {
      try {
        let hino;

        if (row.tipo_hino === 'GERAL') {
          hino = await fetchHinoById(row.hino_id);
          if (hino) {
            const { numero, ...hinoSemNumero } = hino;
            hinos.push({ ...hinoSemNumero, tipo_hino: 'GERAL' });
          }
        } else {
          const collection = mapHinarios[row.tipo_hino];
          if (!collection) continue;

          hino = await fetchHinoByIdAndHinario(row.hino_id, collection);
          if (hino) {
            hinos.push({ ...hino, tipo_hino: row.tipo_hino });
          }
        }
      } catch (err) {
        console.warn(`Erro ao buscar hino ${row.hino_id} da playlist:`, err.message);
      }
    }

    return hinos;
  } finally {
    conn.end();
  }
};
