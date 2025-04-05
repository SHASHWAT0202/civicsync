import nodemailer from 'nodemailer';

// Configure email transporter
// For production, use actual SMTP credentials
// For development, use a test account or email testing service
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-password',
  },
});

// Template for registration confirmation email
export const sendRegistrationEmail = async (email: string, name: string) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"CivicSync" <noreply@civicsync.com>',
      to: email,
      subject: 'Welcome to CivicSync!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #3b82f6;">Welcome to CivicSync!</h1>
          </div>
          <div style="margin-bottom: 30px;">
            <p>Hello ${name},</p>
            <p>Thank you for registering with CivicSync. We're excited to have you join our community!</p>
            <p>With CivicSync, you can:</p>
            <ul>
              <li>Submit complaints about civic issues in your area</li>
              <li>Track the status of your complaints</li>
              <li>Engage with other community members</li>
              <li>Earn badges and points for your contributions</li>
            </ul>
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          </div>
          <div style="text-align: center; padding: 15px; background-color: #f3f4f6; border-radius: 5px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">© ${new Date().getFullYear()} CivicSync. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Registration email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending registration email:', error);
    return { success: false, error };
  }
};

// Template for complaint submission confirmation email
export const sendComplaintSubmissionEmail = async (
  email: string, 
  name: string, 
  complaintId: string, 
  complaintTitle: string
) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"CivicSync" <noreply@civicsync.com>',
      to: email,
      subject: 'Complaint Submitted Successfully',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #3b82f6;">Complaint Submitted</h1>
          </div>
          <div style="margin-bottom: 30px;">
            <p>Hello ${name},</p>
            <p>Your complaint <strong>"${complaintTitle}"</strong> has been successfully submitted.</p>
            <p><strong>Complaint ID:</strong> ${complaintId}</p>
            <p>You can track the status of your complaint through your dashboard. We'll notify you when there are updates.</p>
            <p>Thank you for contributing to making your community better!</p>
          </div>
          <div style="margin-bottom: 20px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/complaints/${complaintId}" 
               style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">
              View Complaint
            </a>
          </div>
          <div style="text-align: center; padding: 15px; background-color: #f3f4f6; border-radius: 5px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">© ${new Date().getFullYear()} CivicSync. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Complaint submission email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending complaint submission email:', error);
    return { success: false, error };
  }
};

// Template for complaint status update email
export const sendComplaintStatusUpdateEmail = async (
  email: string, 
  name: string, 
  complaintId: string, 
  complaintTitle: string, 
  newStatus: string,
  statusMessage?: string
) => {
  // Format status for display
  const formattedStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1).replace(/-/g, ' ');
  
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"CivicSync" <noreply@civicsync.com>',
      to: email,
      subject: `Complaint Status Update: ${formattedStatus}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #3b82f6;">Complaint Status Update</h1>
          </div>
          <div style="margin-bottom: 30px;">
            <p>Hello ${name},</p>
            <p>The status of your complaint <strong>"${complaintTitle}"</strong> has been updated.</p>
            <p><strong>Complaint ID:</strong> ${complaintId}</p>
            <p><strong>New Status:</strong> <span style="font-weight: bold; color: ${
              newStatus === 'completed' ? '#10b981' : 
              newStatus === 'in-progress' ? '#3b82f6' : 
              newStatus === 'rejected' ? '#ef4444' : '#f59e0b'
            };">${formattedStatus}</span></p>
            ${statusMessage ? `<p><strong>Message:</strong> ${statusMessage}</p>` : ''}
            <p>You can view the full details of your complaint on your dashboard.</p>
          </div>
          <div style="margin-bottom: 20px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/complaints/${complaintId}" 
               style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">
              View Complaint
            </a>
          </div>
          <div style="text-align: center; padding: 15px; background-color: #f3f4f6; border-radius: 5px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">© ${new Date().getFullYear()} CivicSync. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Complaint status update email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending complaint status update email:', error);
    return { success: false, error };
  }
}; 