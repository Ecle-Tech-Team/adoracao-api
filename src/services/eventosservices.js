import db from '../repository/connection.js';

export const createEventos = async (id_grupo, data, descricao, local, hinoIds = []) => {
    const conn = await db.connect();
    try {
        const eventosql = "INSERT INTO eventos_grupo (grupo_id, data, descricao, local) VALUES (?, ?, ?, ?)";
        const [result] = await conn.query(eventosql, [id_grupo, data, descricao, local]);
        const eventoId = result.insertId;

        return { message: "Evento criado com sucesso", eventoId };
    } catch (error) {
        console.error("Erro ao criar ensaio:", error);
        throw error;
    } finally {
        conn.end();
    }
};


export const getEventosDoGrupo = async (id_grupo) => {
    const conn = await db.connect();
    try {
        const sql = "SELECT * FROM eventos_grupo WHERE grupo_id = ?"
            
        const [eventos] = await conn.query(sql, [id_grupo]);

        return eventos;
    } catch (error) {
        console.error("Erro ao buscar eventos do grupo:", error);
        throw error;
    } finally {
        conn.end();
    }
};

export const updateEvento = async (id, data, descricao, local) => {
    const conn = await db.connect();
    try {
        const sql = "UPDATE eventos_grupo SET data = ?, descricao = ?, local = ? WHERE id = ?";
        await conn.query(sql, [data, descricao, local, id]);
        return { message: "Evento atualizado com sucesso" };
    } catch (error) {
        console.error("Erro ao atualizar evento:", error);
        throw error;
    } finally {
        conn.end();
    }
};

export const removeEvento = async (id) => {
    const conn = await db.connect();
    try {
        const deleteEventosSql = "DELETE FROM eventos_grupo WHERE id = ?";
        await conn.query(deleteEventosSql, [id]);

        return { message: "Evento deletado com sucesso" };
    } catch (error) {
        console.error("Erro ao deletar eventos:", error);
        throw error;
    } finally {
        conn.end();
    }
};