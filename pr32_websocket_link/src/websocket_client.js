require('dotenv').config();

const WebSocket = require('ws');
const readline = require('readline');


const SERVER_URL = process.env.SERVER_URL || 'ws://localhost:8000';

const ws = new WebSocket(SERVER_URL);

let player = { x: 0, y: 0 };

// Recoger el pulsado de teclas
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);


ws.on('open', () => {
    console.log('Conectado al servidor WebSocket');
    ws.send('Hola, server');

    process.stdin.on('keypress', (str, key) => {
        if (key.name === 'up') player.y--;
        if (key.name === 'down') player.y++;
        if (key.name === 'left') player.x--;
        if (key.name === 'right') player.x++;

        // Enviar la nueva posición al servidor
        const message = JSON.stringify(
            {
             type: 'move', position: player 
            });
        ws.send(message);

        console.log(`Nueva posición: x=${player.x}, y=${player.y}`);

        // q para salir
        if (key.name === 'q') {
            console.log('Saliendo...');
            process.exit();
        }
    });
});

ws.on('message', (message) => {
    console.log(`Mensaje recibido del servidor: ${message}`);
});

ws.on('close', () => {
    console.log('Conexión cerrada');
});

ws.on('error', (error) => {
    console.error('Error en la conexión:', error);
});
