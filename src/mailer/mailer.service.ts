import { Injectable } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class MailerService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");
  }

  async sendEmailVerification(email: string, code: string) {
    await sgMail.send({
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL as string,
      subject: 'Verify Your Email',
      text: `Your verification code is ${code}`,
    });
  }

  async sendPasswordReset(email: string, code: string) {
    await sgMail.send({
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL as string,
      subject: 'Password Reset Request',
      text: `Your password reset code is ${code}`,
    });
  }
}
