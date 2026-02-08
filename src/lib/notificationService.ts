import { toast } from 'sonner';
import { useNotificationSettingsStore } from '@/store/notificationSettingsStore';
import type { NotificationChannel, NotificationType } from '@/types/notifications';
import type { Booking, UserPass } from '@/types/booking';

interface NotificationRecipient {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
}

interface BookingNotificationData {
  booking: Booking;
  recipient: NotificationRecipient;
}

interface PassNotificationData {
  pass: UserPass;
  recipient: NotificationRecipient;
}

// Simulated notification sending (in real app, these would call actual APIs)
const simulateSMS = async (phone: string, message: string): Promise<boolean> => {
  console.log(`📱 SMS to ${phone}: ${message}`);
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));
  return true;
};

const simulateEmail = async (email: string, subject: string, body: string): Promise<boolean> => {
  console.log(`📧 Email to ${email}: ${subject}\n${body}`);
  await new Promise(resolve => setTimeout(resolve, 100));
  return true;
};

const simulateWhatsApp = async (phone: string, message: string): Promise<boolean> => {
  console.log(`💬 WhatsApp to ${phone}: ${message}`);
  await new Promise(resolve => setTimeout(resolve, 100));
  return true;
};

// Format booking confirmation message
const formatBookingConfirmation = (booking: Booking): { subject: string; message: string } => {
  const subject = `Booking Confirmed - ${booking.businessName}`;
  const message = `
🎉 Booking Confirmed!

📍 Venue: ${booking.businessName}
📅 Date: ${booking.date}
🕐 Time: ${booking.startTime} - ${booking.endTime}
⏱️ Duration: ${booking.duration / 60} hour(s)
🌅 Shift: ${booking.shift.charAt(0).toUpperCase() + booking.shift.slice(1)}

${booking.isFreeBooking ? '💚 This is your free daily booking!' : '🎫 Booked using your pass'}

Booking ID: ${booking.id}

See you there! 👋
  `.trim();
  
  return { subject, message };
};

// Format pass purchase message
const formatPassPurchase = (pass: UserPass): { subject: string; message: string } => {
  const subject = `Pass Purchased - ${pass.businessName}`;
  const passTypeLabels = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
  };
  
  const message = `
🎫 Pass Purchase Confirmed!

📍 Venue: ${pass.businessName}
🏷️ Pass Type: ${passTypeLabels[pass.passType]} Pass
💰 Amount: ₹${pass.price}
🌅 Shift: ${pass.shift.charAt(0).toUpperCase() + pass.shift.slice(1)}
⏱️ Session Duration: ${pass.sessionDuration / 60} hour(s)

📌 Your pass will activate on your first booking.
Valid for ${pass.totalDays} day(s) from activation.

Transaction ID: ${pass.transactionId}

Enjoy your sessions! 🏋️
  `.trim();
  
  return { subject, message };
};

// Send booking confirmation notifications
export const sendBookingConfirmationNotifications = async (
  data: BookingNotificationData
): Promise<{ sms: boolean; email: boolean; whatsapp: boolean }> => {
  const { booking, recipient } = data;
  const store = useNotificationSettingsStore.getState();
  const { subject, message } = formatBookingConfirmation(booking);
  
  const results = {
    sms: false,
    email: false,
    whatsapp: false,
  };
  
  const channels: NotificationChannel[] = ['sms', 'email', 'whatsapp'];
  
  for (const channel of channels) {
    const canSend = store.canSendNotification(recipient.userId, booking.businessId, channel);
    
    if (canSend) {
      try {
        let success = false;
        
        switch (channel) {
          case 'sms':
            if (recipient.userPhone) {
              success = await simulateSMS(recipient.userPhone, message);
            }
            break;
          case 'email':
            success = await simulateEmail(recipient.userEmail, subject, message);
            break;
          case 'whatsapp':
            if (recipient.userPhone) {
              success = await simulateWhatsApp(recipient.userPhone, message);
            }
            break;
        }
        
        if (success) {
          store.sendNotification({
            userId: recipient.userId,
            businessId: booking.businessId,
            channel,
            type: 'booking_confirmation',
            subject,
            message,
            metadata: { bookingId: booking.id },
          });
          results[channel] = true;
        }
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
      }
    }
  }
  
  // Show toast with notification summary
  const sentChannels = Object.entries(results)
    .filter(([, sent]) => sent)
    .map(([channel]) => channel);
  
  if (sentChannels.length > 0) {
    toast.success('Notifications Sent', {
      description: `Confirmation sent via ${sentChannels.join(', ')}`,
    });
  }
  
  return results;
};

// Send pass purchase notifications
export const sendPassPurchaseNotifications = async (
  data: PassNotificationData
): Promise<{ sms: boolean; email: boolean; whatsapp: boolean }> => {
  const { pass, recipient } = data;
  const store = useNotificationSettingsStore.getState();
  const { subject, message } = formatPassPurchase(pass);
  
  const results = {
    sms: false,
    email: false,
    whatsapp: false,
  };
  
  const channels: NotificationChannel[] = ['sms', 'email', 'whatsapp'];
  
  for (const channel of channels) {
    const canSend = store.canSendNotification(recipient.userId, pass.businessId, channel);
    
    if (canSend) {
      try {
        let success = false;
        
        switch (channel) {
          case 'sms':
            if (recipient.userPhone) {
              success = await simulateSMS(recipient.userPhone, message);
            }
            break;
          case 'email':
            success = await simulateEmail(recipient.userEmail, subject, message);
            break;
          case 'whatsapp':
            if (recipient.userPhone) {
              success = await simulateWhatsApp(recipient.userPhone, message);
            }
            break;
        }
        
        if (success) {
          store.sendNotification({
            userId: recipient.userId,
            businessId: pass.businessId,
            channel,
            type: 'pass_purchase',
            subject,
            message,
            metadata: { passId: pass.id, transactionId: pass.transactionId },
          });
          results[channel] = true;
        }
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
      }
    }
  }
  
  if (Object.values(results).some(r => r)) {
    toast.success('Notifications Sent', {
      description: `Pass confirmation sent`,
    });
  }
  
  return results;
};
