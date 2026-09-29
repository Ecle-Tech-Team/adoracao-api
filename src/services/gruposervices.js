import db from '../repository/connection.js';
import { fetchHinoById } from './dbservices.js';

function groupError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
}

async function createGroup(name, local, typeGroup, creatorId) {
    const conn = await db.connect();
    try {
        await conn.beginTransaction();
        const [users] = await conn.query(
            "SELECT id_usuario, tipo_usuario, id_grupo FROM usuarios WHERE id_usuario = ? FOR UPDATE",
            [creatorId]
        );
        const creator = users[0];
        if (!creator) throw groupError('GROUP_CREATION_NOT_ALLOWED', 'Usuário não encontrado.');
        if (creator.id_grupo != null) throw groupError('GROUP_ALREADY_EXISTS', 'Este regente já possui um grupo e não pode criar outro.');
        if (!['Adorador', 'Regente'].includes(creator.tipo_usuario)) {
            throw groupError('GROUP_CREATION_NOT_ALLOWED', 'Seu perfil não pode criar um grupo.');
        }

        const [regenteRows] = await conn.query(
            "SELECT regente_id FROM regentes WHERE usuario_id = ? FOR UPDATE",
            [creatorId]
        );
        let regenteRefId = regenteRows[0]?.regente_id;
        if (!regenteRefId) {
            const [result] = await conn.query("INSERT INTO regentes (usuario_id) VALUES (?)", [creatorId]);
            regenteRefId = result.insertId;
        }

        const [groups] = await conn.query("SELECT id FROM grupo WHERE regente_id = ? FOR UPDATE", [regenteRefId]);
        if (groups.length) throw groupError('GROUP_ALREADY_EXISTS', 'Este regente já possui um grupo e não pode criar outro.');

        const sql = "INSERT INTO grupo (nome, local, tipo_grupo, regente_id) VALUES (?, ?, ?, ?)";
        const values = [name, local, typeGroup, regenteRefId];
        const [groupResult] = await conn.query(sql, values);
        const groupId = groupResult.insertId;

        await conn.query(
            "UPDATE usuarios SET tipo_usuario = 'Regente', id_grupo = ? WHERE id_usuario = ?",
            [groupId, creatorId]
        );
        await conn.commit();
        return groupId;
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.end();
    }
}

export const addHinoToGrupo = async (id_grupo, hinoId, tag = null) => {
    const conn = await db.connect();

    try {
        const [grupo] = await conn.query("SELECT * FROM grupo WHERE id = ?", [id_grupo]);
        if (grupo.length === 0) {
            throw new Error("Grupo não encontrado");
        }

        const hino = await fetchHinoById(hinoId);
        if (!hino) {
            throw new Error("Hino não encontrado no MongoDB");
        }

        const sql = "INSERT INTO hinario_grupo (grupo_id, hino_id, tag) VALUES (?, ?, ?)";
        await conn.query(sql, [id_grupo, hinoId, tag]);

        return { message: 'Hino adicionado ao grupo com sucesso' };
    } catch (error) {
        throw error;
    } finally {
        conn.end();
    }
};

export const getHinosDoGrupo = async (id_grupo) => {
    const conn = await db.connect();
    const hinos = [];

    try {
        const [rows] = await conn.query("SELECT hino_id, tag FROM hinario_grupo WHERE grupo_id = ?", [id_grupo]);

        if (rows.length === 0) {
            return { message: "Nenhum hino encontrado para este grupo." };
        }

        for (const row of rows) {
            const hino = await fetchHinoById(row.hino_id);
            if (hino) {
                hinos.push({ ...hino, tag: row.tag });
            }
        }

        return hinos;
    } catch (error) {
        console.error("Erro ao buscar hinos do grupo:", error.message);
        throw error;
    } finally {
        conn.end();
    }
};

export const removeHinoFromGrupo = async (id_grupo, id_hino) => {
    const conn = await db.connect();
  
    try {
      const sql = "DELETE FROM hinario_grupo WHERE grupo_id = ? AND hino_id = ?";
      const [result] = await conn.query(sql, [id_grupo, id_hino]);
  
      if (result.affectedRows === 0) {
        throw new Error("Hino não encontrado no grupo.");
      }
  
      return { message: 'Hino removido do grupo com sucesso' };
    } catch (error) {
      console.error("Erro ao remover hino do grupo:", error.message);
      throw error;
    } finally {
      conn.end();
    }
  };
  

export const getGrupoById = async (id) => {
    const conn = await db.connect();
    try {
        const sql = "SELECT id, nome, local, tipo_grupo FROM grupo WHERE id = ?";
        const [rows] = await conn.query(sql, [id]);
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        throw error;
    } finally {
        conn.end();
    }
};

export const getAllGrupos = async () => {
    const conn = await db.connect();
    try {
        const sql = "SELECT id, nome, local, tipo_grupo FROM grupo ORDER BY nome";
        const [rows] = await conn.query(sql);
        return rows;
    } catch (error) {
        throw error;
    } finally {
        conn.end();
    }
};

export const updateHinoTag = async (id_grupo, hinoId, tag) => {
    const conn = await db.connect();
    try {
        const sql = "UPDATE hinario_grupo SET tag = ? WHERE grupo_id = ? AND hino_id = ?";
        await conn.query(sql, [tag, id_grupo, hinoId]);
        return { message: 'Tag atualizada com sucesso' };
    } catch (error) {
        throw error;
    } finally {
        conn.end();
    }
};

export const deleteGroup = async (id_grupo, regenteId) => {
    const conn = await db.connect();
    try {
        await conn.beginTransaction();
        const [owned] = await conn.query(
            "SELECT g.id FROM grupo g JOIN regentes r ON r.regente_id = g.regente_id WHERE g.id = ? AND r.usuario_id = ? FOR UPDATE",
            [id_grupo, regenteId]
        );
        if (!owned.length) throw new Error("Grupo não encontrado ou você não tem permissão para excluí-lo.");
        // Remove hinos do grupo
        await conn.query("DELETE FROM hinario_grupo WHERE grupo_id = ?", [id_grupo]);
        // Remove os componentes do grupo (atualiza usuarios) e altera tipo para 'Adorador'
        await conn.query("UPDATE usuarios SET id_grupo = NULL, tipo_usuario = 'Adorador' WHERE id_grupo = ?", [id_grupo]);
        // Remove o grupo
        await conn.query("DELETE FROM grupo WHERE id = ?", [id_grupo]);
        await conn.commit();
        return { message: 'Grupo excluído com sucesso' };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.end();
    }
};

export default { createGroup, addHinoToGrupo, getHinosDoGrupo, removeHinoFromGrupo, getGrupoById, updateHinoTag, getAllGrupos, deleteGroup };
