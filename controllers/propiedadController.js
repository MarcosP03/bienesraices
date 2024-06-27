import { validationResult } from 'express-validator';
import { unlink } from 'node:fs/promises'
import { Precio, Categoria, Propiedad, Mensaje, Usuario } from '../models/index.js';
import { esVendedor, formatearFecha } from '../helpers/index.js'

const admin = async (req, res) => {

  //Leer query string
  const { pagina: paginaActual } = req.query
  
  const expresion = /^[0-9]$/

  if(!expresion.test(paginaActual)) {
    return res.redirect('/mis-propiedades?pagina=1')
  }

  try {
    const { id } = req.usuario

    //Limite y offset para el paginador
    const limit = 10
    const offset = ((paginaActual * limit) -limit)

    const [propiedades, total] = await Promise.all([
      Propiedad.findAll({
        limit,
        offset,
        where: {
          usuarioId: id
        },
        include: [
          {model: Categoria, as: 'categoria'},
          {model: Precio, as: 'precio'},
          {model: Mensaje, as: 'mensajes'}
        ]
      }),
      Propiedad.count({
        where: {
          usuarioId: id
        }
      })
    ])

    res.render('propiedades/admin', {
      title: 'Mis Propiedades',
      csrfToken: req.csrfToken(),
      propiedades,
      paginas: Math.ceil(total / limit),
      paginaActual: Number(paginaActual),
      total,
      offset,
      limit
    })
    
  } catch (error) {
    console.log(error)
  }

  
}

const crear = async (req, res) => {
  //Consultar el modelo de precio y categoria
  const [categorias, precios] = await Promise.all([
    Categoria.findAll(),
    Precio.findAll()
  ])

  res.render('propiedades/crear', {
    title: 'Crear Propiedad',
    csrfToken: req.csrfToken(),
    categorias,
    precios,
    datos: {}
  })
}

const guardar = async (req, res) => {

  //Validación de los datos
  let resultado = validationResult(req);

  if(!resultado.isEmpty()) {
    //Consultar el modelo de precio y categoria
    const [categorias, precios] = await Promise.all([
      Categoria.findAll(),
      Precio.findAll()
    ])

    //Errores
    return res.render('propiedades/crear', {
      title: 'Crear Propiedad',
      csrfToken: req.csrfToken(),
      categorias,
      precios,
      errores: resultado.array(),
      datos: req.body
    })
  }

  //Crear un Registro
  
  const { titulo, descripcion, categoria: categoriaId, habitaciones, estacionamiento, wc, calle, lat, lng, precio: precioId,  } = req.body

  const { id: usuarioId } = req.usuario

  try {
    const propiedadGuardada = await Propiedad.create({
      titulo,
      descripcion,
      categoriaId,
      habitaciones,
      estacionamiento,
      wc,
      calle,
      lat,
      lng,
      precioId,
      usuarioId,
      imagen: ''
    })
    const { id } = propiedadGuardada
    res.redirect(`/propiedades/agregar-imagen/${id}`)
  } catch (error) {
    console.log(error)
  }
}

const agregarImagen = async (req, res) => {

  const { id } = req.params

  //Validar que la propiedad existe
  const propiedad = await Propiedad.findByPk(id)

  if(!propiedad) {
    return res.redirect('/mis-propiedades')
  }

  //Validar que la propiedad no esté publicada
  if(propiedad.publicado) {
    return res.redirect('/mis-propiedades')
  }

  //Validar que el usuario es el propietario
    if( req.usuario.id.toString() === propiedad.usuarioId.toString() ) {
      
    }
  res.render('propiedades/agregar-imagen', {
    title: `Agregar Imagen: ${propiedad.titulo}`,
    csrfToken: req.csrfToken(),
    propiedad
  })
}

const almacenarImagen = async (req, res, next) => {
  const { id } = req.params

  //Validar que la propiedad existe
  const propiedad = await Propiedad.findByPk(id)

  if(!propiedad) {
    return res.redirect('/mis-propiedades')
  }

  //Validar que la propiedad no esté publicada
  if(propiedad.publicado) {
    return res.redirect('/mis-propiedades')
  }

  //Validar que el usuario es el propietario
  if( req.usuario.id.toString() !== propiedad.usuarioId.toString() ) {
    return res.redirect('/mis-propiedades')  
  }

  try {
    
    //Almacenar la imagen y publicar la propiedad
    propiedad.imagen = req.file.filename
    propiedad.publicado = 1

    await propiedad.save()
    next()
  } catch (error) {
    console.log(error)
  }
}

const editar = async (req, res) => {
  const { id } = req.params

  //Validar que la propiedad existe
  const propiedad = await Propiedad.findByPk(id)

  if(!propiedad) {
    return res.redirect('/mis-propiedades')
  }

  //Validar que la propiedad sea del usuario
  if(propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
    return res.redirect('/mis-propiedades')  
  }

  //Consultar el modelo de precio y categoria
  const [categorias, precios] = await Promise.all([
    Categoria.findAll(),
    Precio.findAll()
  ])

  res.render('propiedades/editar', {
    title: `Editar Propiedad: ${propiedad.titulo}`,
    csrfToken: req.csrfToken(),
    categorias,
    precios,
    datos: propiedad
  })
}

const guardarCambios = async (req, res) => {

  //Verificar la validez de los datos
  let resultado = validationResult(req);

  if(!resultado.isEmpty()) {
    //Consultar el modelo de precio y categoria
    const [categorias, precios] = await Promise.all([
      Categoria.findAll(),
      Precio.findAll()
    ])

    //Errores
    res.render('propiedades/editar', {
      title: 'Editar Propiedad',
      csrfToken: req.csrfToken(),
      categorias,
      precios,
      errores: resultado.array(),
      datos: req.body
    })
  }

  const { id } = req.params

  //Validar que la propiedad existe
  const propiedad = await Propiedad.findByPk(id)

  if(!propiedad) {
    return res.redirect('/mis-propiedades')
  }

  //Validar que la propiedad sea del usuario
  if(propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
    return res.redirect('/mis-propiedades')  
  }

  //Reescribir los datos y actualizar la propiedad
  try {
    
    const { titulo, descripcion, categoria: categoriaId, habitaciones, estacionamiento, wc, calle, lat, lng, precio: precioId,  } = req.body
    propiedad.set({
      titulo,
      descripcion,
      categoriaId,
      habitaciones,
      estacionamiento,
      wc,
      calle,
      lat,
      lng,
      precioId
    })

    await propiedad.save()
    res.redirect('/mis-propiedades')

  } catch (error) {
    console.log(error)
  }
}

const eliminar = async (req, res) => {

  const { id } = req.params

  //Validar que la propiedad existe
  const propiedad = await Propiedad.findByPk(id)

  if(!propiedad) {
    return res.redirect('/mis-propiedades')
  }

  //Validar que la propiedad sea del usuario
  if(propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
    return res.redirect('/mis-propiedades')  
  }

  //Eliminar la imagen
  await unlink(`public/uploads/${propiedad.imagen}`)

  //Eliminar la propiedad
  await propiedad.destroy()
  res.redirect('/mis-propiedades')

}

//Cambiar el estado de la propiedad
const cambiarEstado = async (req, res) => {
  const { id } = req.params

  //Validar que la propiedad existe
  const propiedad = await Propiedad.findByPk(id)

  if(!propiedad) {
    return res.redirect('/mis-propiedades')
  }

  //Actualizar
  propiedad.publicado = !propiedad.publicado

  await propiedad.save()

  res.json({
    resultado: true
  })

}

//Muestra la propiedad
const mostrarPropiedad = async (req, res) => {
  const { id } = req.params

  //Comprobar que la propiedad existe
  const propiedad = await Propiedad.findByPk(id, {
    include: [
      {model: Precio, as: 'precio'},
      {model: Categoria, as: 'categoria'}
    ]
  })

  if(!propiedad || propiedad.publicado) {
    return res.redirect('/404')
  }

  res.render('propiedades/mostrar', {
    propiedad,
    title: propiedad.titulo,
    csrfToken: req.csrfToken(),
    usuario: req.usuario,
    esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId)
  })
}

const enviarMensaje = async (req, res) => {
  const { id } = req.params

  //Comprobar que la propiedad existe
  const propiedad = await Propiedad.findByPk(id, {
    include: [
      {model: Precio, as: 'precio'},
      {model: Categoria, as: 'categoria'}
    ]
  })

  if(!propiedad) {
    return res.redirect('/404')
  }


  //Renderizar errores
  let resultado = validationResult(req);

  if(!resultado.isEmpty()) {
    res.render('propiedades/mostrar', {
      propiedad,
      title: propiedad.titulo,
      csrfToken: req.csrfToken(),
      usuario: req.usuario,
      esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
      errores: resultado.array()
    })
  }

  const { mensaje } = req.body
  const { id: propiedadId } = req.params
  const { id: usuarioId } = req.usuario
  
  //Almacenar mensaje
  await Mensaje.create({
    mensaje,
    propiedadId,
    usuarioId
  })

  res.redirect('/')
}

//Leer mensajes recibidos
const leerMensajes = async (req, res) => {
  const { id } = req.params

  //Validar que la propiedad existe
  const propiedad = await Propiedad.findByPk(id, {
    include: [
      {model: Mensaje, as: 'mensajes', 
        include: [
          {model: Usuario.scope('eliminarPassword'), as: 'usuario'}
        ]
      }
    ]
  })

  if(!propiedad) {
    return res.redirect('/mis-propiedades')
  }

  //Validar que la propiedad sea del usuario
  if(propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
    return res.redirect('/mis-propiedades')  
  }

  res.render('propiedades/mensajes', {
    title: 'Mensajes',
    mensajes: propiedad.mensajes,
    formatearFecha
  })
}

export {
  admin,
  crear,
  guardar,
  agregarImagen,
  almacenarImagen,
  editar,
  guardarCambios,
  eliminar,
  cambiarEstado,
  mostrarPropiedad,
  enviarMensaje,
  leerMensajes
}