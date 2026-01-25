import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });

    // Verify connection
    this.transporter.verify((error) => {
      if (error) {
        logger.error('Email service connection failed', { error });
      } else {
        logger.info('Email service ready');
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: `"${config.email.fromName}" <${config.email.from}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully', {
        to: options.to,
        messageId: info.messageId,
      });
    } catch (error) {
      logger.error('Failed to send email', { error, to: options.to });
      throw error;
    }
  }

  async sendOTPEmail(email: string, otp: string, type: 'verification' | 'reset' = 'verification'): Promise<void> {
    const subject = type === 'verification' 
      ? 'Verify Your Email - Portal'
      : 'Reset Your Password - Portal';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Portal</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">${type === 'verification' ? 'Verify Your Email Address' : 'Reset Your Password'}</h2>
            <p>${type === 'verification' 
              ? 'Thank you for signing up! Please use the verification code below to verify your email address:'
              : 'You requested to reset your password. Please use the code below to proceed:'}</p>
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #667eea;">
              <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; margin: 0;">${otp}</p>
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in ${config.otp.expiryMinutes} minutes.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Portal. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    const text = `
      ${type === 'verification' ? 'Verify Your Email Address' : 'Reset Your Password'}
      
      ${type === 'verification' 
        ? 'Thank you for signing up! Please use the verification code below to verify your email address:'
        : 'You requested to reset your password. Please use the code below to proceed:'}
      
      Verification Code: ${otp}
      
      This code will expire in ${config.otp.expiryMinutes} minutes.
      
      If you didn't request this, please ignore this email.
    `;

    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  async sendBusinessVerificationNotification(email: string, businessName: string): Promise<void> {
    const subject = 'New Business Registration - Portal';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">New Business Registration</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Business Account Pending Verification</h2>
            <p>A new business has registered and is awaiting verification:</p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Business Name:</strong> ${businessName}</p>
              <p><strong>Email:</strong> ${email}</p>
            </div>
            <p>Please review and verify the business account in the admin panel.</p>
          </div>
        </body>
      </html>
    `;

    // In production, send to admin email
    // For now, we'll log it
    logger.info('Business verification notification', { email, businessName });
    
    // Uncomment when admin email is configured
    // await this.sendEmail({
    //   to: config.email.adminEmail,
    //   subject,
    //   html,
    // });
  }
}

export const emailService = new EmailService();
