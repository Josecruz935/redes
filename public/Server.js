const express = require('express');
const si = require('systeminformation'); // Librería para obtener estadísticas del sistema

const app = express();
const port = 3000;

// Endpoint para obtener estadísticas de tráfico de red
app.get('/api/bandwidth', async (req, res) => {
  try {
    const networkStats = await si.networkStats(); // Obtiene las estadísticas de red
    res.json(networkStats);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estadísticas de ancho de banda', error });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
