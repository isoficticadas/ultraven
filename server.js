require('dotenv').config(); // Cargar variables de entorno desde .env
const express = require('express');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const compression = require('compression');
const mcache = require('memory-cache');

const app = express();
const PORT = process.env.PORT || 7000;

// Middleware para compresión
app.use(compression());

// Middleware para caché
const cache = (duration) => {
  return (req, res, next) => {
    const key = `__express__${req.originalUrl || req.url}`;
    const cachedBody = mcache.get(key);
    if (cachedBody) {
      res.send(cachedBody);
      return;
    }
    res.sendResponse = res.send;
    res.send = (body) => {
      mcache.put(key, body, duration * 1000);
      res.sendResponse(body);
    };
    next();
  };
};

// Configuración del middleware para parseo de JSON y URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde el directorio 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.get('/', cache(60), (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/policy.html', cache(60), (req, res) => {
  res.sendFile(path.join(__dirname, 'policy.html'));
});

const { GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, SPREADSHEET_ID } = process.env;
const scopes = ['https://www.googleapis.com/auth/spreadsheets'];

// Ruta para manejar el envío del formulario
app.post('/submit', async (req, res) => {
  const { name, phone } = req.body;
  const namePattern = /^[A-Za-z\s]+$/;
  const phonePattern = /^\+593\d{9}$/;

  if (!name || !namePattern.test(name)) {
    return res.status(400).json({ error: 'Nombre inválido. Solo se permiten letras y espacios.' });
  }

  if (!phonePattern.test(phone)) {
    return res.status(400).json({ error: 'Número de teléfono inválido. Ejemplo: +593933543342' });
  }

  const defaultData = 'Ultraven';
  const timestamp = new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' });

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_CLIENT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes,
    });

    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Cliente!A:D',
      valueInputOption: 'RAW',
      resource: {
        values: [[name, phone, defaultData, timestamp]],
      },
    });

    res.status(200).json({ message: 'Formulario enviado con éxito' });
  } catch (error) {
    console.error('Error al enviar los datos:', error);
    res.status(500).send('Error al enviar los datos');
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
