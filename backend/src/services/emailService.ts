import sgMail from "@sendgrid/mail";

// Set API key with proper error handling
const apiKey = process.env.SENDGRID_API_KEY;
if (!apiKey) {
  throw new Error('SENDGRID_API_KEY environment variable is required');
}
sgMail.setApiKey(apiKey);

interface Message{
    to : string,
    from: string ,
    subject : string,
    html: string
}

export const sendEmail = async (to: string, subject: string, html: string) => {
  // Get from email with proper error handling
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  if (!fromEmail) {
    throw new Error('SENDGRID_FROM_EMAIL environment variable is required');
  }

  const msg: Message = {
    to,
    from: fromEmail,
    subject,
    html,
  };

  try {
    await sgMail.send(msg);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
