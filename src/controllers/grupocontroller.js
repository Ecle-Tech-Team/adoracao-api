import express from "express";
import groupService, { removeHinoFromGrupo, deleteGroup } from "../services/gruposervices.js";
import { verifyJWT } from '../middlewares/jwt.js';
import { requireGroupLeader } from '../middlewares/authorize.js';

const route = express.Router();

route.post('/', verifyJWT, async (request, response) => {
  try {
    const { name, local, typeGroup } = request.body;

    if (!name || !local || !typeGroup) {
      return response.status(400).json({ message: "Todos os campos são obrigatórios." });
    }

    const grupoId = await groupService.createGroup(name, local, typeGroup, request.auth.userId);
    response.status(201).send({ message: 'Grupo criado com sucesso', grupoId });
  } catch (error) {
      if (error.code === 'GROUP_CREATION_NOT_ALLOWED') return response.status(403).send({ message: error.message });
      if (error.code === 'GROUP_ALREADY_EXISTS') return response.status(409).send({ message: error.message });
      response.status(500).send({ message: 'Erro interno ao criar grupo.' });
  }
});

route.get('/', async (req, res) => {
  try {
    const grupos = await groupService.getAllGrupos();
    res.status(200).json(grupos);
  } catch (error) {
    res.status(500).send({ message: `Erro ao listar grupos: ${error.message}` });
  }
});

route.post('/:id_grupo/hinos', verifyJWT, requireGroupLeader(req => req.params.id_grupo), async (req, res) => {
  try {
    const { id_grupo } = req.params;
    const { hinoId, tag } = req.body;

    const result = await groupService.addHinoToGrupo(id_grupo, hinoId, tag);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({ message: `Erro ao adicionar hino ao grupo: ${error.message}` });
  }
});

route.get('/:id_grupo/hinos', async (req, res) => {
  try {
    const { id_grupo } = req.params;
    const hinos = await groupService.getHinosDoGrupo(id_grupo);
    res.status(200).json(hinos);
  } catch (error) {
    res.status(500).send({ message: `Erro ao buscar hinos do grupo: ${error.message}` });
  }
});

route.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const grupo = await groupService.getGrupoById(id);
    if (!grupo) {
      return res.status(404).send({ message: 'Grupo não encontrado' });
    }
    res.status(200).json(grupo);
  } catch (error) {
    res.status(500).send({ message: `Erro ao buscar grupo: ${error.message}` });
  }
});

route.delete('/:id_grupo', verifyJWT, requireGroupLeader(req => req.params.id_grupo), async (req, res) => {
  try {
    const { id_grupo } = req.params;
    const result = await deleteGroup(id_grupo, req.auth.userId);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({ message: `Erro ao excluir grupo: ${error.message}` });
  }
});

route.delete('/:id_grupo/hinos/:id_hino', verifyJWT, requireGroupLeader(req => req.params.id_grupo), async (req, res) => {
  try {
    const { id_grupo, id_hino } = req.params;
    const result = await removeHinoFromGrupo(id_grupo, id_hino);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({ message: `Erro ao remover hino do grupo: ${error.message}` });
  }
});

route.put('/:id_grupo/hinos/:hinoId/tag', verifyJWT, requireGroupLeader(req => req.params.id_grupo), async (req, res) => {
  try {
    const { id_grupo, hinoId } = req.params;
    const { tag } = req.body;
    const result = await groupService.updateHinoTag(id_grupo, hinoId, tag);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({ message: `Erro ao atualizar tag do hino: ${error.message}` });
  }
});


export default route;
