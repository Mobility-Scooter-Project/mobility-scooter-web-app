import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailService } from './mail.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('MailService', () => {
  const sendMailMock = jest.fn();

  const configuredSmtp = {
    host: 'smtp.office365.com',
    port: 587,
    user: 'sender@example.com',
    pass: 'smtp-pass',
    from: 'sender@example.com',
    secure: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    sendMailMock.mockReset();
    sendMailMock.mockResolvedValue(undefined);
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });
  });

  const makeConfigService = (smtp: unknown) =>
    ({
      get: jest.fn((key: string) => {
        if (key === 'smtp') return smtp;
        return undefined;
      }),
    }) as unknown as ConfigService;

  it('is not configured when SMTP host is missing', () => {
    const service = new MailService(makeConfigService({ ...configuredSmtp, host: '' }));

    expect(service.isConfigured()).toBe(false);
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });

  it('creates transporter with auth when SMTP credentials exist', () => {
    const service = new MailService(makeConfigService(configuredSmtp));

    expect(service.isConfigured()).toBe(true);
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: configuredSmtp.host,
      port: configuredSmtp.port,
      secure: configuredSmtp.secure,
      auth: { user: configuredSmtp.user, pass: configuredSmtp.pass },
    });
  });

  it('sends verification email with expected payload', async () => {
    const service = new MailService(makeConfigService(configuredSmtp));

    await service.sendVerificationEmail({
      to: 'user@example.com',
      verifyUrl: 'https://example.com/verify?token=abc',
      givenName: 'Jane',
    });

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: configuredSmtp.from,
        to: 'user@example.com',
        subject: 'Verify your email',
        text: expect.stringContaining('Hi Jane,'),
        html: expect.stringContaining('Verify email'),
      }),
    );
  });

  it('sends password reset email with expected payload', async () => {
    const service = new MailService(makeConfigService(configuredSmtp));

    await service.sendPasswordResetEmail({
      to: 'user@example.com',
      resetUrl: 'https://example.com/reset-password?token=abc',
    });

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: configuredSmtp.from,
        to: 'user@example.com',
        subject: 'Reset your password',
        text: expect.stringContaining('within 15 minutes'),
        html: expect.stringContaining('Reset password'),
      }),
    );
  });

  it('sends join-org completion email with expected payload', async () => {
    const service = new MailService(makeConfigService(configuredSmtp));

    await service.sendJoinOrgCompleteEmail({
      to: 'user@example.com',
      completeUrl: 'https://example.com/create-account?token=abc',
      givenName: 'Jane',
    });

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: configuredSmtp.from,
        to: 'user@example.com',
        subject: 'Complete your organization signup',
        text: expect.stringContaining('Hi Jane,'),
        html: expect.stringContaining('Set password'),
      }),
    );
  });

  it('throws when trying to send with SMTP not configured', async () => {
    const service = new MailService(makeConfigService({ ...configuredSmtp, host: '' }));

    await expect(
      service.sendVerificationEmail({
        to: 'user@example.com',
        verifyUrl: 'https://example.com/verify?token=abc',
      }),
    ).rejects.toThrow('SMTP is not configured');
  });
});
