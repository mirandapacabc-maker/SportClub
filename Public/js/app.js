const TOKEN = localStorage.getItem('token');

// Redirigir al login si no hay token de sesión
if (!TOKEN) {
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    cargarClima();
    cargarInstalaciones();
    cargarMisReservas();

    // Evento para el Asistente IA
    document.getElementById('iaForm').addEventListener('submit', solicitarAsistenteIA);
    
    // Evento para Crear Reserva
    document.getElementById('reservaForm').addEventListener('submit', crearReserva);

    // Cerrar sesión
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
});

// 1. Cargar Clima mediante la API del Backend
async function cargarClima() {
    try {
        const res = await fetch('/api/servicios/clima?ciudad=Merida,MX', {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const data = await res.json();
        if (res.ok) {
            document.getElementById('climaInfo').innerHTML = `
                <p><strong>Temperatura:</strong> ${data.temperatura}°C</p>
                <p><strong>Estado:</strong> ${data.clima}</p>
                <p><strong>Humedad:</strong> ${data.humedad}%</p>
            `;
        }
    } catch (err) {
        document.getElementById('climaInfo').innerText = 'No se pudo cargar el clima.';
    }
}

// 2. Consultar Asistente con IA
async function solicitarAsistenteIA(e) {
    e.preventDefault();
    const promptUsuario = document.getElementById('iaPrompt').value;
    const respuestaDiv = document.getElementById('iaRespuesta');
    respuestaDiv.innerText = 'El asistente está pensando... 🤖';

    try {
        const res = await fetch('/api/servicios/asistente-ia', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}` 
            },
            body: JSON.stringify({ promptUsuario })
        });
        const data = await res.json();
        if (res.ok) {
            respuestaDiv.innerText = `🤖: ${data.recomendacion}`;
        } else {
            respuestaDiv.innerText = 'Error al obtener respuesta del asistente.';
        }
    } catch (err) {
        respuestaDiv.innerText = 'Error de conexión con la IA.';
    }
}

// 3. Cargar Lista de Instalaciones en el <select>
async function cargarInstalaciones() {
    try {
        const res = await fetch('/api/instalaciones', {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const data = await res.json();
        if (res.ok) {
            const select = document.getElementById('instalacionSelect');
            select.innerHTML = '<option value="">-- Selecciona una instalación --</option>';
            data.forEach(inst => {
                select.innerHTML += `<option value="${inst.id}">${inst.nombre} (${inst.categoria_nombre}) - Máx: ${inst.capacidad_maxima} pers.</option>`;
            });
        }
    } catch (err) {
        console.error('Error cargando instalaciones:', err);
    }
}

// 4. Crear una Nueva Reserva
async function crearReserva(e) {
    e.preventDefault();
    const reservaData = {
        instalacion_id: document.getElementById('instalacionSelect').value,
        fecha_reserva: document.getElementById('fechaReserva').value,
        hora_inicio: document.getElementById('horaInicio').value,
        hora_fin: document.getElementById('horaFin').value,
        comensales_o_personas: document.getElementById('personas').value,
        notas: document.getElementById('notasReserva').value
    };

    try {
        const res = await fetch('/api/reservas', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}` 
            },
            body: JSON.stringify(reservaData)
        });
        const data = await res.json();

        if (res.ok) {
            alert('¡Reserva realizada con éxito!');
            document.getElementById('reservaForm').reset();
            cargarMisReservas();
        } else {
            alert(`Error: ${data.mensaje}`);
        }
    } catch (err) {
        alert('Error al procesar la reserva.');
    }
}

// 5. Cargar Mis Reservas
async function cargarMisReservas() {
    const contenedor = document.getElementById('misReservasLista');
    try {
        const res = await fetch('/api/reservas', {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const data = await res.json();

        if (res.ok) {
            if (data.length === 0) {
                contenedor.innerHTML = '<p>No tienes reservas registradas actualmente.</p>';
                return;
            }

            let html = '<table style="width:100%; text-align:left; border-collapse: collapse;">';
            html += '<tr><th>Instalación</th><th>Fecha</th><th>Horario</th><th>Personas</th><th>Estado</th><th>Acción</th></tr>';
            
            data.forEach(r => {
                html += `
                    <tr style="border-bottom: 1px solid #ddd;">
                        <td style="padding: 8px;">${r.instalacion_nombre}</td>
                        <td>${r.fecha_reserva.split('T')[0]}</td>
                        <td>${r.hora_inicio} - ${r.hora_fin}</td>
                        <td>${r.comensales_o_personas}</td>
                        <td><strong>${r.estado}</strong></td>
                        <td>
                            ${r.estado === 'confirmada' ? `<button onclick="cancelarReserva(${r.id})" style="background-color:#d90429; width:auto; padding:5px 10px;">Cancelar</button>` : '-'}
                        </td>
                    </tr>
                `;
            });
            html += '</table>';
            contenedor.innerHTML = html;
        }
    } catch (err) {
        contenedor.innerHTML = '<p>Error al obtener las reservas.</p>';
    }
}

// 6. Cancelar Reserva
async function cancelarReserva(id) {
    if (!confirm('¿Seguro que deseas cancelar esta reserva?')) return;

    try {
        const res = await fetch(`/api/reservas/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const data = await res.json();

        if (res.ok) {
            alert(data.mensaje);
            cargarMisReservas();
        } else {
            alert(`Error: ${data.mensaje}`);
        }
    } catch (err) {
        alert('Error al cancelar la reserva.');
    }
}