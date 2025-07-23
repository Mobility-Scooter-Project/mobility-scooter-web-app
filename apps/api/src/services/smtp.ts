import { SMTP_HOST } from "@src/config/constants";
import { injectable } from "inversify";
import nodemailer from "nodemailer";

@injectable()
export class SMTPService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: 1587,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * Sends an email using a preconfigured SMTP transporter.
   *
   * @param to - The recipient's email address
   * @param subject - The subject line of the email
   * @param sender - The sender's email address
   * @param text - The plain text body content of the email
   * @returns A promise that resolves when the email has been sent
   */
  public async sendEmail(
    to: string,
    subject: string,
    sender: string,
    text: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: sender,
      to,
      subject,
      text,
    });
  }
}
