// Función para crear alertas dinámicas
function createAlert(message, type = 'info') {
    const alertList = document.getElementById('alertsList');
    const alertItem = document.createElement('div');
    alertItem.className = `alert-item alert-${type}`;
    alertItem.innerText = message;
    alertList.appendChild(alertItem);
  }
  
  // Botón para escanear vulnerabilidades
  document.getElementById('vulnerabilityButton').addEventListener('click', async function () {
    const response = await fetch('/api/vulnerability-scan');
    const result = await response.json();
  
    const resultDiv = document.getElementById('vulnerabilityResult');
    if (result.success) {
      resultDiv.innerHTML = `<p>Escaneo completado: ${result.message}</p>`;
      createAlert('Escaneo completado con éxito', 'info');
    } else {
      resultDiv.innerHTML = `<p>Hubo un error: ${result.error}</p>`;
      createAlert('Hubo un error durante el escaneo', 'danger');
    }
  });
  
  // Simulando alertas periódicas
  setInterval(() => {
    createAlert('Nuevo dispositivo desconectado', 'danger');
  }, 5000); // Alerta cada 5 segundos
  