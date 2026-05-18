import express from "express";
import groupService from "../services/gruposervices.js";
import { removeHinoFromGrupo } from "../services/gruposervices.js";

const route = express.Router();

route.post('/', async (request, response) => {
  try {
    const { name, local, typeGroup, regenteId } = request.body;
          
    if (!name || !local || !typeGroup || !regenteId) {
      return response.status(400).json({ message: "Todos os campos são obrigatórios." });
    }

    const grupoId = await groupService.createGroup(name, local, typeGroup, regenteId);
    response.status(201).send({ message: 'Grupo criado com sucesso', grupoId });
  } catch (error) {
      if (error.message === "Este regente já possui um grupo e não pode criar outro.") {
          response.status(400).send({ message: error.message });
      } else {
          response.status(500).send({ message: `Erro na criação do grupo: ${error.message}` });
      }
  }
});

route.post('/:id_grupo/hinos', async (req, res) => {
  try {
    const { id_grupo } = req.params;
    const { hinoId } = req.body;

    const result = await groupService.addHinoToGrupo(id_grupo, hinoId);
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

route.delete('/:id_grupo/hinos/:id_hino', async (req, res) => {
  try {
    const { id_grupo, id_hino } = req.params;
    const result = await removeHinoFromGrupo(id_grupo, id_hino);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({ message: `Erro ao remover hino do grupo: ${error.message}` });
  }
});


export default route;
