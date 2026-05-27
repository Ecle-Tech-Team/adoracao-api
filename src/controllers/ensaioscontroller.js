import express from 'express';
import { createEnsaio, getEnsaiosDoGrupo, updateEnsaio, removeEnsaio } from '../services/ensaiosservices.js';

const route = express.Router();

route.post('/:id_grupo', async (req, res) => {
    const { id_grupo } = req.params;
    const { data, descricao, local, hinoIds } = req.body;

    try {
        const response = await createEnsaio(id_grupo, data, descricao, local, hinoIds || []);
        res.status(201).json(response);
    } catch (error) {
        res.status(500).send({ message: `Erro ao criar ensaio: ${error.message}` });
    }
});


route.get('/:id_grupo', async (req, res) => {
    try {
        const { id_grupo } = req.params;
        const ensaios = await getEnsaiosDoGrupo(id_grupo);
        res.status(200).json(ensaios);
    } catch (error) {
        res.status(500).json({ message: `Erro ao buscar ensaios do grupo: ${error.message}` });
    }
});

route.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { data, descricao, local } = req.body;

    try {
        const response = await updateEnsaio(id, data, descricao, local);
        res.status(200).json(response);
    } catch (error) {
        res.status(500).send({ message: `Erro ao atualizar ensaio: ${error.message}` });
    }
});

route.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const response = await removeEnsaio(id);
        res.status(200).json({ message: "Ensaio deletado com sucesso" });
    } catch (error) {
        res.status(500).send({ message: `Erro ao deletar ensaio: ${error.message}` });
    }
});

export default route;
