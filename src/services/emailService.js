import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/** Gera um código aleatório de 6 dígitos */
export function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Envia e-mail com código de verificação
 * @param {string} to - e-mail do destinatário
 * @param {string} code - código de 6 dígitos
 */
export async function sendVerificationEmail(to, code) {
  const mailOptions = {
    from: `"Adoração App" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Código de verificação — Adoração App',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #FFCB69;">Verificação de e-mail</h2>
        <p>Seu código de verificação é:</p>
        <div style="font-size: 32px; font-weight: bold; color: #FFCB69; text-align: center; padding: 24px; letter-spacing: 8px;">
          ${code}
        </div>
        <p>Este código expira em 10 minutos.</p>
        <p style="color: #999; font-size: 12px;">Se você não solicitou este código, ignore este e-mail.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
