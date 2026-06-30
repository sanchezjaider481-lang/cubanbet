// ==========================================================================
// 1. CONFIGURACIÓN CENTRAL Y CREDENCIALES
// ==========================================================================
const TELEGRAM_TOKEN = '8800459646:AAFuPXErVD2HD3y4gISSkUV9Nm2JSAbkdJo';
const TELEGRAM_CHAT_ID = '-1004432353397';

const tg = window.Telegram ? window.Telegram.WebApp : null;
let usuarioId = "5610054384"; 
let usuarioNombre = "@alexxxsanche"; 

if (tg) {
    tg.ready();
    tg.expand();
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        usuarioId = user.id;
        usuarioNombre = user.username ? `@${user.username}` : `${user.first_name}`;
    }
}

let deporteActivo = 'futbol';

// AQUÍ CAMBIA: Ahora es una lista (Array) para acumular múltiples selecciones en el Parlay
let parlayApuestas = [];

// ==========================================================================
// 2. BASE DE DATOS MASIVA CON MERCADOS EXTRAS
// ==========================================================================
const partidosPrueba = [
    {
        id: 1,
        deporte: 'futbol',
        liga: 'Fútbol • Liga de Campeones UEFA',
        local: 'Real Madrid',
        visitante: 'Manchester City',
        marcadorLocal: '2',
        marcadorVisitante: '1',
        enVivo: true,
        cuotaLocal: '1.65',
        cuotaEmpate: '3.80',
        cuotaVisitante: '5.20',
        mercadosExtra: [
            { titulo: 'Doble Oportunidad', opciones: [{ opc: '1X', q: '1.22' }, { opc: '12', q: '1.25' }, { opc: 'X2', q: '1.85' }] },
            { titulo: 'Total de Goles', opciones: [{ opc: 'Más de 2.5', q: '1.95' }, { opc: 'Menos de 2.5', q: '1.80' }] },
            { titulo: 'Ambos Equipos Anotan', opciones: [{ opc: 'Sí', q: '1.68' }, { opc: 'No', q: '2.10' }] }
        ]
    },
    {
        id: 2,
        deporte: 'beisbol',
        liga: 'Béisbol • MLB Regular Season',
        local: 'Yankees de Nueva York',
        visitante: 'Medias Rojas de Boston',
        marcadorLocal: '4',
        marcadorVisitante: '2',
        enVivo: true,
        cuotaLocal: '1.75',
        cuotaEmpate: '—', 
        cuotaVisitante: '2.10',
        mercadosExtra: [
            { titulo: 'Carreras Totales', opciones: [{ opc: 'Más de 7.5', q: '1.85' }, { opc: 'Menos de 7.5', q: '1.95' }] },
            { titulo: 'Hándicap de Carreras', opciones: [{ opc: 'Yankees -1.5', q: '2.30' }, { opc: 'Boston +1.5', q: '1.62' }] }
        ]
    },
    {
        id: 3,
        deporte: 'basket',
        liga: 'Basket • Finales NBA',
        local: 'Lakers de Los Ángeles',
        visitante: 'Celtics de Boston',
        marcadorLocal: '98',
        marcadorVisitante: '102',
        enVivo: true,
        cuotaLocal: '2.20',
        cuotaEmpate: '—',
        cuotaVisitante: '1.60',
        mercadosExtra: [
            { titulo: 'Puntos Totales', opciones: [{ opc: 'Más de 215.5', q: '1.90' }, { opc: 'Menos de 215.5', q: '1.90' }] },
            { titulo: 'Hándicap de Puntos', opciones: [{ opc: 'Lakers +3.5', q: '1.90' }, { opc: 'Celtics -3.5', q: '1.90' }] }
        ]
    },
    {
        id: 4,
        deporte: 'tenis',
        liga: 'Tenis • Wimbledon',
        local: 'Carlos Alcaraz',
        visitante: 'Novak Djokovic',
        marcadorLocal: '2',
        marcadorVisitante: '1',
        enVivo: true,
        cuotaLocal: '1.90',
        cuotaEmpate: '—',
        cuotaVisitante: '1.90',
        mercadosExtra: [
            { titulo: 'Total de Juegos', opciones: [{ opc: 'Más de 38.5', q: '1.85' }, { opc: 'Menos de 38.5', q: '1.85' }] }
        ]
    }
];

// ==========================================================================
// 3. LOGICA DE RENDERIZADO
// ==========================================================================
function cambiarDeporte(deporte, botonPresionado) {
    deporteActivo = deporte;
    const botones = document.querySelectorAll('.menu-deportes button');
    botones.forEach(btn => btn.classList.remove('active'));
    botonPresionado.classList.add('active');
    cargarPartidos();
}

function cargarPartidos() {
    const contenedor = document.getElementById('lista-partidos');
    if (!contenedor) return;
    
    contenedor.innerHTML = ''; 
    const partidosFiltrados = partidosPrueba.filter(p => p.deporte === deporteActivo);

    if (partidosFiltrados.length === 0) {
        contenedor.innerHTML = `<p class="cargando">No hay partidos disponibles.</p>`;
        return;
    }

    partidosFiltrados.forEach(partido => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-partido';

        const botonEmpateOculto = partido.cuotaEmpate === '—' 
            ? `<button class="btn-cuota" disabled style="opacity: 0.25; cursor: not-allowed;"><span class="indicador-tipo">X</span><span class="cuota">—</span></button>`
            : `<button class="btn-cuota" onclick="seleccionarJugada(${partido.id}, 'Empate', '${partido.cuotaEmpate}')"><span class="indicador-tipo">X</span><span class="cuota">${partido.cuotaEmpate}</span></button>`;

        let htmlMercadosMúltiples = '';
        const mercadosAMostrar = partido.mercadosExtra || [];

        mercadosAMostrar.forEach(mercado => {
            let layoutColumnas = 'grid-template-columns: repeat(2, 1fr);';
            let botonesOpciones = '';
            mercado.opciones.forEach(o => {
                botonesOpciones += `
                    <button class="btn-cuota" onclick="seleccionarJugada(${partido.id}, '${o.opc}', '${o.q}')">
                        <span class="indicador-tipo" style="font-size:0.71rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${o.opc}</span>
                        <span class="cuota">${o.q}</span>
                    </button>
                `;
            });

            htmlMercadosMúltiples += `
                <div style="margin-bottom: 12px;">
                    <span style="font-size: 0.7rem; color: #728a80; display: block; margin-bottom: 5px; text-transform: uppercase; font-weight: bold;">${mercado.titulo}</span>
                    <div class="opciones-apuesta" style="${layoutColumnas} gap: 6px;">
                        ${botonesOpciones}
                    </div>
                </div>
            `;
        });

        tarjeta.innerHTML = `
            <div class="info-partido">
                <span class="liga">${partido.liga}</span>
                <span class="${partido.enVivo ? 'en-vivo' : ''}">EN VIVO</span>
            </div>
            <div class="bloque-central">
                <div class="equipos-marcador">
                    <div class="fila-equipo"><span>${partido.local}</span><span class="marcador-en-vivo">${partido.marcadorLocal}</span></div>
                    <div class="fila-equipo"><span>${partido.visitante}</span><span class="marcador-en-vivo">${partido.marcadorVisitante}</span></div>
                </div>
            </div>
            <div class="opciones-apuesta">
                <button class="btn-cuota" onclick="seleccionarJugada(${partido.id}, 'Local', '${partido.cuotaLocal}')"><span class="indicador-tipo">1</span><span class="cuota">${partido.cuotaLocal}</span></button>
                ${botonEmpateOculto}
                <button class="btn-cuota" onclick="seleccionarJugada(${partido.id}, 'Visitante', '${partido.cuotaVisitante}')"><span class="indicador-tipo">2</span><span class="cuota">${partido.cuotaVisitante}</span></button>
            </div>
            <div style="text-align: center; margin-top: 6px;">
                <button onclick="toggleMercadosExtra(${partido.id})" style="background: none; border: none; color: #8ce605; font-size: 0.75rem; font-weight: bold; cursor: pointer;">
                    <i class="fa-solid fa-angles-down"></i> <span id="lbl-toggle-${partido.id}">+ Ver mercados</span>
                </button>
            </div>
            <div id="extras-${partido.id}" style="display: none; margin-top: 12px; padding-top: 12px; border-top: 1px dashed #1e4235;">
                ${htmlMercadosMúltiples}
            </div>
        `;
        contenedor.appendChild(tarjeta);
    });
}

function toggleMercadosExtra(partidoId) {
    const seccion = document.getElementById(`extras-${partidoId}`);
    if (seccion) seccion.style.display = seccion.style.display === 'none' ? 'block' : 'none';
}

// ==========================================================================
// 4. NUEVA LÓGICA DEL BOLETO: ENFOQUE PARLAY (COMBINADAS)
// ==========================================================================
function seleccionarJugada(partidoId, opcion, cuota) {
    const partido = partidosPrueba.find(p => p.id === partidoId);
    if (!partido) return;

    // Regla de Parlay: No se permite meter dos selecciones del mismo partido
    const nombrePartido = `${partido.local} vs ${partido.visitante}`;
    const yaExistePartido = parlayApuestas.some(item => item.partido === nombrePartido);

    if (yaExistePartido) {
        alert("¡Regla de Parlay! No puedes combinar dos mercados del mismo partido. Elige eventos diferentes.");
        return;
    }

    // Insertar la nueva selección al listado
    parlayApuestas.push({
        partido: nombrePartido,
        opcion: opcion,
        cuota: parseFloat(cuota)
    });

    actualizarBoletoVista();
}

function actualizarBoletoVista() {
    const boleto = document.getElementById('boleto-apuesta');
    if (parlayApuestas.length === 0) {
        boleto.style.display = 'none';
        return;
    }

    // Calcular la Cuota Total del Parlay multiplicando todos los logros entre sí
    let cuotaTotalParlay = 1;
    let htmlSelecciones = '';

    parlayApuestas.forEach((apuesta, index) => {
        cuotaTotalParlay *= apuesta.cuota;
        htmlSelecciones += `
            <div style="border-bottom: 1px solid #142d24; padding-bottom: 6px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <p class="b-partido" style="margin:0;">${apuesta.partido}</p>
                    <p style="margin:0;">Logro: <strong>${apuesta.opcion}</strong></p>
                </div>
                <div style="text-align: right; display: flex; align-items: center; gap: 8px;">
                    <span style="color:#8ce605; font-weight:bold;">@${apuesta.cuota.toFixed(2)}</span>
                    <button onclick="eliminarDelParlay(${index})" style="background:none; border:none; color:#ff4444; font-size:1rem; cursor:pointer;">&times;</button>
                </div>
            </div>
        `;
    });

    // Guardar el coeficiente total calculado en un atributo oculto para usarlo en las ganancias
    boleto.dataset.cuotaTotal = cuotaTotalParlay.toFixed(2);

    // Cambiar dinámicamente el título del boleto según el tipo de jugada
    const tipoApuestaLabel = parlayApuestas.length > 1 ? `PARLAY (x${parlayApuestas.length} Logros)` : "Apuesta Derecha";
    
    // Inyectar el cuerpo renderizado
    const cuerpoBoleto = document.querySelector('.boleto-cuerpo');
    cuerpoBoleto.innerHTML = `
        <div style="max-height: 140px; overflow-y: auto; margin-bottom: 10px;">
            ${htmlSelecciones}
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 8px; border-top: 1px solid #142d24; padding-top: 6px;">
            <span>Tipo: <strong style="color: #8ce605;">${tipoApuestaLabel}</strong></span>
            <span>Cuota Total: <strong style="color: #8ce605;">@${cuotaTotalParlay.toFixed(2)}</strong></span>
        </div>
        <div class="b-monto-bloque">
            <label>Monto (CUP):</label>
            <input type="number" id="apuesta-monto" oninput="calcularGanancia()" placeholder="0.00">
        </div>
        <div class="b-retorno">
            <span>Ganancia Posible:</span>
            <strong id="boleto-ganancia">0.00 CUP</strong>
        </div>
        <button class="btn-enviar-apuesta" onclick="enviarApuestaTelegram()">Confirmar Apuesta</button>
    `;

    boleto.style.display = 'block';
}

function eliminarDelParlay(index) {
    parlayApuestas.splice(index, 1);
    actualizarBoletoVista();
}

function calcularGanancia() {
    const inputMonto = document.getElementById('apuesta-monto');
    const boleto = document.getElementById('boleto-apuesta');
    const monto = parseFloat(inputMonto.value);
    const cuotaTotal = parseFloat(boleto.dataset.cuotaTotal);

    if (monto > 0 && cuotaTotal > 0) {
        const ganancia = monto * cuotaTotal;
        document.getElementById('boleto-ganancia').innerText = `${ganancia.toFixed(2)} CUP`;
    } else {
        document.getElementById('boleto-ganancia').innerText = '0.00 CUP';
    }
}

function cerrarBoleto() {
    document.getElementById('boleto-apuesta').style.display = 'none';
    parlayApuestas = []; // Limpia el boleto por completo
}

// ==========================================================================
// 5. ENVÍO DE LA JUGADA MULTI-LOGROS A TELEGRAM
// ==========================================================================
function enviarApuestaTelegram() {
    const monto = parseFloat(document.getElementById('apuesta-monto').value);
    if (parlayApuestas.length === 0 || isNaN(monto) || monto <= 0) {
        alert("Escribe un monto válido.");
        return;
    }

    const boleto = document.getElementById('boleto-apuesta');
    const cuotaFinal = parseFloat(boleto.dataset.cuotaTotal);
    const ganancia = (monto * cuotaFinal).toFixed(2);

    // Determinar si es Derecho o Parlay para el formato del mensaje
    const esParlay = parlayApuestas.length > 1;
    let encabezadoTipo = esParlay ? `🔥 <b>¡NUEVO PARLAY COMBINADO!</b>` : `🎰 <b>¡APUESTA DERECHA REALIZADA!</b>`;

    // Armar la tira de partidos uno a uno
    let cuerpoLogros = '';
    parlayApuestas.forEach((ap, i) => {
        cuerpoLogros += `\n🔸 <b>Logro #${i+1}:</b> ${ap.partido}\n   👉 <i>Selección: ${ap.opcion} (@${ap.cuota})</i>\n`;
    });

    const mensajeText = `${encabezadoTipo}\n\n` +
                        `👤 <b>Apostador:</b> ${usuarioNombre}\n` +
                        `🆔 <b>ID:</b> <code>${usuarioId}</code>\n` +
                        `----------------------------` +
                        `${cuerpoLogros}` +
                        `----------------------------\n` +
                        `📈 <b>Cuota Total:</b> @${cuotaFinal.toFixed(2)}\n` +
                        `💵 <b>Importe:</b> $${monto} CUP\n` +
                        `💰 <b>Ganancia Posible:</b> $${ganancia} CUP`;

    enviarNotificacionAdmin(mensajeText);
    alert(`¡Tu jugada ha sido registrada con éxito por $${monto} CUP!`);
    cerrarBoleto();
}

// ==========================================================================
// 6. COMUNICACIÓN ADICIONAL (DEPÓSITOS Y RETIROS)
// ==========================================================================
function enviarNotificacionAdmin(mensaje) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: mensaje, parse_mode: 'HTML' })
    }).catch(err => console.error(err));
}

function abrirModalDeposito() { document.getElementById('modal-deposito').style.display = 'flex'; }
function cerrarModalDeposito() { document.getElementById('modal-deposito').style.display = 'none'; }
function procesarDeposito(event) {
    event.preventDefault();
    const monto = document.getElementById('deposito-monto').value;
    enviarNotificacionAdmin(`💰 <b>¡SOLICITUD DE DEPÓSITO!</b>\n\n👤 <b>Usuario:</b> ${usuarioNombre}\n🆔 <b>ID:</b> <code>${usuarioId}</code>\n💵 <b>Monto:</b> $${monto} CUP`);
    alert(`Solicitud enviada.`);
    document.getElementById('form-deposito').reset();
    cerrarModalDeposito();
}

function abrirModalRetiro() { document.getElementById('modal-retiro').style.display = 'flex'; }
function cerrarModalRetiro() { document.getElementById('modal-retiro').style.display = 'none'; }
function procesarRetiro(event) {
    event.preventDefault();
    const monto = document.getElementById('retiro-monto').value;
    const detalles = document.getElementById('retiro-detalles').value;
    enviarNotificacionAdmin(`🚨 <b>¡SOLICITUD DE RETIRO!</b>\n\n👤 <b>Usuario:</b> ${usuarioNombre}\n🆔 <b>ID:</b> <code>${usuarioId}</code>\n💵 <b>Monto:</b> $${monto} CUP\n💳 <b>Destino:</b> <code>${detalles}</code>`);
    alert(`Solicitud de cobro enviada.`);
    document.getElementById('form-retiro').reset();
    cerrarModalRetiro();
}

window.onload = function() { cargarPartidos(); };
