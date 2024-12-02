// script.js

let previousStatus = {}; // Objeto para almacenar el estado anterior de cada dispositivo
let dispositivos = [];
// Función para crear una fila en la tabla para cada dispositivo y agregar un gráfico
async function crearGraficoDispositivo(dispositivo, color) {
  const chartContainer =document.getElementById('chart-container');
  chartContainer.innerHTML='';
  // Crear el canvas para el gráfico
  const canvas = document.createElement('canvas');
  chartContainer.appendChild(canvas);
  

  // Crear el gráfico usando Chart.js
  const ctx = canvas.getContext('2d');
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dispositivo.historial.map(entry => entry.tiempo),
      datasets: [{
        label: 'Estado de Conexión',
        data: dispositivo.historial.map(entry => entry.status === 'Conexión' ? 1 : 0),
        borderColor: color,
        fill: false,
      }]
    },
    options: {
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return value === 1 ? 'Conexión' : 'Sin conexión';
            }
          },
        },
        x: {
          ticks: {
            autoSkip: true,
            maxTicksLimit: 10
          }
        }
      }
    }
  });

  return chart;
}
function registrarAlerta(mensaje, ip) {
  const alertsList = document.getElementById('alerts-list');

  const alertItem = document.createElement('div');
  alertItem.classList.add('alert-item');
  alertItem.innerHTML = `
    <p><strong>${mensaje}</strong></p>
    <p>${new Date().toLocaleString()}</p>
  `;

  alertsList.prepend(alertItem); // Agregar la alerta al inicio de la lista 
  // Enviar una notificación por correo electrónico
  enviarNotificacionCorreo(mensaje, ip);
}
// Función para actualizar el estado de los dispositivos en la parte superior de la página
async function actualizarEstadoDispositivos() {
  try {
    const response = await fetch('/api/connection-status'); // Obtener datos del servidor
    dispositivos = await response.json(); // Guardar la respuesta en la variable dispositivos

    // Limpiar el contenedor de estado de dispositivos
    const deviceStatusContainer = document.getElementById('device-status-container');
    deviceStatusContainer.innerHTML = '';

    // Limpiar el selector de IPs
    const ipSelector = document.getElementById('ip-selector');
    ipSelector.innerHTML = '<option value="">Seleccionar IP</option>'; // Resetear el selector

    dispositivos.forEach(dispositivo => {
      // Agregar cada dispositivo al selector de IPs
      const option = document.createElement('option');
      option.value = dispositivo.ip;
      option.textContent = `${dispositivo.nombre} - ${dispositivo.ip}`;
      ipSelector.appendChild(option);

      const card = document.createElement('div');
      card.classList.add('device-card');

      const estadoActual = dispositivo.historial[dispositivo.historial.length - 1].status;

      // Cambiar el color de la tarjeta según el estado
      if (estadoActual === 'Conexión') {
        card.classList.add('connected');
      } else {
        card.classList.add('disconnected');
      }

      // Agregar información del dispositivo
      card.innerHTML = `
        <h2>${dispositivo.nombre}</h2>
        <p><strong>IP:</strong> ${dispositivo.ip}</p>
        <p><strong>Estado:</strong> ${estadoActual === 'Conexión' ? 'Conectado' : 'Desconectado'}</p>
      `;

      deviceStatusContainer.appendChild(card);
    });
  } catch (error) {
    console.error("Error al obtener el estado de los dispositivos:", error);
  }
}
function manejarSeleccionDeIP() {
  const selectedIp = document.getElementById('ip-selector').value;

  // Si no se ha seleccionado ninguna IP, limpiar el gráfico
  if (!selectedIp) {
    document.getElementById('chart-container').innerHTML = '';
    return;
  }

  // Filtrar el dispositivo por IP seleccionada
  const dispositivoSeleccionado = dispositivos.find(dispositivo => dispositivo.ip === selectedIp);

  if (dispositivoSeleccionado) {
    const color = 'blue'; // Puedes asignar diferentes colores si lo deseas
    crearGraficoDispositivo(dispositivoSeleccionado, color);
  }
}

async function actualizarGrafico() {
  try {
    const response = await fetch('/api/connection-status');
    dispositivos = await response.json(); // Almacenar dispositivos globalmente

    // Llenar el selector de IPs con los dispositivos
    const ipSelector = document.getElementById('ip-selector');
    dispositivos.forEach(dispositivo => {
      const option = document.createElement('option');
      option.value = dispositivo.ip;
      option.textContent = `${dispositivo.nombre} - ${dispositivo.ip}`;
      ipSelector.appendChild(option);
    });

    // Agregar un event listener para manejar la selección de IP
    ipSelector.addEventListener('change', manejarSeleccionDeIP);
  } catch (error) {
    console.error("Error al obtener datos del servidor:", error);
  }
}



// Llamar a ambas funciones cada 5 segundos
setInterval(() => {
  actualizarGrafico();
  actualizarEstadoDispositivos();
  

}, 5000);

// Llamar inmediatamente para obtener datos iniciales
actualizarGrafico();
actualizarEstadoDispositivos();

// Función para cerrar sesión
function logout() {
  // Eliminar el estado de la sesión (localStorage)
  localStorage.removeItem('isLoggedIn'); // Eliminar la clave que indica si el usuario está logueado
  localStorage.removeItem('username'); // Eliminar el nombre de usuario (si lo tienes guardado)

  // Redirigir al usuario a la página de inicio (pagina_principal.html)
  window.location.href = 'pagina_principal.html'; // Asegúrate de que 'pagina_principal.html' es tu página principal
}

// Obtener el botón del menú y el contenedor del menú desplegable
const userMenuButton = document.getElementById('userMenuButton');
const userMenuDropdown = document.getElementById('userMenuDropdown');

// Función para alternar la visibilidad del menú desplegable
userMenuButton.addEventListener('click', function () {
  userMenuDropdown.classList.toggle('active');
});

// Cerrar el menú si el usuario hace clic fuera de él
window.addEventListener('click', function (event) {
  if (!userMenuButton.contains(event.target)) {
    userMenuDropdown.classList.remove('active');
  }
});

// Agregar evento al botón de cerrar sesión
document.getElementById('logoutButton').addEventListener('click', logout);





