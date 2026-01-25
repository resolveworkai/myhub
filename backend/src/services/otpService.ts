import { pool } from '../db/pool';
import { config } from '../config';
import { emailService } from './emailService';
import { logger } from '../utils/logger';
import { ValidationError, NotFoundError } from '../utils/errors';

export type OTPType = 'email_verification' | 'password_reset';

class OTPService {
  /**
   * Generate a random 6-digit OTP
   */
  generateOTP(): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < config.otp.length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  /**
   * Create and send OTP
   */
  async createAndSendOTP(
    email: string,
    type: OTPType
  ): Promise<{ otp: string; expiresAt: Date }> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Delete any existing unverified OTPs for this email and type
      await client.query(
        `DELETE FROM otps 
         WHERE email = $1 AND otp_type = $2 AND verified = FALSE AND expires_at > NOW()`,
        [email.toLowerCase(), type]
      );

      // Generate new OTP
      const otp = this.generateOTP();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + config.otp.expiryMinutes);

      // Store OTP
      await client.query(
        `INSERT INTO otps (email, otp_code, otp_type, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [email.toLowerCase(), otp, type, expiresAt]
      );

      // Send email
      await emailService.sendOTPEmail(
        email,
        otp,
        type === 'email_verification' ? 'verification' : 'reset'
      );

      await client.query('COMMIT');

      logger.info('OTP created and sent', { email, type });

      return { otp, expiresAt };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to create OTP', { error, email, type });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(
    email: string,
    otp: string,
    type: OTPType
  ): Promise<boolean> {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT id, otp_code, expires_at, attempts, verified
         FROM otps
         WHERE email = $1 AND otp_type = $2 AND verified = FALSE
         ORDER BY created_at DESC
         LIMIT 1`,
        [email.toLowerCase(), type]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('OTP not found or already used');
      }

      const otpRecord = result.rows[0];

      // Check if expired
      if (new Date(otpRecord.expires_at) < new Date()) {
        throw new ValidationError('OTP has expired');
      }

      // Check attempts
      if (otpRecord.attempts >= config.otp.maxAttempts) {
        throw new ValidationError('Maximum verification attempts exceeded');
      }

      // Verify OTP
      if (otpRecord.otp_code !== otp) {
        // Increment attempts
        await client.query(
          `UPDATE otps SET attempts = attempts + 1 WHERE id = $1`,
          [otpRecord.id]
        );
        throw new ValidationError(
          `Invalid OTP. ${config.otp.maxAttempts - otpRecord.attempts - 1} attempts remaining.`
        );
      }

      // Mark as verified
      await client.query(
        `UPDATE otps SET verified = TRUE WHERE id = $1`,
        [otpRecord.id]
      );

      logger.info('OTP verified successfully', { email, type });

      return true;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Failed to verify OTP', { error, email, type });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Resend OTP
   */
  async resendOTP(email: string, type: OTPType): Promise<void> {
    await this.createAndSendOTP(email, type);
    logger.info('OTP resent', { email, type });
  }
}

export const otpService = new OTPService();
