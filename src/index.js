import Express from 'express'
import routes from './routes.js'
import cors from 'cors';
import dotenv from 'dotenv';
import { validateAuthConfig } from './helpers/userFeatures.js';
import { allowedOrigins } from './helpers/authCookies.js';

dotenv.config();
validateAuthConfig();

const api = Express()
api.use(cors({ origin(origin, callback) {
  if (!origin || allowedOrigins().includes(origin)) return callback(null, true);
  return callback(new Error('Origem não permitida'));
}, credentials: true }));
api.use(Express.json());
api.use(Express.urlencoded({ extended: true }));

api.use('/', routes);

api.use((error, req, res, next) => {
  if (error?.message === 'Origem não permitida') return res.status(403).json({ message: error.message });
  console.error(error);
  return res.status(500).json({ message: 'Erro interno do servidor.' });
});

const PORT = process.env.PORT || 3333; 
api.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
