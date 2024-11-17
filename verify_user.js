const sgMail = require("@sendgrid/mail");
const dotenv = require("dotenv");
const winston = require("winston");

// Load environment variables
dotenv.config();

// Configure SendGrid API
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Configure logging with Winston to log both to the console and a file
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} - ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "csye6225application.log" }),
  ],
});

exports.handler = async (event) => {
  const baseURL = process.env.BASE_URL;

  try {
    for (const record of event.Records) {
      const snsMessage = JSON.parse(record.Sns.Message);
      const userEmail = snsMessage.user_email;
      const userId = snsMessage.user_id;

      const verificationLink = `http://${baseURL}/v1/user/self/verify?token=${userId}`;

      const msg = {
        to: userEmail,
        from: `noreply@${baseURL}`,
        subject: "CSYE6225 Webapp - Verify Your Email",
        html: `<p>Dear User,<br>Please verify your email by <a href="${verificationLink}">clicking here</a>. This link expires in 2 minutes.
        <br><br>Thanks, <br>
        Amar Nagargoje</p>`,
      };

      try {
        const response = await sgMail.send(msg);
        logger.info(
          `Email sent to ${userEmail} with status code: ${response[0].statusCode}`
        );
      } catch (error) {
        logger.error(`Failed to send email to ${userEmail}: ${error}`);
        return {
          statusCode: 500,
          body: "Email sending failed",
        };
      }
    }

    return {
      statusCode: 200,
      body: "Verification email sent successfully",
    };
  } catch (error) {
    logger.error(`Error processing the verification: ${error}`);
    return {
      statusCode: 500,
      body: "An error occurred",
    };
  }
};
