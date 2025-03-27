require('dotenv').config();

const WebSocket = require('ws');

const PORT = process.env.PORT || 8000;

const wss = new WebSocket.Server({ port: PORT });

console.log(`Servidor WebSocket iniciado en el puerto ${PORT}`);

wss.on('connection', (ws) => {
    console.log('Nuevo cliente conectado');

    ws.send('Bienvenido al servidor WebSocket');

    ws.on('message', (message) => {
        console.log(`Mensaje recibido: ${message}`);

        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(`Mensaje recibido: ${message}`);
            }
        });
    });

    ws.on('close', () => {
        console.log('Cliente desconectado');
    });
});
