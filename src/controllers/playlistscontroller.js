import express from 'express';
import {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addHinoToPlaylist,
  removeHinoFromPlaylist,
  getPlaylistHinos,
} from '../services/playlistservices.js';

const router = express.Router();

// Criar playlist
router.post('/', async (req, res) => {
  try {
    const { userId, nome, descricao } = req.body;
    if (!userId || !nome) {
      return res.status(400).json({ message: 'userId e nome são obrigatórios.' });
    }
    const playlist = await createPlaylist(userId, nome, descricao);
    res.status(201).json(playlist);
  } catch (error) {
    res.status(500).json({ message: `Erro ao criar playlist: ${error.message}` });
  }
});

// Listar playlists do usuário
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const playlists = await getUserPlaylists(userId);
    res.status(200).json(playlists);
  } catch (error) {
    res.status(500).json({ message: `Erro ao buscar playlists: ${error.message}` });
  }
});

// Obter playlist com hinos
router.get('/:userId/:id', async (req, res) => {
  try {
    const { userId, id } = req.params;
    const playlist = await getPlaylistById(id, userId);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist não encontrada.' });
    }
    const hinos = await getPlaylistHinos(id, userId);
    res.status(200).json({ ...playlist, hinos });
  } catch (error) {
    res.status(500).json({ message: `Erro ao buscar playlist: ${error.message}` });
  }
});

// Atualizar playlist
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, nome, descricao } = req.body;
    if (!userId || !nome) {
      return res.status(400).json({ message: 'userId e nome são obrigatórios.' });
    }
    await updatePlaylist(id, userId, nome, descricao);
    res.status(200).json({ message: 'Playlist atualizada com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: `Erro ao atualizar playlist: ${error.message}` });
  }
});

// Deletar playlist
router.delete('/:userId/:id', async (req, res) => {
  try {
    const { userId, id } = req.params;
    await deletePlaylist(id, userId);
    res.status(200).json({ message: 'Playlist deletada com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: `Erro ao deletar playlist: ${error.message}` });
  }
});

// Adicionar hino à playlist
router.post('/:id/hinos', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, hinoId, tipoHino } = req.body;
    if (!userId || !hinoId || !tipoHino) {
      return res.status(400).json({ message: 'userId, hinoId e tipoHino são obrigatórios.' });
    }
    await addHinoToPlaylist(id, userId, hinoId, tipoHino);
    res.status(201).json({ message: 'Hino adicionado à playlist.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Hino já está nesta playlist.' });
    }
    res.status(500).json({ message: `Erro ao adicionar hino: ${error.message}` });
  }
});

// Remover hino da playlist
router.delete('/:userId/:id/hinos/:hinoId/:tipoHino', async (req, res) => {
  try {
    const { userId, id, hinoId, tipoHino } = req.params;
    await removeHinoFromPlaylist(id, userId, hinoId, tipoHino);
    res.status(200).json({ message: 'Hino removido da playlist.' });
  } catch (error) {
    res.status(500).json({ message: `Erro ao remover hino: ${error.message}` });
  }
});

export default router;
