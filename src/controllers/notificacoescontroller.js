import express from "express";
import notificacaoService from "../services/notificacoesservices.js";

const route = express.Router();

/**
 * 📢 Criar notificação global (equipe dev)
 */
route.post('/global', async (req, res) => {
  try {
    const { titulo, mensagem } = req.body;

    if (!titulo || !mensagem) {
      return res.status(400).json({ message: "Título e mensagem são obrigatórios." });
    }

    await notificacaoService.criarNotificacaoGlobal(titulo, mensagem);

    res.status(201).json({ message: "Notificação global criada com sucesso." });
  } catch (error) {
    res.status(500).json({ message: `Erro ao criar notificação global: ${error.message}` });
  }
});

/**
 * 🤝 Convite para grupo
 */
route.post('/convite', async (req, res) => {
  try {
    const { id_usuario, id_grupo } = req.body;

    if (!id_usuario || !id_grupo) {
      return res.status(400).json({ message: "Usuário e grupo são obrigatórios." });
    }

    await notificacaoService.criarConviteGrupo(id_usuario, id_grupo);

    res.status(201).json({ message: "Convite enviado com sucesso." });
  } catch (error) {
    res.status(500).json({ message: `Erro ao enviar convite: ${error.message}` });
  }
});

/**
 * 📅 Notificar evento
 */
route.post('/evento', async (req, res) => {
  try {
    const { id_grupo, eventoId, titulo } = req.body;

    await notificacaoService.criarNotificacaoGrupo(
      id_grupo,
      'EVENTO',
      titulo || 'Novo evento',
      'Um novo evento foi criado no seu grupo.',
      eventoId
    );

    res.status(201).json({ message: "Evento notificado com sucesso." });
  } catch (error) {
    res.status(500).json({ message: `Erro ao notificar evento: ${error.message}` });
  }
});

/**
 * 🎵 Notificar ensaio
 */
route.post('/ensaio', async (req, res) => {
  try {
    const { id_grupo, ensaioId, titulo } = req.body;

    await notificacaoService.criarNotificacaoGrupo(
      id_grupo,
      'ENSAIO',
      titulo || 'Novo ensaio',
      'Um novo ensaio foi criado no seu grupo.',
      ensaioId
    );

    res.status(201).json({ message: "Ensaio notificado com sucesso." });
  } catch (error) {
    res.status(500).json({ message: `Erro ao notificar ensaio: ${error.message}` });
  }
});

/**
 * 🔔 Listar notificações do usuário
 */
route.get('/:id_user', async (req, res) => {
  try {
    const { id_user } = req.params;

    const notificacoes = await notificacaoService.listarNotificacoesUsuario(id_user);

    res.status(200).json(notificacoes);
  } catch (error) {
    res.status(500).json({ message: `Erro ao listar notificações: ${error.message}` });
  }
});

/**
 * ✅ Marcar como lida
 */
route.put('/:id_notificacao/lida', async (req, res) => {
  try {
    const { id_notificacao } = req.params;

    await notificacaoService.marcarComoLida(id_notificacao);

    res.status(200).json({ message: "Notificação marcada como lida." });
  } catch (error) {
    res.status(500).json({ message: `Erro ao marcar notificação: ${error.message}` });
  }
});

/**
 * 🔢 Contador de não lidas
 */
route.get('/:id_user/nao-lidas', async (req, res) => {
  try {
    const { id_user } = req.params;

    const total = await notificacaoService.contarNaoLidas(id_user);

    res.status(200).json({ total });
  } catch (error) {
    res.status(500).json({ message: `Erro ao contar notificações: ${error.message}` });
  }
});

export default route;