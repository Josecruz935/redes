const { exec } = require('child_process');

// Endpoint para escanear vulnerabilidades
app.get('/api/vulnerability-scan', (req, res) => {
  // Obtenemos las IP y el rango de escaneo desde los parámetros de la URL
  const targetIP = req.query.ip || '192.168.0.1/24'; // IP predeterminada
  const scanType = req.query.scanType || '-sS'; // Tipo de escaneo por defecto

  // Construir el comando de escaneo
  const scanCommand = `nmap ${scanType} -O ${targetIP}`;

  // Ejecutar el comando nmap
  exec(scanCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error ejecutando el escaneo: ${stderr}`);
      return res.status(500).json({
        success: false,
        message: 'Hubo un error al ejecutar el escaneo.',
        error: stderr
      });
    }

    if (stderr) {
      console.error(`Error en el escaneo: ${stderr}`);
      return res.status(500).json({
        success: false,
        message: 'Hubo un error durante el escaneo.',
        error: stderr
      });
    }

    // Devolvemos el resultado del escaneo
    res.json({
      success: true,
      message: 'Escaneo completado con éxito.',
      result: stdout // Esto es el resultado del comando nmap
    });
  });
});
