import express, { request, response } from "express";
import db, { getCandidatosComponente, listarComponentesDoGrupo, adicionarComponenteAoGrupo, removerComponente, checkEmailExists, listarIgrejas, updateUserGrupo } from '../services/userservices.js';
import { verifyJWT } from '../middlewares/jwt.js';
import { authorizeComponentRemoval, requireSelf, requireGroupLeader, requireGroupMember, requireRegente } from '../middlewares/authorize.js';

const route = express.Router();

route.post('/', async (request, response) => {
  try {
    const { name, email, password, typeUser, birthDate, hinario, igreja } = request.body;

    await db.createUser(name, email, password, typeUser, birthDate, hinario, igreja);

    response.status(201).json({ message: 'Salvo com sucesso' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return response.status(409).json({ message: 'E-mail já cadastrado.' });
    if (error.message === 'Senha deve ter pelo menos 8 caracteres.' || error.message === 'Nome e e-mail são obrigatórios.') {
      return response.status(400).json({ message: error.message });
    }
    console.error(error);
    response.status(500).json({ message: 'Erro na requisição' });
  }
});

route.put('/', verifyJWT, requireSelf(req => req.body.idUser), async(request, response) => {
  try{
    const {name, email, password, typeUser, idUser} = request.body;
    await db.updateUser(name, email, password, typeUser, idUser);
    response.status(200).send({message:`Dados Atualizados com sucesso!`});
  }catch{
    response.status(500).send({message:`Erro na requisição`})
  }
});

route.delete('/:idUser', verifyJWT, requireSelf(req => req.params.idUser), async(request, response) => {
  try{
    const {idUser} = request.params
    await db.deleteUser(idUser) 
    response.status(200).send({message:`Usuário deletado com sucesso!`});
  }catch(error){
    response.status(500).send({message:`Erro na requisição  `})
  }
});
route.get('/componentes', verifyJWT, requireRegente, async (req, res) => {
  try {
      const candidatos = await getCandidatosComponente();
      res.status(200).json(candidatos);
  } catch (error) {
      console.error('Erro ao buscar candidatos a componente:', error);
      res.status(500).json({ message: 'Erro ao buscar candidatos a componente.' });
  }
});

route.get('/check-email/:email', async (request, response) => {
  try {
    const exists = await checkEmailExists(request.params.email);
    response.status(200).json({ exists });
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    response.status(500).json({ message: 'Erro ao verificar email.' });
  }
});

route.get('/grupo/:id_grupo/componentes', verifyJWT, requireGroupMember(req => req.params.id_grupo), async (req, res) => {
  const { id_grupo } = req.params;
  try {
    const componentes = await listarComponentesDoGrupo(id_grupo);
    res.status(200).json(componentes);
  } catch (error) {
    res.status(500).json({ message: `Erro ao listar componentes do grupo: ${error.message}` });
  }
});

route.post('/addComponente/:idUser/:id_grupo', verifyJWT, requireGroupLeader(req => req.params.id_grupo), async (req, res) => {
  const { idUser, id_grupo } = req.params;

  try {
    const resultado = await adicionarComponenteAoGrupo(idUser, id_grupo);
    res.status(200).send(resultado);
  } catch (error) {
      console.error('Erro ao adicionar componente ao grupo:', error);
      res.status(500).json({ message: 'Erro ao adicionar componente ao grupo.' });
  }
});

route.put('/removeComponente/:idUser', verifyJWT, authorizeComponentRemoval, async (req, res) => {
  const { idUser } = req.params;

  try {
    await removerComponente(idUser, req.componentGroupId);
    res.status(200).send({ message: 'Componente removido com sucesso!' });
  } catch (error) {
    console.error('Erro ao remover componente:', error);
    res.status(500).send({ message: 'Erro ao remover componente.' });
  }
});

route.put('/:id_user/grupo', verifyJWT, requireSelf(req => req.params.id_user), async (request, response) => {
  try {
    const { id_user } = request.params;
    const { id_grupo } = request.body;
    if (id_grupo != null) return response.status(403).json({ message: 'Entrada em grupo exige convite.' });
    await updateUserGrupo(id_user, id_grupo);
    response.status(200).send({ message: 'Grupo do usuário atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar grupo do usuário:', error);
    response.status(500).send({ message: 'Erro ao atualizar grupo do usuário.' });
  }
});

route.get('/igrejas', async (req, res) => {
  try {
    const igrejas = await listarIgrejas();
    res.status(200).json(igrejas);
  } catch (error) {
    console.error('Erro ao listar igrejas:', error);
    res.status(500).json({ message: 'Erro ao listar igrejas.' });
  }
});




export default route;
