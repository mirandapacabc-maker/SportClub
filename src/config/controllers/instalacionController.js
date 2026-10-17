const db = require('../config/db');

// Listar todas las instalaciones (con opción de filtrar por categoría)
exports.obtenerInstalaciones = async (req, res) => {
    try {
        const { categoria_id } = req.query;
        let query = 'SELECT i.*, c.nombre AS categoria_nombre FROM instalaciones i JOIN categorias_instalacion c ON i.categoria_id = c.id WHERE i.activa = TRUE';
        let params = [];

        if (categoria_id) {
            query += ' AND i.categoria_id = ?';
            params.push(categoria_id);
        }

        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear nueva instalación (Solo Admin)
exports.crearInstalacion = async (req, res) => {
    try {
        const { categoria_id, nombre, descripcion, capacidad_maxima, requiere_clima } = req.body;

        const [result] = await db.execute(
            'INSERT INTO instalaciones (categoria_id, nombre, descripcion, capacidad_maxima, requiere_clima) VALUES (?, ?, ?, ?, ?)',
            [categoria_id, nombre, descripcion, capacidad_maxima, requiere_clima || false]
        );

        res.status(201).json({ mensaje: 'Instalación creada con éxito', id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar estado o mantenimiento de una instalación (Solo Admin)
exports.actualizarInstalacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, capacidad_maxima, activa } = req.body;

        await db.execute(
            'UPDATE instalaciones SET nombre = ?, descripcion = ?, capacidad_maxima = ?, activa = ? WHERE id = ?',
            [nombre, descripcion, capacidad_maxima, activa, id]
        );

        res.json({ mensaje: 'Instalación actualizada correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};