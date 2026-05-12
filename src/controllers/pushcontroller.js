import express from 'express';
import pushService from '../services/pushservices.js';

const route = express.Router();

route.post('/', async (req, res) => {
  try {
    const { token, id_user } = req.body;

    if (!token || !id_user) {
      return res.status(400).json({ message: 'Token e id_user são obrigatórios' });
    }

    const id_usuario = id_user;

    await pushService.salvarPushToken(id_usuario, token);
    res.status(200).json({ message: 'Push token registrado' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default route;
