import sgMail from "@sendgrid/mail";

export class SendGridService {
  constructor(private readonly sendgrid: typeof sgMail) {}

  async sendResetPasswordEmail(to: string, resetToken: string) {
    const resetLink = `http://localhost:3000/auth/reset-password?token=${resetToken}`;
    const msg = {
      to,
      from: "nstxwallet@gmail.com",
      subject: "Password Reset Request",
      text: `Hello,
  
        You requested a password reset. Please click the link below to reset your password:
        
        ${resetLink}
        
        If you did not make this request, please ignore this email or contact support.
        
        Best regards,
        NSTX Wallet Team`,

      html: `
        <div style="font-family: 'Roboto', Arial, sans-serif; background-color: #f4f4f7; padding: 20px; color: #333;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #1a73e8; color: #ffffff; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: bold;">NSTX Wallet</h1>
            </div>
            <div style="padding: 20px;">
              <h2 style="color: #2c3e50; font-size: 20px;">Password Reset Request</h2>
              <p style="margin: 0 0 10px;">Hello,</p>
              <p style="margin: 0 0 10px;">You requested a password reset. Please click the button below to reset your password:</p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${resetLink}" 
                   style="display: inline-block; background-color: #1a73e8; color: #ffffff; padding: 12px 25px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 5px;">
                   Reset Password
                </a>
              </div>
              <p style="margin: 0 0 10px;">If you did not make this request, please ignore this email or contact our support team.</p>
              <p style="margin: 0;">Best regards,<br><strong>NSTX Wallet Team</strong></p>
            </div>
            <div style="background-color: #f4f4f7; text-align: center; padding: 10px; font-size: 12px; color: #aaa;">
              <p style="margin: 0;">© ${new Date().getFullYear()} NSTX Wallet. All rights reserved.</p>
            </div>
          </div>
        </div>
      `,
    };

    try {
      await this.sendgrid.send(msg);
    } catch (error) {
      if (error instanceof Error && 'response' in error) {
        const response = (error as any).response;
        throw new Error(
          `Failed to send email: ${response ? response.body : error.message}`
        );
      }

      throw new Error(`Failed to send email: ${String(error)}`);
    }
  }
}
