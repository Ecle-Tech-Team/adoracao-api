import express from 'express';
import grupoPlaylistService from '../services/grupoPlaylistService.js';
import { verifyJWT } from '../middlewares/jwt.js';
import { requireGroupLeader, requireGroupMember } from '../middlewares/authorize.js';

const route = express.Router();

route.get('/:id_grupo/playlists', verifyJWT, requireGroupMember(req => req.params.id_grupo), async (req, res) => {
  try {
    const { id_grupo } = req.params;
    const playlists = await grupoPlaylistService.getGrupoPlaylists(id_grupo);
    res.json(playlists);
  } catch (error) {
    console.error('Erro ao listar playlists do grupo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

route.post('/:id_grupo/playlists', verifyJWT, requireGroupLeader(req => req.params.id_grupo), async (req, res) => {
  try {
    const { id_grupo } = req.params;
    const { nome, descricao } = req.body;
    if (!nome) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }
    const playlist = await grupoPlaylistService.createGrupoPlaylist(id_grupo, nome, descricao);
    res.status(201).json(playlist);
  } catch (error) {
    console.error('Erro ao criar playlist do grupo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

route.put('/:id_grupo/playlists/:playlist_id', verifyJWT, requireGroupLeader(req => req.params.id_grupo), async (req, res) => {
  try {
    const { id_grupo, playlist_id } = req.params;
    const { nome, descricao } = req.body;
    if (!nome) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }
    const playlist = await grupoPlaylistService.updateGrupoPlaylist(id_grupo, playlist_id, nome, descricao);
    res.json(playlist);
  } catch (error) {
    console.error('Erro ao atualizar playlist do grupo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

route.delete('/:id_grupo/playlists/:playlist_id', verifyJWT, requireGroupLeader(req => req.params.id_grupo), async (req, res) => {
  try {
    const { id_grupo, playlist_id } = req.params;
    await grupoPlaylistService.deleteGrupoPlaylist(id_grupo, playlist_id);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar playlist do grupo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

route.get('/:id_grupo/playlists/:playlist_id', verifyJWT, requireGroupMember(req => req.params.id_grupo), async (req, res) => {
  try {
    const { id_grupo, playlist_id } = req.params;
    const detalhes = await grupoPlaylistService.getGrupoPlaylistDetalhes(id_grupo, playlist_id);
    if (!detalhes) {
      return res.status(404).json({ error: 'Playlist não encontrada' });
    }
    res.json(detalhes);
  } catch (error) {
    console.error('Erro ao obter detalhes da playlist:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

route.post('/:id_grupo/playlists/:playlist_id/hinos', verifyJWT, requireGroupLeader(req => req.params.id_grupo), async (req, res) => {
  try {
    const { id_grupo, playlist_id } = req.params;
    const { hino_id, tipo_hino } = req.body;
    if (!hino_id || !tipo_hino) {
      return res.status(400).json({ error: 'hino_id e tipo_hino são obrigatórios' });
    }
    const hino = await grupoPlaylistService.addHinoToPlaylist(id_grupo, playlist_id, hino_id, tipo_hino);
    res.status(201).json(hino);
  } catch (error) {
    console.error('Erro ao adicionar hino à playlist:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

route.delete('/:id_grupo/playlists/:playlist_id/hinos/:hino_id', verifyJWT, requireGroupLeader(req => req.params.id_grupo), async (req, res) => {
  try {
    const { id_grupo, playlist_id, hino_id } = req.params;
    await grupoPlaylistService.removeHinoFromPlaylist(id_grupo, playlist_id, hino_id);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover hino da playlist:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default route;
