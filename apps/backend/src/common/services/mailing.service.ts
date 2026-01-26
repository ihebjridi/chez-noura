import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class MailingService {
  private readonly logger = new Logger(MailingService.name);
  private transporter: Transporter | null = null;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly isEnabled: boolean;

  constructor() {
    // Check if email is configured
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;

    this.isEnabled = !!(smtpHost && smtpUser && smtpPassword);

    if (!this.isEnabled) {
      this.logger.warn(
        'Email service is not configured. SMTP_HOST, SMTP_USER, and SMTP_PASSWORD are required. Emails will not be sent.',
      );
      return;
    }

    // Initialize Nodemailer transporter
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    this.fromEmail = process.env.SMTP_FROM_EMAIL || smtpUser;
    this.fromName = process.env.SMTP_FROM_NAME || 'Chez Noura';

    this.logger.log('Email service initialized successfully');
  }

  /**
   * Send a generic email
   * Gracefully handles failures - logs errors but doesn't throw
   */
  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    if (!this.isEnabled || !this.transporter) {
      this.logger.warn(`Email not sent to ${options.to}: Email service is not configured`);
      return false;
    }

    try {
      const mailOptions = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html),
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${options.to}: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  /**
   * Send business admin welcome email with credentials
   */
  async sendBusinessWelcomeEmail(
    email: string,
    businessName: string,
    temporaryPassword: string,
  ): Promise<boolean> {
    const subject = `Welcome to Chez Noura - Your Business Account`;
    const html = this.getBusinessWelcomeEmailTemplate(
      businessName,
      email,
      temporaryPassword,
    );

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    temporaryPassword: string,
  ): Promise<boolean> {
    const subject = `Chez Noura - Password Reset`;
    const html = this.getPasswordResetEmailTemplate(email, temporaryPassword);

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send employee invitation email
   */
  async sendEmployeeInvitationEmail(
    email: string,
    firstName: string,
    lastName: string,
    businessName: string,
  ): Promise<boolean> {
    const subject = `Welcome to ${businessName} - Employee Account`;
    const html = this.getEmployeeInvitationEmailTemplate(
      firstName,
      lastName,
      businessName,
      email,
    );

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Business welcome email template
   */
  private getBusinessWelcomeEmailTemplate(
    businessName: string,
    email: string,
    temporaryPassword: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Welcome to Chez Noura!</h1>
    
    <p>Hello,</p>
    
    <p>Your business account for <strong>${this.escapeHtml(businessName)}</strong> has been created successfully.</p>
    
    <div style="background-color: #ffffff; padding: 20px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #3498db;">
      <p style="margin: 0 0 10px 0;"><strong>Your Login Credentials:</strong></p>
      <p style="margin: 5px 0;"><strong>Email:</strong> ${this.escapeHtml(email)}</p>
      <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background-color: #f4f4f4; padding: 4px 8px; border-radius: 3px; font-family: monospace;">${this.escapeHtml(temporaryPassword)}</code></p>
    </div>
    
    <p><strong>Important:</strong> Please change your password after your first login for security.</p>
    
    <p>You can now access your business dashboard to manage employees, orders, and menus.</p>
    
    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
      If you did not request this account, please contact support immediately.
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Password reset email template
   */
  private getPasswordResetEmailTemplate(
    email: string,
    temporaryPassword: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Password Reset</h1>
    
    <p>Hello,</p>
    
    <p>A new temporary password has been generated for your account.</p>
    
    <div style="background-color: #ffffff; padding: 20px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #e74c3c;">
      <p style="margin: 0 0 10px 0;"><strong>Your New Temporary Password:</strong></p>
      <p style="margin: 5px 0;"><code style="background-color: #f4f4f4; padding: 4px 8px; border-radius: 3px; font-family: monospace; font-size: 16px;">${this.escapeHtml(temporaryPassword)}</code></p>
    </div>
    
    <p><strong>Important:</strong> Please change your password after logging in for security.</p>
    
    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
      If you did not request this password reset, please contact support immediately.
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Employee invitation email template
   */
  private getEmployeeInvitationEmailTemplate(
    firstName: string,
    lastName: string,
    businessName: string,
    email: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Welcome to ${this.escapeHtml(businessName)}!</h1>
    
    <p>Hello ${this.escapeHtml(firstName)} ${this.escapeHtml(lastName)},</p>
    
    <p>You have been added as an employee to <strong>${this.escapeHtml(businessName)}</strong> on Chez Noura.</p>
    
    <p>You can now access your employee account using your email address:</p>
    
    <div style="background-color: #ffffff; padding: 20px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #27ae60;">
      <p style="margin: 0;"><strong>Email:</strong> ${this.escapeHtml(email)}</p>
    </div>
    
    <p>As an employee, you can:</p>
    <ul>
      <li>View daily menus</li>
      <li>Place orders for meals</li>
      <li>View your order history</li>
    </ul>
    
    <p>You can log in using email-based authentication (no password required).</p>
    
    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
      If you have any questions, please contact your business administrator.
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Convert HTML to plain text (simple implementation)
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}
