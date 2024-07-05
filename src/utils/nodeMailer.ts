import nodemailer from "nodemailer";
import smtpTransport from "nodemailer-smtp-transport";
import { responseFunction } from "./commonFunctions";

export const sendMailToUser = async ({
  receiverEmail,
  senderEmail,
  amount,
}: {
  receiverEmail: string;
  senderEmail: string;
  amount: string;
}) => {
  const functionName = "sendMailToUser";
  try {
    const nodeMailerConfig = await getNodeMailerConfig();
    if (!nodeMailerConfig.status || !nodeMailerConfig?.data?.sourceEmail) {
      return responseFunction(false, null, nodeMailerConfig.message);
    }

    const htmlData = htmlTemplate(senderEmail, amount);

    const fromEmail = `<${nodeMailerConfig.data.sourceEmail}>`;
    const mailOptions: {
      from: string;
      to: string;
      subject?: string;
      ses: object;
      attachments: never[];
      html?: string;
    } = {
      from: fromEmail,
      to: receiverEmail,
      subject: " Great news! You have received funds! | Banza",
      ses: {},
      attachments: [],
      html: htmlData,
    };

    const mailing = await nodeMailerConfig.data.mailTransporter.sendMail(
      mailOptions
    );

    if (!mailing || mailing === undefined) {
      return responseFunction(false, null, "Internal Server Error");
    }

    if (mailing.response.includes("OK")) {
      console.log(
        `Email successfully sent to ${receiverEmail} about ${amount} transfer`
      );
      return responseFunction(true, null, "Mail Successfully Sent");
    }
  } catch (error: any) {
    console.error(
      functionName,
      { receiverEmail, senderEmail, amount },
      "NodeMailer",
      error.message
    );
  }
};

const getNodeMailerConfig = async () => {
  const functionName = "nodeMailerConfig";
  try {
    const emailConfig = {
      host: "smtp.gmail.com",
      secureConnection: true,
      port: 587,
      auth: {
        user: process.env.MAILER_FROM_EMAIL,
        pass: process.env.MAILER_APP_PASSWORD,
      },
    };

    const source_email = process.env.MAILER_FROM_EMAIL;
    const mailTransporter = nodemailer.createTransport(
      smtpTransport(emailConfig)
    );
    return responseFunction(true, {
      sourceEmail: source_email,
      mailTransporter,
    });
  } catch (error: any) {
    console.error(functionName, {}, "NodeMailer", error.message);
    return responseFunction(false, null, "Fail to send email.");
  }
};

const htmlTemplate = (senderEmail: string, amount: string) => {
  return `
    <body>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    /* Mobile styles */
    @media screen and (max-width: 480px) {
      .container {
        width: 100%;
        margin-top: 0;
      }

      .logo img {
        height: auto;
        width: 100%;
      }

      .button {
        width: 100%;
      }
    }
  </style>
  <center style="background: #faf9f5; padding: 20px 0;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" style="
          width: 100%;
          max-width: 600px;
          background: #ffffff;
          margin-top: 30px;
          box-shadow: 0 0 5px #ddd;
        " class="container">
      <tbody>
        <tr>
          <td style="background: black; text-align: center; padding: 20px;" class="logo">
            <img alt="Banza Logo" style="color: black; height: 40px; width: 120px;" src="https://alpha.banza.xyz/banza.png" />
          </td>
        </tr>
        <tr style="padding: 20px">
          <td style="padding: 40px; ">
            <h3 style="
                  margin-top: 2rem;
                  color: #7c7c7a;
                  line-height: 26px;
                  font-family: 'Lato', sans-serif;
                  font-size: 30px;
                  text-align: center;
                "> Hello! </h3>
            <p style="margin-left: 1rem;
              margin-right: 1rem;    font-size: 14px;  line-height: 24px;  font-family: 'Lato', sans-serif;  text-align: center;">You have just received crypto funds on the fly! ${senderEmail} has just sent you ${amount} BCN crypto to your wallet. </p>
            <p style="margin-left: 1rem;
              margin-right: 1rem;    font-size: 14px;  line-height: 24px;  font-family: 'Lato', sans-serif;  text-align: center;">Sign in to your Banza wallet with this email to access it now! </p>
            <p style="margin-top: 2rem;
              margin-right: 1rem;      line-height: 24px;  font-family: 'Lato', sans-serif;  text-align: center;">
              <button style="text-align: center; background-color: #ff8f00; border: none; color: white; padding: 15px 20px; border-radius: 5px; cursor: pointer; 
              "> <a target="_blank" href="https://alpha.banza.xyz" style="text-align: center; color: white; text-decoration: none;
              "> Open Banza </a> </button>
            </p>
          </td>
        </tr>
      </tbody>
      <tr>
        <td style=" background: #faf9f5; padding: 10px 30px 15px;">
          <p style="margin-left: 1rem;
              margin-right: 1rem;  color: #7c7c7a;  font-size: 14px;  line-height: 24px;  font-family: 'Lato', sans-serif;  text-align: center;"> &copy; 2024 Banza </p>
        </td>
      </tr>
    </table>
  </center>
</body>
`;
};
