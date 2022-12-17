const nodemailer = require("nodemailer");
const config = require("config")

const sendEmail = async (email, subject, htmlContent) => {
  const transporter = nodemailer.createTransport({
    host: config.get("emailHost"),//smtp.gmail.com
    port: config.get("emailPort"), //465, 587
    secure: false,
    auth: {
      user: config.get("emailUser"),
      pass: config.get("emailPassword"),
    },
  });

  await transporter.sendMail({
      from: config.get("emailUser"),
      to: email,
      subject: subject,
      html: htmlContent
  });
  
};

module.exports = sendEmail;
