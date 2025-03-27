require('dotenv').config();
const { MongoClient } = require('mongodb');
const WebSocket = require('ws');

const PORT = process.env.PORT || 8000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://root:password@localhost:27017/';
const DATABASE_NAME = 'players_db';
const COLLECTION_NAME = 'players';

const wss = new WebSocket.Server({ port: PORT });

console.log(`Servidor WebSocket iniciado en el puerto ${PORT}`);

wss.on('connection', (ws) => {
    console.log('Nuevo cliente conectado');

    ws.send('Bienvenido al servidor WebSocket');

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === 'move' && data.player && typeof data.player.x === 'number' && typeof data.player.y === 'number') {
                console.log(`Movimiento detectado: ID=${data.player.id}, x=${data.player.x}, y=${data.player.y}`);

                const playerData = {
                    player_id: data.player.id,
                    x: data.player.x,
                    y: data.player.y
                };

                await savePlayerToMongoDB(playerData);

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
            console.error('Error: el mensaje no es un JSON válido.');
        }
    });

    ws.on('close', () => {
        console.log('Cliente desconectado');
    });
});

async function savePlayerToMongoDB(player) {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        const database = client.db(DATABASE_NAME);
        const collection = database.collection(COLLECTION_NAME);

        const existingPlayer = await collection.findOne({ player_id: player.player_id });

        if (existingPlayer) {
            await collection.updateOne(
                { player_id: player.player_id },
                { $set: { x: player.x, y: player.y } }
            );
            console.log(`Jugador ${player.player_id} actualizado en la base de datos.`);
        } else {
            await collection.insertOne(player);
            console.log(`Jugador ${player.player_id} guardado en la base de datos.`);
        }
    } catch (error) {
        console.error('Error guardando datos en MongoDB:', error);
    } finally {
        await client.close();
        console.log('Conexión a MongoDB cerrada.');
    }
}
