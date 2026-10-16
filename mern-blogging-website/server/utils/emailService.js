import nodemailer from "nodemailer";

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
      console.warn(
        `[${new Date().toISOString()}] [EMAIL-WARN]: EMAIL_USER or EMAIL_PASS not configured. Emails will be skipped.`
      );
      return null;
    }

    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: user,
        pass: pass,
      },
    });
  }
  return transporter;
};

/**
 * Send welcome email to newly registered users
 */
export const sendWelcomeEmail = async (to, name) => {
  const transport = getTransporter();
  if (!transport) return;

  const clientUrl = process.env.FRONTEND_URL || "https://hackcheck-liard.vercel.app";

  const mailOptions = {
    from: `"CheckHack" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Welcome to CheckHack!",
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
        <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 32px; text-align: center;">
          <h1 style="margin: 0; color: #fff; font-size: 28px; letter-spacing: 1px;">CheckHack</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #818cf8; margin-top: 0;">Welcome, ${name}!</h2>
          <p style="font-size: 16px; line-height: 1.6;">Thank you for joining our community of security researchers, developers, and writers.</p>
          <p style="font-size: 16px; line-height: 1.6;">You can now publish technical write-ups, read security blogs, and interact with fellow hackers.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${clientUrl}" style="background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Explore CheckHack</a>
          </div>
          <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;" />
          <p style="color: #64748b; font-size: 12px; text-align: center;">You received this email because you created an account on CheckHack.</p>
        </div>
      </div>
    `,
  };

  try {
    await transport.sendMail(mailOptions);
    console.info(`[EMAIL]: Welcome email sent successfully to ${to}`);
  } catch (error) {
    console.error(`[EMAIL-ERROR]: Failed to send welcome email to ${to}:`, error.message);
  }
};

/**
 * Send password reset email with secure token
 */
export const sendPasswordResetEmail = async (to, name, resetToken) => {
  const transport = getTransporter();
  if (!transport) {
    console.warn(`[EMAIL-WARN]: Password reset email not sent to ${to} (credentials missing). Reset token: ${resetToken}`);
    return;
  }

  const clientUrl = process.env.FRONTEND_URL || "https://hackcheck-liard.vercel.app";
  const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"CheckHack" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset Your Password - CheckHack",
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
        <div style="background: linear-gradient(135deg, #ef4444, #b91c1c); padding: 32px; text-align: center;">
          <h1 style="margin: 0; color: #fff; font-size: 28px;">Password Reset Request</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #f87171; margin-top: 0;">Hello ${name},</h2>
          <p style="font-size: 16px; line-height: 1.6;">We received a request to reset your password. Click the button below to choose a new password:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #ef4444, #b91c1c); color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #94a3b8; font-size: 14px;">This link will expire in <strong>1 hour</strong>.</p>
          <p style="color: #94a3b8; font-size: 14px;">If you did not request a password reset, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;" />
          <p style="color: #64748b; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color: #818cf8; font-size: 12px; word-break: break-all;">${resetUrl}</p>
        </div>
      </div>
    `,
  };

  try {
    await transport.sendMail(mailOptions);
    console.info(`[EMAIL]: Password reset email sent to ${to}`);
  } catch (error) {
    console.error(`[EMAIL-ERROR]: Failed to send password reset email to ${to}:`, error.message);
  }
};

/**
 * Send email verification link to newly registered users
 */
export const sendVerificationEmail = async (to, name, verificationToken) => {
  const transport = getTransporter();
  if (!transport) {
    console.warn(
      `[EMAIL-WARN]: Verification email not sent to ${to} (credentials missing). Token: ${verificationToken}`
    );
    return;
  }

  const clientUrl = process.env.FRONTEND_URL || "https://hackcheck-liard.vercel.app";
  const verifyUrl = `${clientUrl}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: `"CheckHack" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Verify Your Email Address - CheckHack",
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px; text-align: center;">
          <h1 style="margin: 0; color: #fff; font-size: 28px; letter-spacing: 1px;">CheckHack</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #34d399; margin-top: 0;">Verify Your Email Address</h2>
          <p style="font-size: 16px; line-height: 1.6;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">Thank you for registering on CheckHack. To confirm that you own this email address and protect our community, please click the button below to verify your account:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Verify Email Address</a>
          </div>
          <p style="color: #94a3b8; font-size: 14px;">This verification link will expire in <strong>24 hours</strong>.</p>
          <p style="color: #94a3b8; font-size: 14px;">Once verified, your account is immediately active—you can log in and start uploading your blogs right away without any waiting or admin approval!</p>
          <p style="color: #94a3b8; font-size: 14px;">If you didn't create an account on CheckHack, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;" />
          <p style="color: #64748b; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color: #34d399; font-size: 12px; word-break: break-all;">${verifyUrl}</p>
        </div>
      </div>
    `,
  };

  try {
    await transport.sendMail(mailOptions);
    console.info(`[EMAIL]: Verification email sent successfully to ${to}`);
  } catch (error) {
    console.error(`[EMAIL-ERROR]: Failed to send verification email to ${to}:`, error.message);
  }
};

