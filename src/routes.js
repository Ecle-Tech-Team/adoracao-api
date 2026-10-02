import express from 'express';

import loginUser from './controllers/logincontroller.js';
import authController from './controllers/authcontroller.js';
import { verifyJWT } from './middlewares/jwt.js';
import routerUser from './controllers/usercontroller.js';
import grupoController from './controllers/grupocontroller.js';
import igrejaController from './controllers/igrejacontroller.js';
import grupoPlaylistController from './controllers/grupoPlaylistController.js';
import ensaioRouter from './controllers/ensaioscontroller.js';
import eventoRouter from './controllers/eventoscontroller.js';
import favoritosRouter from './controllers/favoritoscontroller.js';
import notificacoesRouter from './controllers/notificacoescontroller.js';
import pushController from './controllers/pushcontroller.js';
import playlistRouter from './controllers/playlistscontroller.js';

import emailRouter from './controllers/emailcontroller.js';

import grupoHinoController from './controllers/grupoHinoController.js';
import churchSongController from './controllers/churchSongController.js';

import {
  fetchHinos,
  fetchHinoByNumero,
  fetchHinoById,
  fetchHinosGeralController,
  fetchHinoGeralByIdController
} from './controllers/hinoscontroller.js';

const routes = express.Router();

/* 🔐 Auth & users */
routes.use('/login', loginUser);
routes.use('/auth', authController);
routes.use('/user', routerUser);

/* 🏗️ Core */
routes.use('/grupo', grupoController);
routes.use('/igrejas', igrejaController);
routes.use('/grupo', grupoPlaylistController);

/* 🎶 PROJEÇÃO DE GRUPO */
routes.use('/grupo', grupoHinoController);

routes.use('/ensaios', ensaioRouter);
routes.use('/eventos', eventoRouter);
routes.use('/favoritos', verifyJWT, favoritosRouter);
routes.use('/notificacoes', verifyJWT, notificacoesRouter);
routes.use('/push-token', verifyJWT, pushController);
routes.use('/playlists', verifyJWT, playlistRouter);
routes.use('/hinos-igreja', verifyJWT, churchSongController);

/* 📧 E-mail verification */
routes.use('/email', emailRouter);

/* 🎵 HINÁRIOS (HARPA + CCB) */
routes.get('/hinos/:hinario', fetchHinos);
routes.get('/hinos/:hinario/numero/:numero', fetchHinoByNumero);
routes.get('/hinos/:hinario/id/:id', fetchHinoById);
routes.get('/hinos/:hinario/id/:id', (req, res, next) => {
  console.log('ROTA DE BUSCA POR ID ACIONADA');
  console.log('Parâmetros:', req.params);

  next();
}, fetchHinoById);

/* 🎶 HINÁRIO GERAL (LEGADO – NÃO MEXE) */
routes.get('/hinario', fetchHinosGeralController);
routes.get('/hinario/:id', fetchHinoGeralByIdController);

export default routes;
