// src/Adapters/Email/SMTPAdapter.js

/**
 * @file Кастомный Email-адаптер для отправки почты через любой SMTP-сервер
 *       Использует `nodemailer`
 * @module Adapters/Email/SMTPAdapter
 */

const Parse = require('parse/node');

const nodemailer = require('nodemailer');

export class SMTPAdapter {
  constructor(options) {
    if (!options || !options.host || !options.port || !options.auth) {
      throw new Error('SMTPAdapter requires host, port, and auth options');
    }
    this.transporter = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: options.secure !== false,
      auth: {
        user: options.auth.user,
        pass: options.auth.pass,
      },
    });
    this.from = options.from;
  }

  async sendMail({ to, subject, text, html }) {
    const config = await Parse.Config.get({ useMasterKey: true });

    const fromAddress = config.get('otpEmailFrom') || this.from;

    const mailOptions = {
      from: fromAddress,
      to: to,
      subject: subject,
      text: text,
      html: html,
    };
    return this.transporter.sendMail(mailOptions);
  }
}

export default SMTPAdapter;
