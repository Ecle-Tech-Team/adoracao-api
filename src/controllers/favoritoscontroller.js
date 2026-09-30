import express from 'express';
import { addFavorito, removeFavorito, getFavoritos } from '../services/favoritosservices.js';
import { requireSelf } from '../middlewares/authorize.js';

const router = express.Router();
router.use(requireSelf(req => req.params.id_user || req.path.split('/')[1]));

router.get('/:id_user', async (req, res) => {
    try {
        const { id_user } = req.params;
        const favoritos = await getFavoritos(id_user);
        res.status(200).json(favoritos);
    } catch (error) {
        res.status(500).json({ message: `Erro ao buscar favoritos: ${error.message}` });
    }
});

router.post('/:id_user', async (req, res) => {
    try {
        const { id_user } = req.params;
        const { hinoId, tipo_hino } = req.body;

        if (!hinoId || !tipo_hino) {
            return res.status(400).json({ message: "hinoId e tipo_hino são obrigatórios." });
        }

        await addFavorito(id_user, hinoId, tipo_hino);
        res.status(201).json({ message: "Hino favoritado com sucesso" });
    } catch (error) {
        res.status(500).json({ message: `Erro ao favoritar hino: ${error.message}` });
    }
});

router.delete('/:id_user/:hinoId', async (req, res) => {
    try {
        const { id_user, hinoId } = req.params;
        await removeFavorito(id_user, hinoId);
        res.status(200).json({ message: "Hino removido dos favoritos" });
    } catch (error) {
        res.status(500).json({ message: `Erro ao remover favorito: ${error.message}` });
    }
});

export default router;
