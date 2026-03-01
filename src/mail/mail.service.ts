import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private apiUrl: string;
  private apiToken: string;
  private senderEmail: string;
  private senderName: string;

  constructor(private configService: ConfigService) {
    this.apiToken = this.configService.get<string>('MAILTRAP_API_TOKEN') || '';
    this.senderEmail = this.configService.get<string>('MAILTRAP_SENDER_EMAIL') || '';
    this.senderName = this.configService.get<string>('MAILTRAP_SENDER_NAME') || '';

    // Endpoint de Mailtrap Email Sending API
    this.apiUrl = 'https://send.api.mailtrap.io/api/send';
  }

  private async sendMailHttp(payload: any) {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Token': this.apiToken, // Autorización con token
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Mailtrap API error: ${response.status} ${errorText}`
      );
    }

    return response.json();
  }

  async sendActivationEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const activationUrl = `${frontendUrl}/activate-account/${token}`;

    const payload = {
      from: { email: this.senderEmail, name: this.senderName },
      to: [{ email }],
      subject: 'Activa tu cuenta en Powermind',
      html: `
        <h1>¡Hola ${name}!</h1>
        <p>Gracias por registrarte en Powermind. Para activar tu cuenta, haz clic en el siguiente enlace:</p>
        <a href="${activationUrl}">Activar mi cuenta</a>
        <p>Este enlace expirará en 24 horas.</p>
        <p>Si no solicitaste esta cuenta, puedes ignorar este mensaje.</p>
      `,
    };

    await this.sendMailHttp(payload);
  }

  async sendPasswordRecoveryEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const recoveryUrl = `${frontendUrl}/reset-password?token=${token}`;

    const payload = {
      from: { email: this.senderEmail, name: this.senderName },
      to: [{ email }],
      subject: 'Recuperación de contraseña - Powermind',
      html: `
        <h1>¡Hola ${name}!</h1>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
        <a href="${recoveryUrl}">Restablecer contraseña</a>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
      `,
    };

    await this.sendMailHttp(payload);
  }
}