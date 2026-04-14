import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'stargem.studio-gem.it',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: parseInt(process.env.SMTP_PORT || '587') === 465, // true per 465
  auth: {
    user: process.env.SMTP_USER || 'test@studio-gem.it',
    pass: process.env.SMTP_PASS || ''
  },
  tls: {
    rejectUnauthorized: false // accetta cert IONOS
  }
});

export async function sendWelcomeEmail(
  to: string,
  nome: string,
  otp: string
) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"Studio Gem" <test@studio-gem.it>',
    to,
    subject: 'Benvenuto in StarGem — Accesso Staff',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#F59E0B">Benvenuto in StarGem, ${nome}!</h2>
        <p>La segreteria di Studio Gem ha attivato il tuo accesso personale.</p>
        <div style="background:#FEF3C7;padding:20px;border-radius:8px;margin:20px 0">
          <p><strong>Email:</strong> ${to}</p>
          <p><strong>Codice accesso:</strong>
            <span style="font-size:24px;font-weight:bold;color:#D97706">${otp}</span>
          </p>
          <p style="color:#92400E;font-size:12px">Valido per 24 ore</p>
        </div>
        <a href="https://stargem.studio-gem.it/first-login" style="background:#F59E0B;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">
          Imposta la tua password →
        </a>
        <p style="color:#9CA3AF;font-size:12px;margin-top:20px">Studio Gem · Milano</p>
      </div>
    `
  });
}

export async function sendResetPasswordEmail(
  to: string,
  nome: string,
  otp: string
) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"Studio Gem" <test@studio-gem.it>',
    to,
    subject: 'Reset password Studio Gem',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#F59E0B">Reset password, ${nome}</h2>
        <p>Hai richiesto il reset della password.</p>
        <div style="background:#FEF3C7;padding:20px;border-radius:8px;margin:20px 0">
          <p><strong>Codice reset:</strong>
            <span style="font-size:24px;font-weight:bold;color:#D97706">${otp}</span>
          </p>
          <p style="color:#92400E;font-size:12px">
            Valido per 30 minuti. Se non hai richiesto il reset, ignora questa email.
          </p>
        </div>
        <a href="https://stargem.studio-gem.it/first-login" style="background:#F59E0B;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">
          Imposta nuova password →
        </a>
      </div>
    `
  });
}

export async function sendActivationConfirmEmail(
  to: string,
  nome: string
) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"Studio Gem" <test@studio-gem.it>',
    to,
    subject: '✅ Account StarGem attivato',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
        <img src="https://stargem.studio-gem.it/logo.png" alt="StarGem" style="height:40px;margin-bottom:20px" />
        <h2 style="color:#F59E0B">Account attivato, ${nome}!</h2>
        <p>Il tuo account StarGem è ora attivo.</p>
        <p>Puoi accedere in qualsiasi momento da:</p>
        <a href="https://stargem.studio-gem.it" style="background:#F59E0B;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0">
          Accedi a StarGem →
        </a>
        <p style="color:#9CA3AF;font-size:12px;margin-top:20px">
          Studio Gem · Milano<br>
          stargem.studio-gem.it
        </p>
      </div>
    `
  });
}
