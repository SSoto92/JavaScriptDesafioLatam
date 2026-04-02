const selectMoneda = document.getElementById("moneda");
const inputMonto = document.getElementById("monto");
const btnConvertir = document.getElementById("btnConvertir");
const resultado = document.getElementById("resultado");
const error = document.getElementById("error");

let grafico = null;

const monedasDisponibles = [
  { codigo: "dolar", nombre: "Dólar" },
  { codigo: "euro", nombre: "Euro" },
  { codigo: "uf", nombre: "UF" },
  { codigo: "utm", nombre: "UTM" },
  { codigo: "bitcoin", nombre: "Bitcoin" }
];

async function cargarMonedas() {
  try {
    error.textContent = "";

    const res = await fetch("https://mindicador.cl/api/");

    if (!res.ok) {
      throw new Error("No se pudo obtener la información de monedas.");
    }

    const data = await res.json();

    selectMoneda.innerHTML = `<option value="">Seleccione moneda</option>`;

    monedasDisponibles.forEach((moneda) => {
      if (data[moneda.codigo]) {
        selectMoneda.innerHTML += `
          <option value="${moneda.codigo}">
            ${moneda.nombre}
          </option>
        `;
      }
    });
  } catch (err) {
    error.textContent = "Error al cargar monedas: " + err.message;
  }
}

async function convertirMoneda() {
  try {
    error.textContent = "";
    resultado.textContent = "Resultado: $0";

    const monto = Number(inputMonto.value);
    const monedaSeleccionada = selectMoneda.value;

    if (!monto || monto <= 0) {
      throw new Error("Debes ingresar un monto válido en pesos chilenos.");
    }

    if (!monedaSeleccionada) {
      throw new Error("Debes seleccionar una moneda.");
    }

    const res = await fetch("https://mindicador.cl/api/");

    if (!res.ok) {
      throw new Error("No se pudo consultar la API.");
    }

    const data = await res.json();

    if (!data[monedaSeleccionada] || !data[monedaSeleccionada].valor) {
      throw new Error("No se encontró el valor de la moneda seleccionada.");
    }

    const valorMoneda = data[monedaSeleccionada].valor;
    const conversion = monto / valorMoneda;

    resultado.textContent = `Resultado: ${formatearNumero(conversion)}`;

    await cargarGrafico(monedaSeleccionada);
  } catch (err) {
    error.textContent = err.message;
  }
}

async function cargarGrafico(monedaSeleccionada) {
  try {
    const res = await fetch(`https://mindicador.cl/api/${monedaSeleccionada}`);

    if (!res.ok) {
      throw new Error("No se pudo obtener el historial para el gráfico.");
    }

    const data = await res.json();

    const ultimos10 = data.serie.slice(0, 10).reverse();

    const labels = ultimos10.map((item) => {
      const fecha = new Date(item.fecha);
      return fecha.toLocaleDateString("es-CL");
    });

    const valores = ultimos10.map((item) => item.valor);

    renderizarGrafico(labels, valores, monedaSeleccionada);
  } catch (err) {
    error.textContent = "Error al cargar gráfico: " + err.message;
  }
}

function renderizarGrafico(labels, valores, monedaSeleccionada) {
  const contexto = document.getElementById("graficoMoneda");

  if (grafico) {
    grafico.destroy();
  }

  grafico = new Chart(contexto, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: `Historial ${monedaSeleccionada} últimos 10 días`,
          data: valores,
          borderColor: "#38bdf8",
          backgroundColor: "rgba(56, 189, 248, 0.2)",
          borderWidth: 2,
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: "#111827"
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false
        }
      }
    }
  });
}

function formatearNumero(numero) {
  return numero.toLocaleString("es-CL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

btnConvertir.addEventListener("click", convertirMoneda);

cargarMonedas();