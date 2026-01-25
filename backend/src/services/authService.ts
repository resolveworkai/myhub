import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool';
import { config } from '../config';
import { otpService } from './otpService';
import { emailService } from './emailService';
import { logger } from '../utils/logger';
import {
  ValidationError,
  AuthenticationError,
  ConflictError,
  NotFoundError,
} from '../utils/errors';

interface MemberSignupData {
  fullName: string;
  email: string;
  phone: string;
  countryCode: string;
  password: string;
  location?: { lat: number; lng: number; address: string };
  categories: string[];
  marketingConsent: boolean;
}

interface BusinessSignupData {
  businessName: string;
  businessType: 'gym' | 'coaching' | 'library';
  registrationNumber: string;
  yearsInOperation: string;
  ownerName: string;
  email: string;
  phone: string;
  countryCode: string;
  website?: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    lat?: number;
    lng?: number;
  };
  numberOfLocations: string;
  totalCapacity: number;
  specialties: string[];
  serviceAreas: string;
  password: string;
  accountManagerEmail?: string;
  subscriptionTier: 'starter' | 'growth' | 'enterprise';
}

interface LoginCredentials {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

interface UserRecord {
  id: string;
  email: string;
  name?: string;
  business_name?: string;
  account_type: 'user' | 'business_user';
  email_verified: boolean;
  account_status: string;
  password_hash: string;
  failed_login_attempts: number;
  locked_until: Date | null;
}

class AuthService {
  /**
   * Hash password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, config.bcrypt.rounds);
  }

  /**
   * Compare password
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT tokens
   */
  generateTokens(userId: string, email: string, accountType: string): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessToken = jwt.sign(
      { userId, email, accountType },
      config.jwt.secret,
      { expiresIn: config.jwt.accessExpiry || '1h' }
    );

    const refreshToken = jwt.sign(
      { userId, email, accountType },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiry || '30d' }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Check if email exists
   */
  async checkEmailExists(email: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT 1 FROM users WHERE email = $1 AND deleted_at IS NULL
       UNION ALL
       SELECT 1 FROM business_users WHERE email = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [email.toLowerCase()]
    );
    return result.rows.length > 0;
  }

  /**
   * Check if phone exists
   */
  async checkPhoneExists(phone: string): Promise<boolean> {
    const normalizedPhone = phone.replace(/\D/g, '');
    // Use regex to match phone numbers (removing non-digits for comparison)
    const result = await pool.query(
      `SELECT 1 FROM users 
       WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = $1 AND deleted_at IS NULL
       UNION ALL
       SELECT 1 FROM business_users 
       WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [normalizedPhone]
    );
    return result.rows.length > 0;
  }

  /**
   * Member signup
   */
  async memberSignup(data: MemberSignupData): Promise<{ userId: string; email: string }> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check for existing email
      if (await this.checkEmailExists(data.email)) {
        throw new ConflictError('An account with this email already exists. Please sign in instead.');
      }

      // Check for existing phone
      if (await this.checkPhoneExists(data.phone)) {
        throw new ConflictError('An account with this phone number already exists.');
      }

      // Hash password
      const passwordHash = await this.hashPassword(data.password);

      // Insert user
      const userResult = await client.query(
        `INSERT INTO users (
          email, name, phone, country_code, password_hash,
          location_lat, location_lng, location_address,
          preferences_categories, marketing_consent, account_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, email`,
        [
          data.email.toLowerCase(),
          data.fullName,
          data.phone,
          data.countryCode,
          passwordHash,
          data.location?.lat || null,
          data.location?.lng || null,
          data.location?.address || null,
          data.categories,
          data.marketingConsent,
          'active',
        ]
      );

      const userId = userResult.rows[0].id;
      const email = userResult.rows[0].email;

      // Create and send OTP
      await otpService.createAndSendOTP(email, 'email_verification');

      // Audit log
      await client.query(
        `INSERT INTO audit_logs (user_id, user_type, action, resource_type, resource_id)
         VALUES ($1, 'user', 'signup', 'user', $1)`,
        [userId]
      );

      await client.query('COMMIT');

      logger.info('Member signup successful', { userId, email });

      return { userId, email };
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof ConflictError) {
        throw error;
      }
      logger.error('Member signup failed', { error, email: data.email });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Business signup
   */
  async businessSignup(data: BusinessSignupData): Promise<{ userId: string; email: string }> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check for existing email
      if (await this.checkEmailExists(data.email)) {
        throw new ConflictError('An account with this email already exists.');
      }

      // Hash password
      const passwordHash = await this.hashPassword(data.password);

      // Insert business user
      const businessResult = await client.query(
        `INSERT INTO business_users (
          email, business_name, owner_name, phone, country_code, password_hash,
          business_type, registration_number, years_in_operation, website,
          address_street, address_city, address_state, address_postal_code, address_country,
          address_lat, address_lng, number_of_locations, total_capacity,
          specialties, service_areas, account_manager_email, subscription_tier,
          account_status, verification_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
        RETURNING id, email, business_name`,
        [
          data.email.toLowerCase(),
          data.businessName,
          data.ownerName,
          data.phone,
          data.countryCode,
          passwordHash,
          data.businessType,
          data.registrationNumber,
          data.yearsInOperation,
          data.website || null,
          data.address.street,
          data.address.city,
          data.address.state,
          data.address.postalCode,
          data.address.country,
          data.address.lat || null,
          data.address.lng || null,
          data.numberOfLocations,
          data.totalCapacity,
          data.specialties,
          data.serviceAreas || null,
          data.accountManagerEmail || null,
          data.subscriptionTier,
          'pending_verification',
          'pending',
        ]
      );

      const userId = businessResult.rows[0].id;
      const email = businessResult.rows[0].email;
      const businessName = businessResult.rows[0].business_name;

      // Create and send OTP
      await otpService.createAndSendOTP(email, 'email_verification');

      // Send admin notification
      await emailService.sendBusinessVerificationNotification(email, businessName);

      // Audit log
      await client.query(
        `INSERT INTO audit_logs (user_id, user_type, action, resource_type, resource_id)
         VALUES ($1, 'business_user', 'signup', 'business_user', $1)`,
        [userId]
      );

      await client.query('COMMIT');

      logger.info('Business signup successful', { userId, email, businessName });

      return { userId, email };
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof ConflictError) {
        throw error;
      }
      logger.error('Business signup failed', { error, email: data.email });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Login
   */
  async login(credentials: LoginCredentials): Promise<{
    user: any;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    const client = await pool.connect();

    try {
      const { identifier, password } = credentials;
      const isEmail = identifier.includes('@');

      // Find user
      let userQuery: string;
      let queryParams: string[];

      if (isEmail) {
        userQuery = `
          SELECT id, email, name, NULL as business_name, 'user' as account_type,
                 email_verified, account_status, password_hash, failed_login_attempts, locked_until
          FROM users WHERE email = $1 AND deleted_at IS NULL
          UNION ALL
          SELECT id, email, NULL as name, business_name, 'business_user' as account_type,
                 email_verified, account_status, password_hash, failed_login_attempts, locked_until
          FROM business_users WHERE email = $1 AND deleted_at IS NULL
          LIMIT 1
        `;
        queryParams = [identifier.toLowerCase()];
      } else {
        const normalizedPhone = identifier.replace(/\D/g, '');
        userQuery = `
          SELECT id, email, name, NULL as business_name, 'user' as account_type,
                 email_verified, account_status, password_hash, failed_login_attempts, locked_until
          FROM users WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = $1 AND deleted_at IS NULL
          UNION ALL
          SELECT id, email, NULL as name, business_name, 'business_user' as account_type,
                 email_verified, account_status, password_hash, failed_login_attempts, locked_until
          FROM business_users WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = $1 AND deleted_at IS NULL
          LIMIT 1
        `;
        queryParams = [normalizedPhone];
      }

      const result = await client.query(userQuery, queryParams);

      if (result.rows.length === 0) {
        throw new AuthenticationError(
          'No account found with these credentials. Please check your email/phone or sign up.'
        );
      }

      const userRecord: UserRecord = result.rows[0];

      // Check account lock
      if (userRecord.locked_until) {
        const lockTime = new Date(userRecord.locked_until).getTime();
        if (Date.now() < lockTime) {
          const remainingMinutes = Math.ceil((lockTime - Date.now()) / 60000);
          throw new AuthenticationError(
            `Too many failed attempts. Account locked for ${remainingMinutes} minutes.`
          );
        } else {
          // Unlock account
          await client.query(
            `UPDATE ${userRecord.account_type === 'user' ? 'users' : 'business_users'}
             SET locked_until = NULL, failed_login_attempts = 0
             WHERE id = $1`,
            [userRecord.id]
          );
        }
      }

      // Check account status
      if (userRecord.account_status === 'suspended') {
        throw new AuthenticationError('Your account has been suspended. Please contact support.');
      }

      if (
        userRecord.account_type === 'business_user' &&
        userRecord.account_status === 'pending_verification'
      ) {
        throw new AuthenticationError(
          'Your business account is pending verification. Please wait for admin approval.'
        );
      }

      // Verify password
      const isPasswordValid = await this.comparePassword(password, userRecord.password_hash);

      if (!isPasswordValid) {
        const newAttempts = userRecord.failed_login_attempts + 1;

        if (newAttempts >= config.security.accountLockoutAttempts) {
          const lockUntil = new Date();
          lockUntil.setMinutes(lockUntil.getMinutes() + config.security.accountLockoutDurationMinutes);

          await client.query(
            `UPDATE ${userRecord.account_type === 'user' ? 'users' : 'business_users'}
             SET failed_login_attempts = $1, locked_until = $2
             WHERE id = $3`,
            [newAttempts, lockUntil, userRecord.id]
          );

          throw new AuthenticationError(
            `Too many failed attempts. Account locked for ${config.security.accountLockoutDurationMinutes} minutes.`
          );
        }

        await client.query(
          `UPDATE ${userRecord.account_type === 'user' ? 'users' : 'business_users'}
           SET failed_login_attempts = $1
           WHERE id = $2`,
          [newAttempts, userRecord.id]
        );

        const remaining = config.security.accountLockoutAttempts - newAttempts;
        if (remaining <= 2) {
          throw new AuthenticationError(
            `Incorrect password. ${remaining} attempts remaining before account lockout.`
          );
        }

        throw new AuthenticationError('Incorrect password. Please try again.');
      }

      // Check email verification for normal users
      if (userRecord.account_type === 'user' && !userRecord.email_verified) {
        // Generate new OTP
        await otpService.createAndSendOTP(userRecord.email, 'email_verification');
        throw new AuthenticationError(
          "Please verify your email before signing in. We've sent a new verification code.",
          'EMAIL_VERIFICATION_REQUIRED'
        );
      }

      // Success - reset failed attempts and update last login
      await client.query(
        `UPDATE ${userRecord.account_type === 'user' ? 'users' : 'business_users'}
         SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW()
         WHERE id = $1`,
        [userRecord.id]
      );

      // Get full user data
      const fullUserQuery =
        userRecord.account_type === 'user'
          ? `SELECT * FROM users WHERE id = $1`
          : `SELECT * FROM business_users WHERE id = $1`;

      const fullUserResult = await client.query(fullUserQuery, [userRecord.id]);
      const fullUser = fullUserResult.rows[0];

      // Generate tokens
      const tokens = this.generateTokens(
        userRecord.id,
        userRecord.email,
        userRecord.account_type
      );

      // Audit log
      await client.query(
        `INSERT INTO audit_logs (user_id, user_type, action, ip_address)
         VALUES ($1, $2, 'login', $3)`,
        [userRecord.id, userRecord.account_type, '127.0.0.1'] // TODO: Get real IP from request
      );

      logger.info('Login successful', { userId: userRecord.id, accountType: userRecord.account_type });

      return { user: fullUser, tokens };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      logger.error('Login failed', { error, identifier });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Verify email OTP
   */
  async verifyEmail(email: string, otp: string): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Verify OTP
      await otpService.verifyOTP(email, otp, 'email_verification');

      // Update email_verified in both tables
      await client.query(
        `UPDATE users SET email_verified = TRUE WHERE email = $1 AND deleted_at IS NULL`,
        [email.toLowerCase()]
      );

      await client.query(
        `UPDATE business_users SET email_verified = TRUE WHERE email = $1 AND deleted_at IS NULL`,
        [email.toLowerCase()]
      );

      // Audit log
      await client.query(
        `INSERT INTO audit_logs (user_id, user_type, action, resource_type)
         SELECT id, 'user', 'email_verified', 'user' FROM users WHERE email = $1 AND deleted_at IS NULL
         UNION ALL
         SELECT id, 'business_user', 'email_verified', 'business_user' FROM business_users WHERE email = $1 AND deleted_at IS NULL`,
        [email.toLowerCase()]
      );

      await client.query('COMMIT');

      logger.info('Email verified', { email });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Resend OTP
   */
  async resendOTP(email: string): Promise<void> {
    await otpService.resendOTP(email, 'email_verification');
  }
}

export const authService = new AuthService();
