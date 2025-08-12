import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');

    if (!apiKey) {
      throw new Error('Resend API key is not configured!');
    }

    this.resend = new Resend(apiKey);
  }

  async sendPasswordResetLink(email: string, token: string) {
    const resetLink = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${token}`;

    const htmlBody = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; }
          .container { background-color: #0a0a0a; color: #ededed; padding: 40px; border-radius: 8px; max-width: 600px; margin: auto; }
          .header { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #ffffff; }
          .text { font-size: 16px; line-height: 1.5; color: #a1a1aa; }
          .button { display: inline-block; background-color: #ffffff; color: #0a0a0a; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { font-size: 12px; color: #71717a; margin-top: 30px; border-top: 1px solid #27272a; padding-top: 20px; }
        </style>
      </head>
      <body style="background-color: #18181b; padding: 20px;">
        <div class="container" style="background-color: #0a0a0a; color: #ededed; padding: 40px; border-radius: 8px; max-width: 600px; margin: auto;">
          <div class="header" style="font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #ffffff;">
            Reset Your Password
          </div>
          <p class="text" style="font-size: 16px; line-height: 1.5; color: #a1a1aa;">
            You requested a password reset for your Deploy-Deck account. Click the button below to set a new password.
          </p>
          <a href="${resetLink}" class="button" style="display: inline-block; background-color: #ffffff; color: #0a0a0a; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 30px 0;">
            Reset Password
          </a>
          <p class="text" style="font-size: 16px; line-height: 1.5; color: #a1a1aa;">
            This link is valid for 1 hour. If you did not request this change, please ignore this email.
          </p>
          <div class="footer" style="font-size: 12px; color: #71717a; margin-top: 30px; border-top: 1px solid #27272a; padding-top: 20px;">
            Deploy-Deck | Your unified CI/CD dashboard
          </div>
        </div>
        
      </body>
      </html>
    `;

    await this.resend.emails.send({
      from: 'Deploy-Deck <onboarding@resend.dev>',
      to: email,
      subject: 'Reset Your Password for Deploy-Deck',
      html: htmlBody,
    });
  }

  // МЕТОД ДЛЯ ВЕРИФИКАЦИИ ПОЧТЫ
  async sendVerificationLink(email: string, token: string) {
    const verificationLink = `${this.configService.get<string>('FRONTEND_URL')}/verify-email?token=${token}`;

    const htmlBody = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; }
          .container { background-color: #0a0a0a; color: #ededed; padding: 40px; border-radius: 8px; max-width: 600px; margin: auto; }
          .header { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #ffffff; }
          .text { font-size: 16px; line-height: 1.5; color: #a1a1aa; }
          .button { display: inline-block; background-color: #ffffff; color: #0a0a0a; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { font-size: 12px; color: #71717a; margin-top: 30px; border-top: 1px solid #27272a; padding-top: 20px; }
        </style>
      </head>
      <body style="background-color: #18181b; padding: 20px;">
        <div class="container" style="background-color: #0a0a0a; color: #ededed; padding: 40px; border-radius: 8px; max-width: 600px; margin: auto;">
          <div class="header" style="font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #ffffff;">
            Verify Your Email Address
          </div>
          <p class="text" style="font-size: 16px; line-height: 1.5; color: #a1a1aa;">
            Welcome to Deploy-Deck! Please click the button below to verify your email address and activate your account.
          </p>
          <a href="${verificationLink}" class="button" style="display: inline-block; background-color: #ffffff; color: #0a0a0a; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 30px 0;">
            Verify Email
          </a>
          <p class="text" style="font-size: 16px; line-height: 1.5; color: #a1a1aa;">
            This link is valid for 24 hours. If you did not create an account, no further action is required.
          </p>
          <div class="footer" style="font-size: 12px; color: #71717a; margin-top: 30px; border-top: 1px solid #27272a; padding-top: 20px;">
            Deploy-Deck | Your unified CI/CD dashboard
          </div>
        </div>
      </body>
      </html>
    `;

    await this.resend.emails.send({
      from: 'Deploy-Deck <onboarding@resend.dev>',
      to: email,
      subject: 'Verify Your Email for Deploy-Deck',
      html: htmlBody,
    });
  }
}
