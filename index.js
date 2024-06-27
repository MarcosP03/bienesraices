//const express = require('express'); //Common JS
import express from 'express'; //ES Modules
import csrf from 'csurf';
import cookieParser from 'cookie-parser';
import usuarioRoutes from './routes/usuarioRoutes.js';
import propiedadesRoutes from './routes/propiedadesRoutes.js';
import appRoutes from './routes/appRoutes.js';
import apiRoutes from './routes/apiRoutes.js';
import db from './config/db.js';

//Crear la app
const app = express();

//Lector de dtos de formularios
app.use(express.urlencoded({ extended: true }));

//Habilitar parsing de cookies
app.use(cookieParser());

//Habilitar el CSRF
app.use(csrf({ cookie: true }));

//DB connection
try {
    await db.authenticate();
    db.sync();
    console.log('Connection has been established successfully.');
} catch (error) {
    console.log(error);
}  

//Hablitar Pug
app.set('view engine', 'pug');
app.set('views', './views');

//static files
app.use(express.static('public'));

//Routing
app.use('/', appRoutes);
app.use('/auth', usuarioRoutes);
app.use('/', propiedadesRoutes);
app.use('/api', apiRoutes);

//Define to use port
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});