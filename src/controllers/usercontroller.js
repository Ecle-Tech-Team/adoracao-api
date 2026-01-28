import express, { request, response } from "express";
import db from "../services/userservices.js";
import { getCandidatosComponente, listarComponentesDoGrupo, adicionarComponenteAoGrupo, removerComponente } from '../services/userservices.js';

const route = express.Router();

route.post('/', async (request, response) => {
  try {
    const { name, email, password, typeUser } = request.body;

    if (!name || !email || !password || !typeUser) {
      return response.status(400).json({
        message: 'Dados obrigatórios não informados'
      });
    }

    await db.createUser(name, email, password, typeUser);

    response.status(201).json({ message: 'Salvo com sucesso' });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    response.status(500).json({ message: 'Erro na requisição' });
  }
});

route.put('/', async(request, response) => {
  try{
    const {name, email, password, typeUser, idUser} = request.body;
    await db.updateUser(name, email, password, typeUser, idUser);
    response.status(200).send({message:`Dados Atualizados com sucesso!`});
  }catch{
    response.status(500).send({message:`Erro na requisição`})
  }
});

route.delete('/:idUser', async(request, response) => {
  try{
    const {idUser} = request.params
    await db.deleteUser(idUser) 
    response.status(200).send({message:`Usuário deletado com sucesso!`});
  }catch(error){
    response.status(500).send({message:`Erro na requisição  `})
  }
});
route.get('/componentes', async (req, res) => {
  try {
      const candidatos = await getCandidatosComponente();
      res.status(200).json(candidatos);
  } catch (error) {
      console.error('Erro ao buscar candidatos a componente:', error);
      res.status(500).json({ message: 'Erro ao buscar candidatos a componente.' });
  }
});

route.get('/grupo/:id_grupo/componentes', async (req, res) => {
  const { id_grupo } = req.params;
  try {
    const componentes = await listarComponentesDoGrupo(id_grupo);
    res.status(200).json(componentes);
  } catch (error) {
    res.status(500).json({ message: `Erro ao listar componentes do grupo: ${error.message}` });
  }
});

route.post('/addComponente/:idUser/:id_grupo', async (req, res) => {
  const { idUser, id_grupo } = req.params;

  try {
    const resultado = await adicionarComponenteAoGrupo(idUser, id_grupo);
    res.status(200).send(resultado);
  } catch (error) {
      console.error('Erro ao adicionar componente ao grupo:', error);
      res.status(500).json({ message: 'Erro ao adicionar componente ao grupo.' });
  }
});

route.put('/removeComponente/:idUser', async (req, res) => {
  const { idUser } = req.params;
  const { id_grupo } = req.body;  

  try {    
    await removerComponente(idUser, id_grupo);
    res.status(200).send({ message: 'Componente removido com sucesso!' });
  } catch (error) {
    console.error('Erro ao remover componente:', error);
    res.status(500).send({ message: 'Erro ao remover componente.' });
  }
});


export default route;