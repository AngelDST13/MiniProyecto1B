// Genera el router con los 5 endpoints REST de una entidad de Administración.
import { Router } from 'express';
import { crearControladorCrud } from '../controllers/crudController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const crearRutasCrud = (entidad) => {
  const controlador = crearControladorCrud(entidad);
  const router = Router();

  router.get('/', asyncHandler(controlador.list));         // GET    /api/<entidad>
  router.get('/:id', asyncHandler(controlador.get));       // GET    /api/<entidad>/:id
  router.post('/', asyncHandler(controlador.create));      // POST   /api/<entidad>
  router.put('/:id', asyncHandler(controlador.update));    // PUT    /api/<entidad>/:id
  router.delete('/:id', asyncHandler(controlador.remove)); // DELETE /api/<entidad>/:id

  return router;
};
