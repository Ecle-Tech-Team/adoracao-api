import mysql from "mysql2/promise";
import { fetchHinoByIdAndHinario, fetchHinoById } from "./dbservices.js";

const dbConfig = {
  host: process.env.SQL_HOST || "mysql",
  user: process.env.SQL_USER || "root",
  password: process.env.SQL_PASSWORD || "",
  database: process.env.SQL_DB || "adoracao_app",
};

const mapHinarios = {
  HARPA: "harpa_crista",
  CCB: "hinario_ccb",
  CANTOR: "cantor_cristao",
};

async function getConnection() {
  return mysql.createConnection(dbConfig);
}

function normalizeTipoHino(tipo) {
  return String(tipo || "")
    .trim()
    .toUpperCase();
}

function getHinarioKeyFromTipo(tipo) {
  const tipoNormalizado = normalizeTipoHino(tipo);
  return (
    mapHinarios[tipoNormalizado] ||
    String(tipo || "")
      .trim()
      .toLowerCase()
  );
}

function getHinarioFrontFromTipo(tipo) {
  const tipoNormalizado = normalizeTipoHino(tipo);

  switch (tipoNormalizado) {
    case "HARPA":
      return "harpa";
    case "CCB":
      return "ccb";
    case "CANTOR":
      return "cantor";
    case "GERAL":
      return "geral";
    default:
      return String(tipo || "")
        .trim()
        .toLowerCase();
  }
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
      [id_grupo],
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
      "INSERT INTO grupo_playlists (id_grupo, nome, descricao) VALUES (?, ?, ?)",
      [id_grupo, nome, descricao || null],
    );

    return {
      id: result.insertId,
      id_grupo,
      nome,
      descricao: descricao || null,
    };
  } finally {
    await conn.end();
  }
}

async function updateGrupoPlaylist(id_grupo, playlist_id, nome, descricao) {
  const conn = await getConnection();
  try {
    await conn.execute(
      "UPDATE grupo_playlists SET nome = ?, descricao = ? WHERE id = ? AND id_grupo = ?",
      [nome, descricao || null, playlist_id, id_grupo],
    );

    return {
      id: parseInt(playlist_id, 10),
      id_grupo,
      nome,
      descricao: descricao || null,
    };
  } finally {
    await conn.end();
  }
}

async function deleteGrupoPlaylist(id_grupo, playlist_id) {
  const conn = await getConnection();
  try {
    await conn.execute(
      "DELETE FROM grupo_playlists WHERE id = ? AND id_grupo = ?",
      [playlist_id, id_grupo],
    );

    return { success: true };
  } finally {
    await conn.end();
  }
}

const hinoPayload = {
  hino_id: selectedHino?.hino_id || selectedHino?._id || selectedHino?.id,
  mongo_id: selectedHino?._id || selectedHino?.id || null,
  tipo_hino: String(selectedHino?.tipo_hino || selectedHino?.hinario || '').toUpperCase(),
  numero: selectedHino?.numero ?? null,
  titulo: selectedHino?.titulo || selectedHino?.title || null,
  autor: selectedHino?.autor || selectedHino?.author || null,
  hinario: selectedHino?.hinario || null,
};

console.log('PAYLOAD enviado para grupo playlist:', hinoPayload);

await addHinoToGrupoPlaylist(id_grupo, playlist.id, hinoPayload);

async function removeHinoFromPlaylist(playlist_id, hino_id) {
  const conn = await getConnection();
  try {
    await conn.execute(
      "DELETE FROM grupo_playlist_hinos WHERE playlist_id = ? AND hino_id = ?",
      [playlist_id, hino_id],
    );

    return { success: true };
  } finally {
    await conn.end();
  }
}

async function enrichHinoData(hino) {
  const tipoNormalizado = normalizeTipoHino(hino.tipo_hino);
  const hinarioFront = getHinarioFrontFromTipo(tipoNormalizado);

  try {
    if (tipoNormalizado === "GERAL") {
      const hinoData = await fetchHinoById(hino.hino_id);

      if (!hinoData) {
        return {
          ...hino,
          id: hino.hino_id,
          tipo_hino: tipoNormalizado,
          hinario: hinarioFront,
          titulo: null,
          autor: null,
          author: null,
          numero: null,
        };
      }

      return {
        ...hino,
        id: hinoData._id || hino.hino_id,
        _id: hinoData._id,
        hino_id: hino.hino_id,
        tipo_hino: tipoNormalizado,
        hinario: hinarioFront,
        titulo: hinoData.titulo || hinoData.title || null,
        title: hinoData.title || hinoData.titulo || null,
        autor: hinoData.autor || hinoData.author || null,
        author: hinoData.author || hinoData.autor || null,
        numero: hinoData.numero ?? null,
        verses: hinoData.verses || null,
        versos: hinoData.versos || null,
        coro: hinoData.coro || null,
      };
    }

    const hinarioKey = getHinarioKeyFromTipo(tipoNormalizado);
    const hinoData = await fetchHinoByIdAndHinario(hino.hino_id, hinarioKey);

    if (!hinoData) {
      return {
        ...hino,
        id: hino.hino_id,
        tipo_hino: tipoNormalizado,
        hinario: hinarioFront,
        titulo: null,
        autor: null,
        author: null,
        numero: null,
      };
    }

    return {
      ...hino,
      id: hinoData._id || hino.hino_id,
      _id: hinoData._id,
      hino_id: hino.hino_id,
      tipo_hino: tipoNormalizado,
      hinario: hinarioFront,
      titulo: hinoData.titulo || hinoData.title || null,
      title: hinoData.title || hinoData.titulo || null,
      autor: hinoData.autor || hinoData.author || null,
      author: hinoData.author || hinoData.autor || null,
      numero: hinoData.numero ?? null,
      verses: hinoData.verses || null,
      versos: hinoData.versos || null,
      coro: hinoData.coro || null,
    };
  } catch (err) {
    console.error(`Erro ao buscar hino ${hino.hino_id}:`, err.message);

    return {
      ...hino,
      id: hino.hino_id,
      tipo_hino: tipoNormalizado,
      hinario: hinarioFront,
      titulo: null,
      autor: null,
      author: null,
      numero: null,
    };
  }
}

async function getGrupoPlaylistDetalhes(playlist_id) {
  const conn = await getConnection();
  try {
    const [playlistRows] = await conn.execute(
      "SELECT * FROM grupo_playlists WHERE id = ?",
      [playlist_id],
    );

    if (playlistRows.length === 0) return null;

    const [hinos] = await conn.execute(
      "SELECT * FROM grupo_playlist_hinos WHERE playlist_id = ? ORDER BY added_at ASC",
      [playlist_id],
    );

    const hinosCompletos = await Promise.all(hinos.map(enrichHinoData));

    return {
      ...playlistRows[0],
      hinos: hinosCompletos,
    };
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
