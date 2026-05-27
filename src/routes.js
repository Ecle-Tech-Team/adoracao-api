import express from 'express';

import loginUser from './controllers/logincontroller.js';
import routerUser from './controllers/usercontroller.js';
import grupoController from './controllers/grupocontroller.js';
import grupoPlaylistController from './controllers/grupoPlaylistController.js';
import ensaioRouter from './controllers/ensaioscontroller.js';
import eventoRouter from './controllers/eventoscontroller.js';
import favoritosRouter from './controllers/favoritoscontroller.js';
import notificacoesRouter from './controllers/notificacoescontroller.js';
import pushController from './controllers/pushcontroller.js';
import playlistRouter from './controllers/playlistscontroller.js';

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
routes.use('/user', routerUser);

/* 🏗️ Core */
routes.use('/grupo', grupoController);
routes.use('/grupo', grupoPlaylistController);
routes.use('/ensaios', ensaioRouter);
routes.use('/eventos', eventoRouter);
routes.use('/favoritos', favoritosRouter);
routes.use('/notificacoes', notificacoesRouter);
routes.use('/push-token', pushController);
routes.use('/playlists', playlistRouter);

/* 🎵 HINÁRIOS (HARPA + CCB) */
routes.get('/hinos/:hinario', fetchHinos);
routes.get('/hinos/:hinario/numero/:numero', fetchHinoByNumero);
routes.get('/hinos/:hinario/id/:id', fetchHinoById);

/* 🎶 HINÁRIO GERAL (LEGADO – NÃO MEXE) */
routes.get('/hinario', fetchHinosGeralController);
routes.get('/hinario/:id', fetchHinoGeralByIdController);

export default routes;