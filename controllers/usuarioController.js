import { check, validationResult } from 'express-validator';
import brycpt from 'bcrypt'
import Usuario from '../models/Usuario.js';
import { generarJWT, generarId } from '../helpers/tokens.js';
import { emailRegistro } from '../helpers/emails.js';


const formularioLogin = (req, res) => {
  res.render('auth/login', {
    title: 'Iniciar Sesión',
    csrfToken: req.csrfToken()
  })
};

const autenticar = async(req, res) => {
  //Validar formulario
  await check('email').isEmail().withMessage('El Correo es Obligatorio').run(req);
  await check('password').notEmpty().withMessage('La contraseña es Obligatoria').run(req);

  let resultado = validationResult(req);
  //Verificar errores
  if(!resultado.isEmpty()) {
    //Errores
    return res.render('auth/login', {
      title: 'Iniciar Sesión',
      csrfToken: req.csrfToken(),
      errores: resultado.array(),
    })
  }

  const { email, password } = req.body;	
  
  //Comprobar si el usuario existe
  const usuario = await Usuario.findOne({ where: { email } });
  if(!usuario) {
    return res.render('auth/login', {
      title: 'Iniciar Sesión',
      csrfToken: req.csrfToken(),
      errores: [{ msg : 'El Correo no existe' }],
    })
  }

  //Comprobar si el ususario esta confirmado
  if(!usuario.confirmado) {
    return res.render('auth/login', {
      title: 'Iniciar Sesión',
      csrfToken: req.csrfToken(),
      errores: [{ msg : 'Tu cuenta no esta confirmada' }],
    })
  }

  //Comprobar si la contraseña es correcta
  if(!usuario.verificarPassword(password)) {
    return res.render('auth/login', {
      title: 'Iniciar Sesión',
      csrfToken: req.csrfToken(),
      errores: [{ msg : 'La contraseña no es correcta' }],
    })
  }

  //Autenticar usuario
  const token = generarJWT({ id:usuario.id, nombre: usuario.nombre });

  //Almacenar en un cookie
  return res.cookie('_token', token, {
    httpOnly: true,
    //secure: true //Hosting con certificado SSL
    //SameSite: true
  }).redirect('/mis-propiedades');
}

const cerrarSesion = (req, res) => {
  return res.clearCookie('_token').status(200).redirect('/auth/login');
}

const formularioRegistro = (req, res) => {
  res.render('auth/registro', {
    title: 'Crear Cuenta',
    csrfToken: req.csrfToken()
  })
};

const registrar = async(req, res) => {
  //Validar formulario
  await check('nombre').notEmpty().withMessage('El Nombre es Obligatorio').run(req);
  await check('email').isEmail().withMessage('Eso no es una dirección de correo válido').run(req);
  await check('password').isLength({ min: 6}).withMessage('La contraseña debe tener al menos 6 caracteres').run(req);
  await check('repetir_password').equals(req.body.password).withMessage('Las contraseñas no coinciden').run(req);

  let resultado = validationResult(req);
  //Verificar errores
  if(!resultado.isEmpty()) {
    //Errores
    return res.render('auth/registro', {
      title: 'Crear Cuenta',
      csrfToken: req.csrfToken(),
      errores: resultado.array(),
      usuario: {
        nombre: req.body.nombre,
        email: req.body.email
      }
    })
  }

  //Extraer datos de usuario
  const { nombre, email, password,} = req.body;

  //Validar que el usuario no existe
  const existeUsuario = await Usuario.findOne({ where: { email } });
  if(existeUsuario) {
    return res.render('auth/registro', {
      title: 'Crear Cuenta',
      csrfToken: req.csrfToken(),
      errores: [{ msg : 'Ya existe un usuario con esa dirección de correo' }],
      usuario: {
        nombre: req.body.nombre,
        email: req.body.email
      }
    })
  }

  //Almacenar un usuario
  const usuario = await Usuario.create({ 
    nombre, 
    email, 
    password,
    token: generarId()
  });

  //Enviar correo de activación
  emailRegistro({
    nombre: usuario.nombre,
    email: usuario.email,
    token: usuario.token
  });

  //Mostrar mensaje de registro
  res.render('templates/mensaje', {
    title: 'Registro exitoso',
    mensaje: 'Hemos creado tu cuenta. Te mandaremos un correo con instrucciones para activar tu cuenta.'
  })
}

const confirmar = async(req, res, next) => {
  //Validar formulario
  const { token } = req.params

  //Validar token
  const usuario = await Usuario.findOne({ where: { token } });

  if(!usuario) {
    return res.render('auth/confirmar-cuenta', {
      title: 'Error al Confirmar Cuenta',
      mensaje: 'Error al confirmar tu cuenta. Por favor intenta de nuevo.',
      error: true
    })
  }
  //Confirmar usuario
  usuario.token = null;
  usuario.confirmado = true;
  await usuario.save();

  res.render('auth/confirmar-cuenta', {
    title: 'Confirmar Cuenta',
    mensaje: 'Tu cuenta ha sido confirmada correctamente.',
  })
}

const formularioOlvide = (req, res) => {
  res.render('auth/olvide-password', {
    title: 'Recuperar Contraseña'
  })
};

export {
  formularioLogin,
  autenticar,
  cerrarSesion,
  formularioRegistro,
  registrar,
  confirmar,
  formularioOlvide,
}