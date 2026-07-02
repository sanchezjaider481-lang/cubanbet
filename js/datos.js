const misPartidos = [
    { 
        id: 1, 
        campeonato: "CHAMPIONS LEAGUE", 
        local: "Real Madrid", 
        visitante: "Man. City", 
        cuota1: 2.10, 
        cuotaX: 3.40, 
        cuota2: 3.10 
    },
    { 
        id: 2, 
        campeonato: "PREMIER LEAGUE", 
        local: "Liverpool", 
        visitante: "Arsenal", 
        cuota1: 1.95, 
        cuotaX: 3.50, 
        cuota2: 3.80 
    }
];

// Función para calcular Parlay automáticamente
function calcularParlay(cuotasSeleccionadas, monto) {
    // Multiplica todas las cuotas seleccionadas
    const cuotaTotal = cuotasSeleccionadas.reduce((total, cuota) => total * cuota, 1);
    return {
        cuotaFinal: cuotaTotal.toFixed(2),
        ganancia: (monto * cuotaTotal).toFixed(2)
    };
}

