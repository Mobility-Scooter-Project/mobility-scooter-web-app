import { SMTP_HOST } from '@src/config/constants'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: 1587,
    tls: {
        rejectUnauthorized: false
    }
})

export const sendEmail = async (to: string, subject: string, sender: string, text: string) => {

    await transporter.sendMail({
        from: sender,
        to,
        subject,
        text
    })
}
