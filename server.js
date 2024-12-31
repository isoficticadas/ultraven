require('dotenv').config(); // Cargar variables de entorno desde .env
const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 7000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

/*app.use((req, res, next) => {
    if (!req.headers.host.startsWith('www.')) {
      res.redirect(301, `https://www.${req.headers.host}${req.url}`);
    } else {
      next();
    }
  });*/
  

  

// Servir archivos estáticos desde el directorio 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para servir el archivo index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para servir el archivo policy.html
app.get('/policy.html', (req, res) => {
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
    const timestamp = new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' }); // Obtener la fecha y hora actual en formato Ecuador

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
            range: 'Cliente!A:D', // Actualizar el rango para incluir la nueva columna
            valueInputOption: 'RAW',
            resource: {
                values: [[name, phone, defaultData, timestamp]], // Incluir la fecha y hora en los datos
            },
        });

        // Enviar una respuesta JSON indicando éxito
        res.status(200).json({ message: 'Formulario enviado con éxito' });
    } catch (error) {
        console.error('Error al enviar los datos:', error);
        res.status(500).send('Error al enviar los datos');
    }
});


app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});