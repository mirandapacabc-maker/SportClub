const db = require('../config/db');

// Listar reservas (Si es admin ve todas, si es socio solo las suyas)
exports.obtenerReservas = async (req, res) => {
    try {
        let query = `
            SELECT r.*, i.nombre AS instalacion_nombre, u.nombre AS usuario_nombre 
            FROM reservas r 
            JOIN instalaciones i ON r.instalacion_id = i.id 
            JOIN usuarios u ON r.usuario_id = u.id
        `;
        let params = [];

        if (req.user.rol !== 'admin') {
            query += ' WHERE r.usuario_id = ?';
            params.push(req.user.id);
        }

        query += ' ORDER BY r.fecha_reserva DESC, r.hora_inicio DESC';

        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear una nueva reserva con validación de disponibilidad y aforo
exports.crearReserva = async (req, res) => {
    try {
        const { instalacion_id, fecha_reserva, hora_inicio, hora_fin, comensales_o_personas, notas } = req.body;
        const usuario_id = req.user.id; // Obtenido del token JWT seguro

        // 1. Verificar capacidad máxima de la instalación
        const [instRows] = await db.execute('SELECT capacidad_maxima FROM instalaciones WHERE id = ? AND activa = TRUE', [instalacion_id]);
        if (instRows.length === 0) {
            return res.status(404).json({ mensaje: 'Instalación no encontrada o inactiva' });
        }
        const capacidadMaxima = instRows[0].capacidad_maxima;

        if (comensales_o_personas > capacidadMaxima) {
            return res.status(400).json({ mensaje: `La capacidad máxima para esta instalación es de ${capacidadMaxima} personas.` });
        }

        // 2. Verificar traslape de horarios en la misma instalación para la misma fecha
        const [cruceRows] = await db.execute(
            `SELECT * FROM reservas 
             WHERE instalacion_id = ? AND fecha_reserva = ? AND estado = 'confirmada' 
             AND ((hora_inicio <= ? AND hora_fin > ?) OR (hora_inicio < ? AND hora_fin >= ?))`,
            [instalacion_id, fecha_reserva, hora_inicio, hora_inicio, hora_fin, hora_fin]
        );

        if (cruceRows.length > 0) {
            return res.status(400).json({ mensaje: 'El horario seleccionado ya se encuentra ocupado para esta instalación.' });
        }

        // 3. Insertar la reserva
        const [result] = await db.execute(
            `INSERT INTO reservas (usuario_id, instalacion_id, fecha_reserva, hora_inicio, hora_fin, comensales_o_personas, notas) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [usuario_id, instalacion_id, fecha_reserva, hora_inicio, hora_fin, comensales_o_personas || 1, notas || '']
        );

        res.status(201).json({ mensaje: 'Reserva creada con éxito', reservaId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Cancelar reserva
exports.cancelarReserva = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar si la reserva pertenece al usuario o si es admin
        const [rows] = await db.execute('SELECT * FROM reservas WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ mensaje: 'Reserva no encontrada' });

        const reserva = rows[0];
        if (req.user.rol !== 'admin' && reserva.usuario_id !== req.user.id) {
            return res.status(403).json({ mensaje: 'No tienes permisos para cancelar esta reserva' });
        }

        await db.execute("UPDATE reservas SET estado = 'cancelada' WHERE id = ?", [id]);
        res.json({ mensaje: 'Reserva cancelada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};