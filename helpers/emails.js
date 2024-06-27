import nodemailer from 'nodemailer'

const emailRegistro = async (datos) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  })
  const { email, nombre, token } = datos;

  //Enviar correo
  await transporter.sendMail({
    from: 'bienesraices@gmail.com',
    to: email,
    subject: 'Bienes Raíces - Activación de Cuenta',
    text: 'Confirma tu cuenta Bienes Raíces',
    html: `
     <p>Hola ${nombre},</p>
      <p>Te mandamos un correo con instrucciones para activar tu cuenta.</p>
      <p>Para activar tu cuenta, haz click en el siguiente enlace:</p>
      <p><a href="${process.env.BACK_URL}:${process.env.PORT ?? 3000}/auth/confirmar/${token}">Activar Cuenta</a></p>

    Gracias por usar Bienes Raíces.
    `
  })
}

export {
  emailRegistro
}