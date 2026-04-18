import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '@config/constants';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly mailFrom: string;

  constructor(private readonly configService: ConfigService<AppConfig>) {
    const smtp = this.configService.get('smtp', { infer: true });
    if (!smtp?.host) {
      this.transporter = null;
      this.mailFrom = '';
      return;
    }

    this.mailFrom = smtp.from;
    this.transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      ...(smtp.user && smtp.pass
        ? { auth: { user: smtp.user, pass: smtp.pass } }
        : {}),
    });
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }

  async sendVerificationEmail(params: {
    to: string;
    verifyUrl: string;
    givenName?: string;
  }): Promise<void> {
    if (!this.transporter) {
      throw new Error('SMTP is not configured');
    }

    const subject = 'Verify your email';
    const greeting = params.givenName ? `Hi ${params.givenName},` : 'Hello,';
    const text = `${greeting}\n\nVerify your email by opening this link (it expires in 24 hours):\n\n${params.verifyUrl}\n\nIf you did not sign up, you can ignore this message.`;
    const html = `<p>${greeting}</p><p>Verify your email by clicking below (link expires in 24 hours):</p><p><a href="${params.verifyUrl}">Verify email</a></p><p>If the link does not work, copy this URL into your browser:</p><p style="word-break:break-all">${params.verifyUrl}</p><p>If you did not sign up, you can ignore this message.</p>`;

    await this.transporter.sendMail({
      from: this.mailFrom,
      to: params.to,
      subject,
      text,
      html,
    });

    this.logger.log(`Verification email sent to ${params.to}`);
  }

  async sendPasswordResetEmail(params: {
    to: string;
    resetUrl: string;
  }): Promise<void> {
    if (!this.transporter) {
      throw new Error('SMTP is not configured');
    }

    const subject = 'Reset your password';
    const text = `You asked to reset your password. Open this link within 15 minutes (it stops working after that):\n\n${params.resetUrl}\n\nIf you did not request this, you can ignore this message.`;
    const html = `<p>You asked to reset your password.</p><p><a href="${params.resetUrl}">Reset password</a></p><p>If the link does not work, copy this URL into your browser:</p><p style="word-break:break-all">${params.resetUrl}</p><p>This link expires in 15 minutes. If you did not request this, you can ignore this message.</p>`;

    await this.transporter.sendMail({
      from: this.mailFrom,
      to: params.to,
      subject,
      text,
      html,
    });

    this.logger.log(`Password reset email sent to ${params.to}`);
  }

  async sendJoinOrgCompleteEmail(params: {
    to: string;
    completeUrl: string;
    givenName?: string;
  }): Promise<void> {
    if (!this.transporter) {
      throw new Error('SMTP is not configured');
    }

    const subject = 'Complete your organization signup';
    const greeting = params.givenName ? `Hi ${params.givenName},` : 'Hello,';
    const text = `${greeting}\n\nWe received your application to join an organization. Set your password using this link (expires in 24 hours). You must use the email address from your application.\n\n${params.completeUrl}\n\nIf you did not submit this application, you can ignore this message.`;
    const html = `<p>${greeting}</p><p>We received your application to join an organization. Click below to set your password (link expires in 24 hours). Use the email address from your application.</p><p><a href="${params.completeUrl}">Set password</a></p><p>If the link does not work, copy this URL:</p><p style="word-break:break-all">${params.completeUrl}</p><p>If you did not submit this application, ignore this message.</p>`;

    await this.transporter.sendMail({
      from: this.mailFrom,
      to: params.to,
      subject,
      text,
      html,
    });

    this.logger.log(`Join-org completion email sent to ${params.to}`);
  }
}
