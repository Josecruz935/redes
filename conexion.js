
const express = require('express');
const ping = require('ping');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const sql = require('mssql');
dotenv.config();
const app = express();
const PORT = 3000;
const{ exec }= require('child_process');
app.use(express.static('public'));
const path = require('path');
const bodyParser = require('body-parser');

app.use(express.json());
const config = {
  user: 'Ramon',  // Tu usuario de SQL Server
  password: 'Panama1991',  // Tu contraseña de SQL Server
  server: 'DESKTOP-KG75EVT',
  options: {
    port: 1433,
    database: 'monitoreo',
    encrypt: true,
    trustServerCertificate: true,  // Usar para evitar problemas con certificados
  }
};



async function connectToDatabase() {
  try {
    // Conectar a la base de datos
    await sql.connect(config);
    console.log("Conexión exitosa a la base de datos");

    // Ejecutar una consulta SQL
    const result = await sql.query("SELECT 24 / 2 AS result");
    console.log("Resultado de la consulta:", result.recordset[0].result);

    sql.close();  // Cerrar la conexión


  } catch (err) {
    console.log("Error al conectarse a la base de datos:", err);
  }
}
// Ejecutar la conexión
connectToDatabase();



// Lista de dispositivos para monitorear
const rangoIP = '192.168.0.'; // Rango de IPs
let dispositivos = [];  // Lista de dispositivos detectados


async function verificarIP(ip) {
  try {
    const res = await ping.promise.probe(ip);
    if (res.alive) {
      dispositivos.push({ nombre: `Dispositivo en ${ip}`, ip, historial: [] });
      console.log(`Dispositivo conectado: ${ip}`);
    }
  } catch (error) {
    console.log(`Error al hacer ping a ${ip}:`, error);
  }
}

// Función para obtener el nombre del dispositivo usando Nmap y extraer el nombre del fabricante
async function obtenerNombreDispositivo(ip) {
  const nmapCommand = `nmap -sn -R ${ip}`; // Usamos -sn para escanear solo la disponibilidad y -R para resolver el nombre
  return new Promise((resolve, reject) => {
    exec(nmapCommand, (error, stdout, stderr) => {
      if (error) {
        reject(`Error ejecutando Nmap: ${error.message}`);
      } else if (stderr) {
        reject(`Error en stderr: ${stderr}`);
      } else {
        // Buscar el nombre del dispositivo en la salida de Nmap
        const regexHostname = /Nmap scan report for (.*?) \((.*?)\)/;
        const regexMAC = /MAC Address: ([\w:]+) \((.*?)\)/;
        
        // Intentamos extraer el nombre del dispositivo (hostname) y el fabricante (si existe)
        const matchHostname = regexHostname.exec(stdout);
        const matchMAC = regexMAC.exec(stdout);

        if (matchHostname && matchHostname[1]) {
          // Si encontramos un hostname (resuelto por Nmap), lo devolvemos
          resolve(matchHostname[1]);
        } else if (matchMAC && matchMAC[2]) {
          // Si encontramos una dirección MAC y fabricante, devolvemos el fabricante
          resolve(matchMAC[2]);
        } else {
          // Si no encontramos nada, devolvemos solo la IP
          resolve(`Dispositivo en ${ip}`);
        }
      }
    });
  });
}



// Función para escanear el rango de IPs
async function escanearRed() {
  for (let i = 1; i <= 254; i++) {
    const ip = `${rangoIP}${i}`;
    try {
      // Primero hacer ping para ver si la IP está activa
      const res = await ping.promise.probe(ip);
      if (res.alive) {
        // Obtener el nombre del dispositivo usando Nmap
        const nombreDispositivo = await obtenerNombreDispositivo(ip);
        dispositivos.push({ nombre: nombreDispositivo, ip, historial: [] });
        console.log(`Dispositivo encontrado: ${nombreDispositivo} (${ip})`);
      }
    } catch (error) {
      console.log(`Error al verificar ${ip}: ${error}`);
    }
  }
  console.log('Escaneo de la red finalizado.');
}

// Iniciar escaneo de la red cuando arranque el servidor
escanearRed();

// Función para escanear vulnerabilidades con Nmap
async function escanearVulnerabilidades(ip) {
  const nmapCommand = `nmap --script vuln ${ip}`; // Usamos el script de vulnerabilidades de Nmap
  return new Promise((resolve, reject) => {
    exec(nmapCommand, (error, stdout, stderr) => {
      if (error) {
        reject(`Error ejecutando Nmap: ${error.message}`);
      } else if (stderr) {
        reject(`Error en stderr: ${stderr}`);
      } else {
        // La salida de Nmap contendrá información sobre vulnerabilidades detectadas
        resolve(stdout);
      }
    });
  });
}



const transporter = nodemailer.createTransport({   // Usamos el servicio de Gmail
  host: 'smtp.gmail.com' ,  // Usando el servidor de Outlook
  port: 587,
  secure: false,
  auth: {
    user: 'josecruz200204@gmail.com',  // Tu correo de Gmail (por ejemplo: 'tucorreo@gmail.com')
    pass: 'y w l h d i x b g u u w v j q a' // Tu contraseña de Gmail o contraseña de aplicación
  }
});


function enviarNotificacionCorreo(mensaje, ip) {
  const mailOptions = {
    from: 'josecruz200204@gmail.com',
    to: ['josecruz200204@gmail.com','frospavon@gmail.com','bariasmunoz913@gmail.com', 'josecruz18985@hotmail.com' ],
    subject: 'Alerta de estado de dispositivo',
    text: `Alerta: ${mensaje}\nIP del dispositivo: ${ip}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error al enviar el correo:', error);
    } else {
      console.log('Correo enviado: ' + info.response);
    }
  });
}

async function verificarDispositivos() {
  for (let dispositivo of dispositivos) {
    const res = await ping.promise.probe(dispositivo.ip, { timeout: 1000 });
    const tiempo = new Date().toLocaleString();
    const timestampFecha = new Date();  // Fecha y hora actuales (completa)
    const timestamp = timestampFecha.toISOString();  // Hora actual (formato ISO 8601)
    const status = res.alive ? 'Conexión' : 'Sin conexión';

    // Verificar si el estado ha cambiado
    if (dispositivo.historial.length > 0) {
      const ultimoEstado = dispositivo.historial[dispositivo.historial.length - 1].status;
      if (ultimoEstado !== status) {
        const mensaje = `El estado del dispositivo en ${dispositivo.ip} ha cambiado a ${status}`;
        enviarNotificacionCorreo(mensaje, dispositivo.ip);
      }
    }

    // Agregar al historial local
    dispositivo.historial.push({ timestampFecha, timestamp, status,tiempo });
    if (dispositivo.historial.length > 100) dispositivo.historial.shift();  // Mantener solo los últimos 100 registros

    // Llamar a la función para insertar el historial en la base de datos
    await insertarHistorialConexiones(timestampFecha, timestamp, status, dispositivo.ip);
  }
}

// Función para insertar el historial de conexiones en la base de datos
async function insertarHistorialConexiones(timestampFecha, timestamp, status, ip) {
  try {
    const pool = await sql.connect(config);
    
    // Convertir la hora a formato adecuado (hh:mm:ss) para SQL Server
    const horaFormateada = formatearHora(timestamp);
    
    const request = pool.request();

    // Convertir la fecha y hora a los tipos adecuados para SQL Server
    request.input('hora', sql.NVarChar, horaFormateada);  // Convertir hora a tipo TIME
    request.input('ip', sql.NVarChar, ip);  // IP
    request.input('tipo_caidas', sql.NVarChar, status);  // Estado
    request.input('fecha', sql.DateTime, timestampFecha);  // Convertir fecha a tipo DATETIME
    
    const query = `
      INSERT INTO Caidas (hora, ip, tipo_caidas, fecha)
      VALUES ( @hora, @ip, @tipo_caidas, @fecha )
    `;

    await request.query(query);
    console.log(`Historial de conexión registrado para dispositivo ${ip}`);
  } catch (error) {
    console.error('Error al insertar historial en la base de datos', error);
  }
}


function formatearHora(horaISO) {
  // Usar la cadena ISO para obtener la hora exacta
  const date = new Date(horaISO);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  // Retornar el formato adecuado para SQL Server: HH:mm:ss
  return `${hours}:${minutes}:${seconds}`;
}

async function obtenerRegistros() {
  try {
    const pool = await sql.connect(config);
    const request = pool.request();
    const query = `SELECT * FROM Caidas`;  
    
    const result = await request.query(query);
    return result.recordset; 
  } catch (error) {
    console.error('Error al obtener registros de la base de datos', error);
    return [];  
  }
}

// Exportar las funciones para usarlas en otros scripts
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para obtener registros y enviarlos al cliente
app.get('/api/registros', async (req, res) => {
  try {
    const registros = await obtenerRegistros();
    res.json(registros);  // Envia los registros como respuesta en formato JSON
  } catch (error) {
    console.error('Error al obtener registros', error);
    res.status(500).send('Error al obtener registros');
  }
});
// Ruta para ejecutar consultas SQL
app.post('/ejecutarConsultas', async (req, res) => {
  const { consulta } = req.body;

  try {
    // Conectamos a la base de datos
    await sql.connect(config);

    // Ejecutamos la consulta
    const result = await sql.query(consulta);

    // Enviamos la respuesta con los resultados
    res.json(result.recordset); // 'recordset' contiene las filas de la consulta
  } catch (error) {
    console.error('Error ejecutando la consulta:', error);
    res.status(500).send('Error en la consulta SQL');
  } finally {
    await sql.close(); // Cerramos la conexión
  }
});
app.use(bodyParser.json()); 
app.get('/consultas', (req, res) => {
  res.sendFile(path.join(__dirname, 'consultas.html'));
});
app.use(express.static(path.join(__dirname, 'public'))); 
// Ruta para servir el archivo HTML
app.get('/reporte', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reporte.html'));
});
// Endpoint para obtener el historial de todos los dispositivos
app.get('/api/connection-status', (req, res) => {
  res.json(dispositivos);
});

app.get('/', (req, res) => {
  if (!req.session.isLoggedIn) {
    // Redirigir a la página de login si no está logueado
    res.redirect('/login');
  } else {
    // Si está logueado, mostrar la página principal
    res.render('pagina_principal.html');
  }
});

app.post('/guardar-datos', async (req, res) => {
  const { ip, port, datetime } = req.body;

  try {
      // Conectar a la base de datos SQL Server
      const pool = await sql.connect(config);
      
      // Guardar los datos en la tabla ControlConexiones
      const result = await pool.request()
          .input('ip', sql.NVarChar, ip)
          .input('port', sql.Int, port)
          .input('datetime', sql.DateTime, datetime)
          .query(`
              INSERT INTO control (IP, Puerto, FechaHora)
              VALUES (@ip, @port, @datetime)
          `);

      res.json({ message: 'Datos guardados correctamente', result });
  } catch (err) {
      console.error('Error al guardar los datos:', err);
      res.status(500).json({ error: 'Hubo un error al guardar los datos' });
  } finally {
      sql.close();
  }
});

// Ruta para escanear vulnerabilidades de una IP
app.get('/api/escanear-vulnerabilidades', async (req, res) => {
  const { ip } = req.query; // Obtenemos la IP desde la query string

  if (!ip) {
    return res.status(400).send('Se requiere una IP para el escaneo de vulnerabilidades');
  }

  try {
    const resultado = await escanearVulnerabilidades(ip);
    res.json({ resultado }); // Devuelve los resultados del escaneo en formato JSON
  } catch (error) {
    console.error('Error al escanear vulnerabilidades:', error);
    res.status(500).send('Error al escanear vulnerabilidades');
  }
});



// Verificar los dispositivos cada 5 segundos
setInterval(verificarDispositivos, 5000);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
}); 
