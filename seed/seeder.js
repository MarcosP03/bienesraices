import { exit } from 'node:process';
import categorias from './Categorias.js';
import precios from './Precios.js';
import usuarios from './Usuarios.js';
import db from '../config/db.js';
import { Categoria, Precio, Usuario } from '../models/index.js';

const importarDatos = async () => {
  try {
    //Autenticar
    await db.authenticate();
    //Generar las Columnas
    await db.sync();
    //Insertar datos
    await Promise.all([
      Precio.bulkCreate(precios),
      Categoria.bulkCreate(categorias),
      Usuario.bulkCreate(usuarios)
    ])
    console.log('Datos importados correctamente');
    exit();


  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

const eliminarDatos = async () => {
  try {
    await Promise.all([
      //Precio.destroy({ where: {}, truncate: true}),
      //Categoria.destroy({ where: {}, truncate: true})
      await db.sync({ force: true }),
      console.log('Datos eliminados correctamente'),
      exit()
    ])
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

if(process.argv[2] === "-i") {
  importarDatos()
}
if(process.argv[2] === "-e") {
  eliminarDatos()
}