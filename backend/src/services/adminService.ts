import { pool } from '../db/pool';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError, AuthenticationError } from '../utils/errors';
import bcrypt from 'bcrypt';
import { config } from '../config';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  account_status: string;
  created_at: Date;
  last_login: Date | null;
}

interface DashboardStats {
  totalBusinesses: number;
  totalUsers: number;
  totalVenues: number;
  totalBookings: number;
  pendingBusinesses: number;
  activeUsers: number;
  recentBusinesses: Array<{
    id: string;
    businessName: string;
    ownerName: string;
    businessType: string;
    verificationStatus: string;
    createdAt: Date;
  }>;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    accountStatus: string;
    createdAt: Date;
  }>;
}

interface BusinessListFilters {
  search?: string;
  businessType?: string;
  verificationStatus?: string;
  accountStatus?: string;
  page?: number;
  limit?: number;
}

interface UserListFilters {
  search?: string;
  accountStatus?: string;
  page?: number;
  limit?: number;
}

interface PassConfiguration {
  id: string;
  name: string;
  description: string | null;
  passType: string;
  durationDays: number;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PlatformSetting {
  id: string;
  settingKey: string;
  settingValue: any;
  description: string | null;
  updatedAt: Date;
}

class AdminService {
  /**
   * Hash password for admin
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
   * Admin login
   */
  async adminLogin(email: string, password: string): Promise<AdminUser> {
    const result = await pool.query(
      `SELECT id, email, name, role, account_status, password_hash, 
              failed_login_attempts, locked_until
       FROM admin_users
       WHERE email = $1 AND deleted_at IS NULL`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw new AuthenticationError('Invalid email or password');
    }

    const admin = result.rows[0];

    // Check if account is locked
    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
      throw new AuthenticationError('Account is temporarily locked. Please try again later.');
    }

    // Check if account is suspended
    if (admin.account_status === 'suspended') {
      throw new AuthenticationError('Account is suspended');
    }

    // Verify password
    const passwordValid = await this.comparePassword(password, admin.password_hash);
    if (!passwordValid) {
      // Increment failed login attempts
      const newAttempts = (admin.failed_login_attempts || 0) + 1;
      const lockUntil =
        newAttempts >= config.security.accountLockoutAttempts
          ? new Date(Date.now() + config.security.accountLockoutDurationMinutes * 60 * 1000)
          : null;

      await pool.query(
        `UPDATE admin_users 
         SET failed_login_attempts = $1, locked_until = $2
         WHERE id = $3`,
        [newAttempts, lockUntil, admin.id]
      );

      throw new AuthenticationError('Invalid email or password');
    }

    // Reset failed attempts and update last login
    await pool.query(
      `UPDATE admin_users 
       SET failed_login_attempts = 0, locked_until = NULL, last_login = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [admin.id]
    );

    // Log admin action
    await this.logAdminAction(admin.id, 'login', 'admin_users', admin.id, {
      ip: 'system',
      userAgent: 'system',
    });

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      account_status: admin.account_status,
      created_at: admin.created_at,
      last_login: new Date(),
    };
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    // Get total counts
    const businessesResult = await pool.query(
      `SELECT COUNT(*) as count FROM business_users WHERE deleted_at IS NULL`
    );
    const usersResult = await pool.query(
      `SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL`
    );
    const venuesResult = await pool.query(
      `SELECT COUNT(*) as count FROM venues WHERE deleted_at IS NULL`
    );
    const bookingsResult = await pool.query(
      `SELECT COUNT(*) as count FROM bookings`
    );
    const pendingBusinessesResult = await pool.query(
      `SELECT COUNT(*) as count FROM business_users 
       WHERE verification_status = 'pending' AND deleted_at IS NULL`
    );
    const activeUsersResult = await pool.query(
      `SELECT COUNT(*) as count FROM users 
       WHERE account_status = 'active' AND deleted_at IS NULL`
    );

    // Get recent businesses
    const recentBusinessesResult = await pool.query(
      `SELECT id, business_name, owner_name, business_type, verification_status, created_at
       FROM business_users
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 5`
    );

    // Get recent users
    const recentUsersResult = await pool.query(
      `SELECT id, name, email, account_status, created_at
       FROM users
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 5`
    );

    return {
      totalBusinesses: parseInt(businessesResult.rows[0].count),
      totalUsers: parseInt(usersResult.rows[0].count),
      totalVenues: parseInt(venuesResult.rows[0].count),
      totalBookings: parseInt(bookingsResult.rows[0].count),
      pendingBusinesses: parseInt(pendingBusinessesResult.rows[0].count),
      activeUsers: parseInt(activeUsersResult.rows[0].count),
      recentBusinesses: recentBusinessesResult.rows.map((row) => ({
        id: row.id,
        businessName: row.business_name,
        ownerName: row.owner_name,
        businessType: row.business_type,
        verificationStatus: row.verification_status,
        createdAt: row.created_at,
      })),
      recentUsers: recentUsersResult.rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        accountStatus: row.account_status,
        createdAt: row.created_at,
      })),
    };
  }

  /**
   * Get all businesses with filters
   */
  async getBusinesses(filters: BusinessListFilters = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        id, email, business_name, owner_name, phone, business_type,
        verification_status, account_status, subscription_tier, created_at
      FROM business_users
      WHERE deleted_at IS NULL
    `;
    const params: any[] = [];
    let paramCount = 0;

    // Apply filters
    if (filters.search) {
      paramCount++;
      query += ` AND (business_name ILIKE $${paramCount} OR owner_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
    }

    if (filters.businessType) {
      paramCount++;
      query += ` AND business_type = $${paramCount}`;
      params.push(filters.businessType);
    }

    if (filters.verificationStatus) {
      paramCount++;
      query += ` AND verification_status = $${paramCount}`;
      params.push(filters.verificationStatus);
    }

    if (filters.accountStatus) {
      paramCount++;
      query += ` AND account_status = $${paramCount}`;
      params.push(filters.accountStatus);
    }

    // Get total count
    const countQuery = query.replace(
      /SELECT[\s\S]*?FROM/,
      'SELECT COUNT(*) as count FROM'
    );
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Add pagination and ordering
    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return {
      businesses: result.rows.map((row) => ({
        id: row.id,
        email: row.email,
        businessName: row.business_name,
        ownerName: row.owner_name,
        phone: row.phone,
        businessType: row.business_type,
        verificationStatus: row.verification_status,
        accountStatus: row.account_status,
        subscriptionTier: row.subscription_tier,
        createdAt: row.created_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Verify business
   */
  async verifyBusiness(businessId: string, adminId: string): Promise<void> {
    const result = await pool.query(
      `UPDATE business_users 
       SET verification_status = 'verified', business_verified = TRUE, account_status = 'active'
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [businessId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Business not found');
    }

    await this.logAdminAction(adminId, 'verify_business', 'business_users', businessId);
  }

  /**
   * Suspend business
   */
  async suspendBusiness(businessId: string, adminId: string, suspend: boolean): Promise<void> {
    const accountStatus = suspend ? 'suspended' : 'active';
    const result = await pool.query(
      `UPDATE business_users 
       SET account_status = $1
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [accountStatus, businessId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Business not found');
    }

    await this.logAdminAction(adminId, suspend ? 'suspend_business' : 'activate_business', 'business_users', businessId);
  }

  /**
   * Delete business (soft delete)
   */
  async deleteBusiness(businessId: string, adminId: string): Promise<void> {
    const result = await pool.query(
      `UPDATE business_users 
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [businessId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Business not found');
    }

    await this.logAdminAction(adminId, 'delete_business', 'business_users', businessId);
  }

  /**
   * Get all users with filters
   */
  async getUsers(filters: UserListFilters = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        id, email, name, phone, account_status, created_at, last_login
      FROM users
      WHERE deleted_at IS NULL
    `;
    const params: any[] = [];
    let paramCount = 0;

    if (filters.search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
    }

    if (filters.accountStatus) {
      paramCount++;
      query += ` AND account_status = $${paramCount}`;
      params.push(filters.accountStatus);
    }

    const countQuery = query.replace(
      /SELECT[\s\S]*?FROM/,
      'SELECT COUNT(*) as count FROM'
    );
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return {
      users: result.rows.map((row) => ({
        id: row.id,
        email: row.email,
        name: row.name,
        phone: row.phone,
        accountStatus: row.account_status,
        createdAt: row.created_at,
        lastLogin: row.last_login,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user details
   */
  async getUserDetails(userId: string) {
    const result = await pool.query(
      `SELECT 
        id, email, name, phone, country_code, avatar,
        location_lat, location_lng, location_address,
        preferences_categories, preferences_price_range,
        email_verified, phone_verified, marketing_consent,
        account_status, created_at, last_login
       FROM users
       WHERE id = $1 AND deleted_at IS NULL`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      countryCode: user.country_code,
      avatar: user.avatar,
      location: user.location_lat && user.location_lng
        ? {
            lat: parseFloat(user.location_lat),
            lng: parseFloat(user.location_lng),
            address: user.location_address,
          }
        : null,
      preferences: {
        categories: user.preferences_categories || [],
        priceRange: user.preferences_price_range,
      },
      emailVerified: user.email_verified,
      phoneVerified: user.phone_verified,
      marketingConsent: user.marketing_consent,
      accountStatus: user.account_status,
      createdAt: user.created_at,
      lastLogin: user.last_login,
    };
  }

  /**
   * Suspend user
   */
  async suspendUser(userId: string, adminId: string, suspend: boolean): Promise<void> {
    const accountStatus = suspend ? 'suspended' : 'active';
    const result = await pool.query(
      `UPDATE users 
       SET account_status = $1
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [accountStatus, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    await this.logAdminAction(adminId, suspend ? 'suspend_user' : 'activate_user', 'users', userId);
  }

  /**
   * Get pass configurations
   */
  async getPassConfigurations() {
    const result = await pool.query(
      `SELECT id, name, description, pass_type, duration_days, price, is_active, created_at, updated_at
       FROM pass_configurations
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC`
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      passType: row.pass_type,
      durationDays: row.duration_days,
      price: parseFloat(row.price),
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Create pass configuration
   */
  async createPassConfiguration(data: {
    name: string;
    description?: string;
    passType: string;
    durationDays: number;
    price: number;
    adminId: string;
  }): Promise<PassConfiguration> {
    const result = await pool.query(
      `INSERT INTO pass_configurations (name, description, pass_type, duration_days, price, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, description, pass_type, duration_days, price, is_active, created_at, updated_at`,
      [data.name, data.description || null, data.passType, data.durationDays, data.price, data.adminId]
    );

    const row = result.rows[0];
    await this.logAdminAction(data.adminId, 'create_pass_config', 'pass_configurations', row.id);

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      passType: row.pass_type,
      durationDays: row.duration_days,
      price: parseFloat(row.price),
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Update pass configuration
   */
  async updatePassConfiguration(
    id: string,
    data: {
      name?: string;
      description?: string;
      passType?: string;
      durationDays?: number;
      price?: number;
      isActive?: boolean;
      adminId: string;
    }
  ): Promise<PassConfiguration> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    if (data.name !== undefined) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      params.push(data.name);
    }
    if (data.description !== undefined) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      params.push(data.description);
    }
    if (data.passType !== undefined) {
      paramCount++;
      updates.push(`pass_type = $${paramCount}`);
      params.push(data.passType);
    }
    if (data.durationDays !== undefined) {
      paramCount++;
      updates.push(`duration_days = $${paramCount}`);
      params.push(data.durationDays);
    }
    if (data.price !== undefined) {
      paramCount++;
      updates.push(`price = $${paramCount}`);
      params.push(data.price);
    }
    if (data.isActive !== undefined) {
      paramCount++;
      updates.push(`is_active = $${paramCount}`);
      params.push(data.isActive);
    }

    if (updates.length === 0) {
      throw new ValidationError('No fields to update');
    }

    paramCount++;
    params.push(id);

    const result = await pool.query(
      `UPDATE pass_configurations 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount} AND deleted_at IS NULL
       RETURNING id, name, description, pass_type, duration_days, price, is_active, created_at, updated_at`,
      params
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Pass configuration not found');
    }

    await this.logAdminAction(data.adminId, 'update_pass_config', 'pass_configurations', id);

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      passType: row.pass_type,
      durationDays: row.duration_days,
      price: parseFloat(row.price),
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Delete pass configuration
   */
  async deletePassConfiguration(id: string, adminId: string): Promise<void> {
    const result = await pool.query(
      `UPDATE pass_configurations 
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Pass configuration not found');
    }

    await this.logAdminAction(adminId, 'delete_pass_config', 'pass_configurations', id);
  }

  /**
   * Get analytics data
   */
  async getAnalytics(period: string = 'month') {
    // Calculate date range based on period
    let dateFilter = '';
    if (period === 'week') {
      dateFilter = "AND b.created_at >= NOW() - INTERVAL '7 days'";
    } else if (period === 'month') {
      dateFilter = "AND b.created_at >= NOW() - INTERVAL '30 days'";
    } else if (period === 'year') {
      dateFilter = "AND b.created_at >= NOW() - INTERVAL '365 days'";
    }

    // Bookings by type (using venue_type from bookings table)
    const bookingsDateFilter = dateFilter.replace('b.', '');
    const bookingsByTypeResult = await pool.query(
      `SELECT venue_type as type, COUNT(id) as count
       FROM bookings
       WHERE 1=1 ${bookingsDateFilter}
       GROUP BY venue_type`
    );

    // Venue distribution (using category from venues table)
    const venueDistributionResult = await pool.query(
      `SELECT category as type, COUNT(*) as count
       FROM venues
       WHERE deleted_at IS NULL
       GROUP BY category`
    );

    // Revenue by type (using venue_type from bookings table)
    const revenueByTypeResult = await pool.query(
      `SELECT b.venue_type as type, COALESCE(SUM(p.amount), 0) as revenue
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       WHERE p.payment_status = 'completed' ${dateFilter}
       GROUP BY b.venue_type`
    );

    return {
      bookingsByType: bookingsByTypeResult.rows.map((row) => ({
        type: row.type,
        count: parseInt(row.count),
      })),
      venueDistribution: venueDistributionResult.rows.map((row) => ({
        type: row.type,
        count: parseInt(row.count),
      })),
      revenueByType: revenueByTypeResult.rows.map((row) => ({
        type: row.type,
        revenue: parseFloat(row.revenue),
      })),
    };
  }

  /**
   * Get platform settings
   */
  async getPlatformSettings(): Promise<Record<string, any>> {
    const result = await pool.query(
      `SELECT setting_key, setting_value FROM platform_settings ORDER BY setting_key`
    );

    const settings: Record<string, any> = {};
    result.rows.forEach((row) => {
      settings[row.setting_key] = row.setting_value;
    });

    return settings;
  }

  /**
   * Update platform setting
   */
  async updatePlatformSetting(
    key: string,
    value: any,
    adminId: string,
    description?: string
  ): Promise<void> {
    await pool.query(
      `INSERT INTO platform_settings (setting_key, setting_value, description, updated_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (setting_key) 
       DO UPDATE SET setting_value = $2, description = $3, updated_by = $4, updated_at = CURRENT_TIMESTAMP`,
      [key, JSON.stringify(value), description || null, adminId]
    );

    await this.logAdminAction(adminId, 'update_platform_setting', 'platform_settings', null, {
      settingKey: key,
    });
  }

  /**
   * Log admin action to audit_logs
   */
  async logAdminAction(
    adminId: string,
    action: string,
    resourceType: string,
    resourceId: string | null,
    metadata: any = {}
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO audit_logs (user_id, user_type, action, resource_type, resource_id, metadata)
         VALUES ($1, 'admin', $2, $3, $4, $5)`,
        [adminId, action, resourceType, resourceId, JSON.stringify(metadata)]
      );
    } catch (error) {
      logger.error('Failed to log admin action', { error, adminId, action });
    }
  }
}

export const adminService = new AdminService();
