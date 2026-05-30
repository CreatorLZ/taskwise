/**
 * Security Service - Audit logging and suspicious activity detection
 */

interface AuditLogEntry {
  timestamp: Date;
  action: string;
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  success: boolean;
  details?: Record<string, any>;
}

class SecurityService {
  private auditLog: AuditLogEntry[] = [];
  private failedAttempts: Map<string, { count: number; lastAttempt: Date }> =
    new Map();

  // How many failed attempts before we flag as suspicious
  private readonly SUSPICIOUS_THRESHOLD = 5;
  // Time window for failed attempts (15 minutes)
  private readonly ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
  // Account lockout duration (30 minutes)
  private readonly LOCKOUT_DURATION_MS = 30 * 60 * 1000;

  /**
   * Log an audit event
   */
  logAudit(entry: Omit<AuditLogEntry, "timestamp">): void {
    const logEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date(),
    };

    this.auditLog.push(logEntry);

    // Keep only last 10000 entries in memory (in production, persist to DB)
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-5000);
    }

    // Log to console for now (in production, use proper logger)
    const logLevel = entry.success ? "info" : "warn";
    console[logLevel](
      `[AUDIT] ${entry.action}`,
      JSON.stringify({
        email: entry.email ? this.maskEmail(entry.email) : undefined,
        success: entry.success,
        ip: entry.ip,
        details: entry.details,
      })
    );
  }

  /**
   * Track failed login attempt
   */
  trackFailedAttempt(identifier: string): {
    isSuspicious: boolean;
    shouldLock: boolean;
    attemptCount: number;
  } {
    const now = new Date();
    const existing = this.failedAttempts.get(identifier);

    if (existing) {
      // Check if within time window
      const timeSinceLastAttempt =
        now.getTime() - existing.lastAttempt.getTime();

      if (timeSinceLastAttempt > this.ATTEMPT_WINDOW_MS) {
        // Reset counter if outside window
        this.failedAttempts.set(identifier, { count: 1, lastAttempt: now });
        return { isSuspicious: false, shouldLock: false, attemptCount: 1 };
      }

      // Increment counter
      existing.count++;
      existing.lastAttempt = now;

      return {
        isSuspicious: existing.count >= this.SUSPICIOUS_THRESHOLD,
        shouldLock: existing.count >= this.SUSPICIOUS_THRESHOLD,
        attemptCount: existing.count,
      };
    }

    // First failed attempt
    this.failedAttempts.set(identifier, { count: 1, lastAttempt: now });
    return { isSuspicious: false, shouldLock: false, attemptCount: 1 };
  }

  /**
   * Clear failed attempts (on successful login)
   */
  clearFailedAttempts(identifier: string): void {
    this.failedAttempts.delete(identifier);
  }

  /**
   * Check if account should be locked
   */
  isAccountLocked(lockUntil: Date | undefined): boolean {
    if (!lockUntil) return false;
    return new Date() < lockUntil;
  }

  /**
   * Calculate lock until time
   */
  calculateLockUntil(): Date {
    return new Date(Date.now() + this.LOCKOUT_DURATION_MS);
  }

  /**
   * Mask email for logging
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split("@");
    if (!domain) return "***@***";
    const maskedLocal =
      local.length > 2
        ? local[0] + "*".repeat(local.length - 2) + local[local.length - 1]
        : "*".repeat(local.length);
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Get recent audit logs for a user
   */
  getRecentAuditLogs(userId: string, limit = 20): AuditLogEntry[] {
    return this.auditLog
      .filter((entry) => entry.userId === userId)
      .slice(-limit);
  }

  /**
   * Sanitize string input to prevent XSS
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }
}

export const securityService = new SecurityService();
export default securityService;
