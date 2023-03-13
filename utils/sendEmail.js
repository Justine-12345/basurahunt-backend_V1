const nodemailer = require('nodemailer');

const sendMail = async options => {
	const transporter = nodemailer.createTransport({
		  host: 'smtp.gmail.com',
  		  port: 587,
		auth:{
			user:process.env.SMTP_EMAIL,
			pass:process.env.SMTP_PASSWORD
		}
	});

	const message = {
		from:`${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
		to:options.email,
		subject:options.subject,
		text:options.message,
		html:options.html
	}

	await transporter.sendMail(message)
}

module.exports = sendMail;