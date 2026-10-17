const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/', verificarToken, reservaController.obtenerReservas);
router.post('/', verificarToken, reservaController.crearReserva);
router.delete('/:id', verificarToken, reservaController.cancelarReserva);

module.exports = router;