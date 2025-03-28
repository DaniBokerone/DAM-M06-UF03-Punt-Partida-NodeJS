require('dotenv').config();
const { MongoClient } = require('mongodb');
const WebSocket = require('ws');

const PORT = process.env.PORT || 8000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://root:password@localhost:27017/';
const DATABASE_NAME = 'players_db';
const COLLECTION_NAME = 'players';

const wss = new WebSocket.Server({ port: PORT });
const playerTimers = new Map(); // Almacenar los timers por jugador

console.log(`Servidor WebSocket iniciado en el puerto ${PORT}`);

wss.on('connection', (ws) => {
    console.log('Nuevo cliente conectado');

    ws.send('Bienvenido al servidor WebSocket');

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message.toString());

            if (data.type === 'move' && data.player && typeof data.player.x === 'number' && typeof data.player.y === 'number') {
                console.log(`Movimiento detectado: ID=${data.player.id}, x=${data.player.x}, y=${data.player.y}`);

                const playerData = {
                    player_id: data.player.id,
                    game: data.player.game,
                    x: data.player.x,
                    y: data.player.y
                };

                await savePlayerToMongoDB(playerData);
                resetPlayerTimer(data.player.id, ws);

                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        /* client.send(JSON.stringify({
                            type: 'update',
                            player: playerData
                        })); */
                    }
                });
            } else {
                console.log('Mensaje recibido pero no válido:', data);
            }
        } catch (error) {
            console.error('Error: el mensaje no es un JSON válido:', message.toString());
        }
    });

    ws.on('close', () => {
        console.log('Cliente desconectado');
        for (const [playerId, timer] of playerTimers.entries()) {
            clearTimeout(timer);
            playerTimers.delete(playerId);
        }
    });
});

async function savePlayerToMongoDB(player) {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        const database = client.db(DATABASE_NAME);
        const collection = database.collection(COLLECTION_NAME);

        await collection.insertOne(player);
        console.log(`Jugador ${player.player_id} en game ${player.game} guardado en la base de datos.`);
    } catch (error) {
        console.error('Error guardando datos en MongoDB:', error);
    } finally {
        await client.close();
        console.log('Conexión a MongoDB cerrada.');
    }
}

function resetPlayerTimer(playerId, ws) {
    if (playerTimers.has(playerId)) {
        clearTimeout(playerTimers.get(playerId));
    }

    const timer = setTimeout(async () => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'lost', message: 'Has perdido por inactividad.' }));
        }
        console.log(`Jugador ${playerId} ha perdido por inactividad.`);

    }, 10000);

    playerTimers.set(playerId, timer);
}
