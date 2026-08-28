import express from 'express';
import { generateCode, sendVerificationEmail } from '../services/emailService.js';

const router = express.Router();

// Armazena códigos em memória: { email: { code, expiresAt } }
const codeStore = new Map();

// Limpa códigos expirados a cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [email, entry] of codeStore) {
    if (entry.expiresAt < now) codeStore.delete(email);
  }
}, 5 * 60 * 1000);

/**
 * POST /email/send-code
 * Envia código de verificação para o e-mail
 */
router.post('/send-code', async (request, response) => {
  try {
    const { email } = request.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return response.status(400).json({ message: 'E-mail inválido.' });
    }

    const code = generateCode();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 min
    codeStore.set(email, { code, expiresAt });

    // Em ambiente de desenvolvimento, loga o código no console
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[EMAIL] Código para ${email}: ${code}`);
    }

    await sendVerificationEmail(email, code);

    response.status(200).json({ message: 'Código enviado com sucesso.' });
  } catch (error) {
    console.error('Erro ao enviar código:', error);
    response.status(500).json({ message: 'Erro ao enviar e-mail de verificação.' });
  }
});

/**
 * POST /email/verify-code
 * Verifica se o código informado é válido
 */
router.post('/verify-code', (request, response) => {
  try {
    const { email, code } = request.body;

    if (!email || !code) {
      return response.status(400).json({ message: 'E-mail e código são obrigatórios.' });
    }

    const entry = codeStore.get(email);

    if (!entry) {
      return response.status(400).json({ message: 'Nenhum código enviado para este e-mail.' });
    }

    if (entry.expiresAt < Date.now()) {
      codeStore.delete(email);
      return response.status(400).json({ message: 'Código expirado. Solicite um novo.' });
    }

    if (entry.code !== code) {
      return response.status(400).json({ message: 'Código inválido.' });
    }

    // Código válido — remove do store e retorna sucesso
    codeStore.delete(email);
    response.status(200).json({ message: 'E-mail verificado com sucesso.' });
  } catch (error) {
    console.error('Erro ao verificar código:', error);
    response.status(500).json({ message: 'Erro ao verificar código.' });
  }
});

export default router;
