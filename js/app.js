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
let parlayApuestas = [];

// Aquí guardaremos los partidos que carguemos desde el archivo partidos.json
let partidosPrueba = []; 

// ==========================================================================
// 3. LOGICA DE RENDERIZADO Y CARGA DINÁMICA (JSON)
// ==========================================================================
function cambiarDeporte(deporte, botonPresionado) {
    deporteActivo = deporte;
    const botones = document.querySelectorAll('.menu-deportes button');
    botones.forEach(btn => btn.classList.remove('active'));
    botonPresionado.classList.add('active');
    renderizarPartidosFiltrados();
}

// NUEVA FUNCIÓN: Lee el archivo externo que vas a actualizar diariamente
function cargarPartidosDesdeJSON() {
    const contenedor = document.getElementById('lista-partidos');
    if (contenedor) {
        contenedor.innerHTML = `<p class="cargando">Cargando la cartelera de hoy...</p>`;
    }

    // Buscamos tu archivo en la raíz del proyecto
    fetch('partidos.json')
        .then(response => {
            if (!response.ok) {
                throw new Error("No se pudo cargar el archivo de partidos.");
            }
            return response.json();
        })
        .then(datos => {
            partidosPrueba = datos; // Asignamos los datos del JSON a nuestra variable global
            renderizarPartidosFiltrados(); // Pintamos los partidos en pantalla
        })
        .catch(error => {
            console.error("Error cargando los partidos:", error);
            if (contenedor) {
                contenedor.innerHTML = `<p class="cargando" style="color: #ff4444;">Error al cargar la cartelera. Intenta de nuevo.</p>`;
            }
        });
}

// Esta función se encarga puramente de dibujar las tarjetas en la interfaz
function renderizarPartidosFiltrados() {
    const contenedor = document.getElementById('lista-partidos');
    if (!contenedor) return;
    
    contenedor.innerHTML = ''; 
    
    // Filtramos comparando en minúsculas para evitar errores tipográficos
    const partidosFiltrados = partidosPrueba.filter(p => p.deporte.toLowerCase() === deporteActivo.toLowerCase());

    if (partidosFiltrados.length === 0) {
        contenedor.innerHTML = `<p class="cargando">No hay partidos de ${deporteActivo} programados para hoy.</p>`;
        return;
    }

    partidosFiltrados.forEach(partido => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-partido';

        const cuotaEmpateTxt = partido.cuotaEmpate || partido.cuotaX || '—';
        const botonEmpateOculto = (cuotaEmpateTxt === '—' || cuotaEmpateTxt === '-') 
            ? `<button class="btn-cuota" disabled style="opacity: 0.25; cursor: not-allowed;"><span class="indicador-tipo">X</span><span class="cuota">—</span></button>`
            : `<button class="btn-cuota" onclick="seleccionarJugada(${partido.id}, 'Empate', '${cuotaEmpateTxt}')"><span class="indicador-tipo">X</span><span class="cuota">${cuotaEmpateTxt}</span></button>`;

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

        // Tolerancia si los nombres en tu JSON vienen como 'local'/'visitante' o 'equipo1'/'equipo2'
        const localName = partido.local || partido.equipo1 || "Local";
        const visitanteName = partido.visitante || partido.equipo2 || "Visitante";
        const marcadorL = partido.marcadorLocal !== undefined ? partido.marcadorLocal : "0";
        const marcadorV = partido.marcadorVisitante !== undefined ? partido.marcadorVisitante : "0";

        tarjeta.innerHTML = `
            <div class="info-partido">
                <span class="liga">${partido.liga}</span>
                <span class="${partido.enVivo ? 'en-vivo' : ''}">EN VIVO</span>
            </div>
            <div class="bloque-central">
                <div class="equipos-marcador">
                    <div class="fila-equipo"><span>${localName}</span><span class="marcador-en-vivo">${marcadorL}</span></div>
                    <div class="fila-equipo"><span>${visitanteName}</span><span class="marcador-en-vivo">${marcadorV}</span></div>
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
// 4. LOGICA DEL BOLETO: ENFOQUE PARLAY (COMBINADAS)
// ==========================================================================
function seleccionarJugada(partidoId, opcion, cuota) {
    const partido = partidosPrueba.find(p => p.id === partidoId);
    if (!partido) return;

    const localName = partido.local || partido.equipo1 || "Local";
    const visitanteName = partido.visitante || partido.equipo2 || "Visitante";
    const nombrePartido = `${localName} vs ${visitanteName}`;
    
    const yaExistePartido = parlayApuestas.some(item => item.partido === nombrePartido);

    if (yaExistePartido) {
        alert("¡Regla de Parlay! No puedes combinar dos mercados del mismo partido. Elige eventos diferentes.");
        return;
    }

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

    boleto.dataset.cuotaTotal = cuotaTotalParlay.toFixed(2);
    const tipoApuestaLabel = parlayApuestas.length > 1 ? `PARLAY (x${parlayApuestas.length} Logros)` : "Apuesta Derecha";
    
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
    parlayApuestas = []; 
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

    const esParlay = parlayApuestas.length > 1;
    let encabezadoTipo = esParlay ? `🔥 <b>¡NUEVO PARLAY COMBINADO!</b>` : `🎰 <b>¡APUESTA DERECHA REALIZADA!</b>`;

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

// AQUÍ CAMBIA: Al cargar la página, se llama a la función que lee el JSON externo
window.onload = function() { 
    cargarPartidosDesdeJSON(); 
};

