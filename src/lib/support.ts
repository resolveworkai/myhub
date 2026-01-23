/**
 * Support ticket utilities for Portal application
 */

const SUPPORT_EMAIL = "support@c7corp.com";

/**
 * Generate a unique ticket ID
 * Format: PORTAL-YYYYMMDD-XXXXXX
 */
export function generateTicketId(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TKT-${dateStr}-${randomPart}`;
}

/**
 * Generate timestamp for support tickets
 * Format: YYYY-MM-DD HH:MM:SS UTC
 */
export function generateTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

/**
 * Format email subject line for support tickets
 * Format: PORTAL | [TicketID] | [Timestamp] | [Subject]
 */
export function formatSupportSubject(subject: string, ticketId?: string): string {
  const ticket = ticketId || generateTicketId();
  const timestamp = generateTimestamp();
  return `PORTAL | ${ticket} | ${timestamp} | ${subject}`;
}

interface SupportEmailData {
  name: string;
  email: string;
  phone?: string;
  inquiryType: string;
  subject: string;
  message: string;
}

/**
 * Format email body for support tickets
 */
export function formatSupportBody(data: SupportEmailData, ticketId: string): string {
  const timestamp = generateTimestamp();
  
  return `
=== PORTAL Support Request ===

Ticket ID: ${ticketId}
Timestamp: ${timestamp}

--- Contact Information ---
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || 'Not provided'}
Inquiry Type: ${data.inquiryType}

--- Message ---
Subject: ${data.subject}

${data.message}

---
This is an automated support request from Portal.
Please respond to: ${data.email}
`.trim();
}

/**
 * Open email client with pre-filled support email
 */
export function openSupportEmail(data: SupportEmailData): { ticketId: string; success: boolean } {
  const ticketId = generateTicketId();
  const subject = formatSupportSubject(data.subject, ticketId);
  const body = formatSupportBody(data, ticketId);
  
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  
  const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodedSubject}&body=${encodedBody}`;
  
  try {
    window.location.href = mailtoUrl;
    return { ticketId, success: true };
  } catch {
    return { ticketId, success: false };
  }
}

/**
 * Quick support link generator for specific categories
 */
export function getQuickSupportLink(category: 'billing' | 'technical' | 'account' | 'general'): string {
  const ticketId = generateTicketId();
  const categoryLabels = {
    billing: 'Billing & Payment Issue',
    technical: 'Technical Support',
    account: 'Account Help',
    general: 'General Inquiry',
  };
  
  const subject = formatSupportSubject(categoryLabels[category], ticketId);
  const body = `
Ticket ID: ${ticketId}
Category: ${categoryLabels[category]}

Please describe your issue below:

`.trim();

  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export { SUPPORT_EMAIL };
