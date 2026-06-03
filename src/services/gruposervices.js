import db from '../repository/connection.js';
import { fetchHinoById } from './dbservices.js';

async function createGroup(name, local, typeGroup, regenteId) {
    const conn = await db.connect();
    try {
        // Verifica se o regente já possui um grupo
        const checkGroupSql = "SELECT COUNT(*) AS count FROM grupo WHERE regente_id = ?";
        const [rows] = await conn.query(checkGroupSql, [regenteId]);

        if (rows[0].count > 0) {
            throw new Error("Este regente já possui um grupo e não pode criar outro.");
        }  

        // Verifica se o regente já existe
        const checkRegenteSql = "SELECT regente_id FROM regentes WHERE usuario_id = ?";
        const [regenteRows] = await conn.query(checkRegenteSql, [regenteId]);

        let regenteRefId;
        
        if (regenteRows.length === 0) {
            // Se o regente não existe, insere um novo regente
            const insertRegenteSql = "INSERT INTO regentes (usuario_id) VALUES (?)";
            const [result] = await conn.query(insertRegenteSql, [regenteId]);
            regenteRefId = result.insertId;
        } else {
            // Caso o regente já exista, obtém seu ID
            regenteRefId = regenteRows[0].regente_id;
        }

        // Insere o novo grupo
        const sql = "INSERT INTO grupo (nome, local, tipo_grupo, regente_id) VALUES (?, ?, ?, ?)";
        const values = [name, local, typeGroup, regenteRefId];
        const [groupResult] = await conn.query(sql, values);
        const groupId = groupResult.insertId;
        
        // Atualiza o usuário 'Regente' com o ID do grupo recém-criado
        const updateUserGroupSql = "UPDATE usuarios SET id_grupo = ? WHERE id_usuario = ?";
        await conn.query(updateUserGroupSql, [groupId, regenteId]);
                
        // Retorna o ID do grupo criado
        return groupId;
    } catch (error) {
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
        // Remove hinos do grupo
        await conn.query("DELETE FROM hinario_grupo WHERE grupo_id = ?", [id_grupo]);
        // Remove os componentes do grupo (atualiza usuarios) e altera tipo para 'Adorador'
        await conn.query("UPDATE usuarios SET id_grupo = NULL, tipo_usuario = 'Adorador' WHERE id_grupo = ?", [id_grupo]);
        // Remove o grupo
        const sql = "DELETE FROM grupo WHERE id = ? AND regente_id IN (SELECT regente_id FROM regentes WHERE usuario_id = ?)";
        const [result] = await conn.query(sql, [id_grupo, regenteId]);
        if (result.affectedRows === 0) {
            throw new Error("Grupo não encontrado ou você não tem permissão para excluí-lo.");
        }
        return { message: 'Grupo excluído com sucesso' };
    } catch (error) {
        throw error;
    } finally {
        conn.end();
    }
};

export default { createGroup, addHinoToGrupo, getHinosDoGrupo, removeHinoFromGrupo, getGrupoById, updateHinoTag, getAllGrupos, deleteGroup };
