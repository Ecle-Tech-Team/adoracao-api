import express from 'express';
import pushService from '../services/pushservices.js';

const route = express.Router();

route.post('/', async (req, res) => {
  try {
    const { token } = req.body;
    const id_usuario = req.user.id_user;

    if (!token) {
      return res.status(400).json({ message: 'Token é obrigatório' });
    }

    await pushService.salvarPushToken(id_usuario, token);
    res.status(200).json({ message: 'Push token registrado' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default route;
