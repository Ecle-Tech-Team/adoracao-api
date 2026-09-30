import express from "express";
import { verifyJWT } from '../middlewares/jwt.js';
import { requireGroupLeader } from '../middlewares/authorize.js';

import {
  getProgramacaoHino,
  getProgramacoesHinosPorData,
  salvarProgramacaoHino,
  removerProgramacaoHino,
} from "../services/programacaoHinoService.js";

const router = express.Router();

/*
 * =====================================================
 * BUSCAR HINO DE UM GRUPO EM UMA DATA
 *
 * GET /grupo/:idGrupo/hino?data=2026-09-22
 * =====================================================
 */
router.get("/:idGrupo/hino", async (req, res) => {
  try {
    const { idGrupo } = req.params;
    const { data } = req.query;

    if (!idGrupo) {
      return res.status(400).json({
        message: "Grupo não informado.",
      });
    }

    if (!data) {
      return res.status(400).json({
        message: "Data do culto não informada.",
      });
    }

    const programacao =
      await getProgramacaoHino(
        idGrupo,
        data
      );

    return res.status(200).json({
      programacao: programacao ?? null,
    });
  } catch (error) {
    console.error(
      "Erro ao buscar hino do grupo:",
      error
    );

    return res.status(500).json({
      message:
        error.message ??
        "Erro ao buscar hino do grupo.",
    });
  }
});

/*
 * =====================================================
 * BUSCAR TODOS OS HINOS PROGRAMADOS DE UMA DATA
 *
 * GET /grupo/hinos?data=2026-09-22
 * =====================================================
 */
router.get("/hinos", async (req, res) => {
  try {
    const { data } = req.query;

    if (!data) {
      return res.status(400).json({
        message: "Data do culto não informada.",
      });
    }

    const programacoes =
      await getProgramacoesHinosPorData(
        data
      );

    return res.status(200).json({
      programacoes,
    });
  } catch (error) {
    console.error(
      "Erro ao buscar programações dos grupos:",
      error
    );

    return res.status(500).json({
      message:
        error.message ??
        "Erro ao buscar programações.",
    });
  }
});

/*
 * =====================================================
 * ADICIONAR / ALTERAR HINO DO GRUPO
 *
 * POST /grupo/:idGrupo/hino
 * =====================================================
 */
router.post("/:idGrupo/hino", verifyJWT, requireGroupLeader(req => req.params.idGrupo), async (req, res) => {
  try {
    const { idGrupo } = req.params;

    const {
      id_igreja,
      data_culto,
      id_hino,
      tipo_hino,
      numero,
      titulo,
      autor,
      hinario,
    } = req.body;

    if (!idGrupo) {
      return res.status(400).json({
        message: "Grupo não informado.",
      });
    }

    if (!id_igreja) {
      return res.status(400).json({
        message: "Igreja não informada.",
      });
    }

    if (!data_culto) {
      return res.status(400).json({
        message: "Data do culto não informada.",
      });
    }

    if (!id_hino) {
      return res.status(400).json({
        message: "Hino não informado.",
      });
    }

    if (!tipo_hino) {
      return res.status(400).json({
        message: "Tipo do hino não informado.",
      });
    }

    const programacao =
      await salvarProgramacaoHino({
        idGrupo,
        idIgreja: id_igreja,
        dataCulto: data_culto,
        idHino: id_hino,
        tipoHino: tipo_hino,
        numero,
        titulo,
        autor,
        hinario,
      });

    return res.status(200).json({
      message:
        "Hino adicionado ao grupo com sucesso.",

      programacao,
    });
  } catch (error) {
    console.error(
      "Erro ao salvar hino do grupo:",
      error
    );

    return res.status(500).json({
      message:
        error.message ??
        "Erro ao salvar hino do grupo.",
    });
  }
});

/*
 * =====================================================
 * REMOVER HINO DO GRUPO
 *
 * DELETE /grupo/:idGrupo/hino?data=2026-09-22
 * =====================================================
 */
router.delete("/:idGrupo/hino", verifyJWT, requireGroupLeader(req => req.params.idGrupo), async (req, res) => {
  try {
    const { idGrupo } = req.params;
    const { data } = req.query;

    if (!idGrupo) {
      return res.status(400).json({
        message: "Grupo não informado.",
      });
    }

    if (!data) {
      return res.status(400).json({
        message: "Data do culto não informada.",
      });
    }

    const deleted =
      await removerProgramacaoHino(
        idGrupo,
        data
      );

    if (!deleted) {
      return res.status(404).json({
        message:
          "Nenhum hino encontrado para esse grupo nessa data.",
      });
    }

    return res.status(200).json({
      message:
        "Hino removido do grupo com sucesso.",
    });
  } catch (error) {
    console.error(
      "Erro ao remover hino do grupo:",
      error
    );

    return res.status(500).json({
      message:
        error.message ??
        "Erro ao remover hino do grupo.",
    });
  }
});

export default router;
