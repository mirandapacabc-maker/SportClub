const express = require('express');
const router = express.Router();
const instalacionController = require('../controllers/instalacionController');
const { verificarToken, verificarAdmin } = require('../middlewares/authMiddleware');

router.get('/', instalacionController.obtenerInstalaciones);
router.post('/', verificarToken, verificarAdmin, instalacionController.crearInstalacion);
router.put('/:id', verificarToken, verificarAdmin, instalacionController.actualizarInstalacion);

module.exports = router;