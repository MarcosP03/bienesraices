import { Dropzone } from 'dropzone'

const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content')

Dropzone.options.imagen = {
  dictDefaultMessage: 'Sube tus imágenes aquí',
  acceptedFiles: '.png,.jpg,.jpeg,.webp,.avif',
  maxFilesize: 5,
  maxFiles: 1,
  parallelUploads: 1, //Poner la misma cantidad que en maxFiles
  autoProcessQueue: false,
  addRemoveLinks: true,
  dictRemoveFile: 'Eliminar archivo',
  dictMaxFilesExceeded: 'No se permiten más archivos',
  headers: {
    'CSRF-Token': token
  },
  paramName: 'imagen',
  init: function() {
    const dropzone = this;
    const btnPublicar = document.querySelector('#publicar')

    btnPublicar.addEventListener('click', function() {
      dropzone.processQueue();
    })

    dropzone.on('queuecomplete', function(){
      if(dropzone.getActiveFiles().length === 0){
        window.location.href = '/mis-propiedades'
      }
    })
  }
}