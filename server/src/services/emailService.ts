/**
 * Email Service using Resend
 * Free tier: 100 emails/day, 3000 emails/month
 * https://resend.com
 */

import type { Resend } from "resend";

class EmailService {
  private _resend: Resend | null = null;
  private _initPromise: Promise<void> | null = null;
  private fromEmail: string;

  constructor() {
    this.fromEmail =
      process.env.EMAIL_FROM || "TaskWise <onboarding@resend.dev>";
  }

  private async ensureInitialized(): Promise<void> {
    if (this._initPromise) return this._initPromise;
    this._initPromise = this._init();
    return this._initPromise;
  }

  private async _init(): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.log(
        "[EmailService] RESEND_API_KEY not set - emails will be logged only"
      );
      return;
    }
    const { Resend: ResendClient } = await import("resend");
    this._resend = new ResendClient(apiKey);
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(
    to: string,
    username: string,
    verificationToken: string
  ): Promise<boolean> {
    const verificationUrl = `${
      process.env.CLIENT_URL || "http://localhost:5173"
    }/verify-email?token=${verificationToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; }
            .logo { font-size: 28px; font-weight: bold; color: #6366f1; }
            .button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🧠 TaskWise</div>
            </div>
            <h2>Welcome to TaskWise, ${username}! 🎉</h2>
            <p>Thanks for signing up! Please verify your email address to get started with AI-powered task management.</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #6366f1;">${verificationUrl}</p>
            <p>This link expires in 24 hours.</p>
            <div class="footer">
              <p>If you didn't create a TaskWise account, you can safely ignore this email.</p>
              <p>© ${new Date().getFullYear()} TaskWise. Smart task management powered by AI.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(to, "Verify your TaskWise email", html);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    to: string,
    username: string,
    resetToken: string
  ): Promise<boolean> {
    const resetUrl = `${
      process.env.CLIENT_URL || "http://localhost:5173"
    }/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; }
            .logo { font-size: 28px; font-weight: bold; color: #6366f1; }
            .button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .warning { background: #fef3cd; border: 1px solid #ffc107; padding: 12px; border-radius: 6px; margin: 15px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🧠 TaskWise</div>
            </div>
            <h2>Password Reset Request</h2>
            <p>Hi ${username},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #6366f1;">${resetUrl}</p>
            <div class="warning">
              ⚠️ This link expires in 1 hour. If you didn't request a password reset, please ignore this email.
            </div>
            <div class="footer">
              <p>For security, this request was received from your account.</p>
              <p>© ${new Date().getFullYear()} TaskWise. Smart task management powered by AI.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(to, "Reset your TaskWise password", html);
  }

  /**
   * Send task reminder email (for users without push notifications)
   */
  async sendTaskReminderEmail(
    to: string,
    username: string,
    taskTitle: string,
    dueDate: string
  ): Promise<boolean> {
    const dashboardUrl = `${
      process.env.CLIENT_URL || "http://localhost:5173"
    }/dashboard`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; }
            .logo { font-size: 28px; font-weight: bold; color: #6366f1; }
            .task-card { background: #f8f9fa; border-left: 4px solid #6366f1; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🧠 TaskWise</div>
            </div>
            <h2>⏰ Task Reminder</h2>
            <p>Hi ${username},</p>
            <p>Just a friendly reminder about your upcoming task:</p>
            <div class="task-card">
              <strong>${taskTitle}</strong><br>
              <span style="color: #666;">Due: ${dueDate}</span>
            </div>
            <p style="text-align: center;">
              <a href="${dashboardUrl}" class="button">View in TaskWise</a>
            </p>
            <div class="footer">
              <p>You're receiving this because you have email reminders enabled.</p>
              <p>© ${new Date().getFullYear()} TaskWise. Smart task management powered by AI.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(to, `Reminder: ${taskTitle}`, html);
  }

  /**
   * Core email sending function
   */
  private async sendEmail(
    to: string,
    subject: string,
    html: string
  ): Promise<boolean> {
    await this.ensureInitialized();

    // If Resend not configured, log the email
    if (!this._resend) {
      console.log(`[EmailService] Would send email to ${to}:`);
      console.log(`  Subject: ${subject}`);
      console.log(`  (Email service not configured - set RESEND_API_KEY)`);
      return true; // Return true so the flow continues in development
    }

    try {
      const { data, error } = await this._resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject,
        html,
      });

      if (error) {
        console.error("[EmailService] Failed to send email:", error);
        return false;
      }

      console.log(`[EmailService] Email sent successfully: ${data?.id}`);
      return true;
    } catch (error) {
      console.error("[EmailService] Error sending email:", error);
      return false;
    }
  }
}

export const emailService = new EmailService();
export default emailService;
