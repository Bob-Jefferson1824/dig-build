const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.get('/', (_req, res) => res.json({ name: 'DIG BUILD multiplayer', status: 'online' }));
app.get('/health', (_req, res) => res.json({ ok: true, rooms: rooms.size }));
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
  maxHttpBufferSize: 1e6
});
const rooms = new Map();
function publicRoomList() {
  return [...rooms.entries()]
    .filter(([, room]) => room.isPublic && room.players.size > 0)
    .map(([code, room]) => ({
      code, name: room.name || 'Public World',
      host: room.host || 'Player', players: room.players.size,
      maxPlayers: 16, seed: room.seed
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
function broadcastPublicRooms() { io.emit('public-room-list', publicRoomList()); }
const cleanText = (v, max) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
const validNum = (v, min, max) => Number.isFinite(v) && v >= min && v <= max;
const validPosition = p => p && validNum(p.x, -1e6, 1e6) && validNum(p.y, -100, 200) && validNum(p.z, -1e6, 1e6);

io.on('connection', socket => {
  socket.on('join-room', payload => {
    const roomId = cleanText(payload?.room, 24).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const name = cleanText(payload?.name, 18) || 'Player';
    const seed = String(payload?.seed ?? '').slice(0, 80);
    if (!roomId || !seed || !validPosition(payload.position)) {
      socket.emit('join-error', { message: 'Invalid room details.' });
      return;
    }
    let room = rooms.get(roomId);
    if (room && room.seed !== seed) {
      socket.emit('join-error', { message: `This room uses world seed ${room.seed}. Choose a world with that seed.` });
      return;
    }
    if (room && payload.public && !room.isPublic) {
      socket.emit('join-error', { message: 'That room is private.' });
      return;
    }
    if (room && room.players.size >= 16) {
      socket.emit('join-error', { message: 'That room is full.' });
      return;
    }
    if (!room) {
      const blocks = new Map();
      for (const entry of Array.isArray(payload.blocks) ? payload.blocks.slice(0, 5000) : []) {
        if (!Array.isArray(entry) || entry.length !== 2) continue;
        const key = cleanText(entry[0], 48), id = Number(entry[1]);
        if (/^-?\d+,-?\d+,-?\d+$/.test(key) && Number.isInteger(id) && id >= 0 && id <= 255) blocks.set(key, id);
      }
      room = {
        seed, players: new Map(), blocks,
        isPublic: payload.public === true,
        name: cleanText(payload.roomName, 32) || 'Public World',
        host: name
      };
      rooms.set(roomId, room);
    }
    const player = { id: socket.id, name, x: payload.position.x, y: payload.position.y, z: payload.position.z, yaw: 0, pitch: 0 };
    room.players.set(socket.id, player);
    socket.data.roomId = roomId;
    socket.join(roomId);
    socket.emit('room-state', {
      seed: room.seed,
      players: [...room.players.values()].filter(p => p.id !== socket.id),
      blocks: [...room.blocks.entries()].slice(0, 5000)
    });
    socket.to(roomId).emit('player-joined', player);
    broadcastPublicRooms();
  });

  socket.on('list-public-rooms', () => {
    socket.emit('public-room-list', publicRoomList());
  });

  socket.on('player-move', p => {
    const roomId = socket.data.roomId, room = rooms.get(roomId), player = room?.players.get(socket.id);
    if (!player || !validPosition(p)) return;
    player.x = p.x; player.y = p.y; player.z = p.z;
    player.yaw = validNum(p.yaw, -100, 100) ? p.yaw : 0;
    player.pitch = validNum(p.pitch, -2, 2) ? p.pitch : 0;
    socket.to(roomId).emit('player-moved', player);
  });

  socket.on('chat-message', raw => {
    const roomId = socket.data.roomId, room = rooms.get(roomId), player = room?.players.get(socket.id);
    const text = cleanText(raw, 200), now = Date.now();
    if (!player || !text || now - (player.lastChatAt || 0) < 650) return;
    player.lastChatAt = now;
    io.to(roomId).emit('chat-message', { name: player.name, text, at: now });
  });

  socket.on('block-update', b => {
    const roomId = socket.data.roomId, room = rooms.get(roomId);
    if (!room || !b || ![b.x, b.y, b.z, b.id].every(Number.isInteger)) return;
    if (!validNum(b.x, -100000, 100000) || !validNum(b.y, 0, 63) || !validNum(b.z, -100000, 100000) || !validNum(b.id, 0, 255)) return;
    const key = `${b.x},${b.y},${b.z}`;
    if (room.blocks.size < 10000 || room.blocks.has(key)) room.blocks.set(key, b.id);
    socket.to(roomId).emit('block-update', { x: b.x, y: b.y, z: b.z, id: b.id });
  });

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId, room = rooms.get(roomId);
    if (!room) return;
    const player = room.players.get(socket.id);
    room.players.delete(socket.id);
    if (player) socket.to(roomId).emit('player-left', { id: socket.id, name: player.name });
    if (room.players.size === 0) rooms.delete(roomId);
    broadcastPublicRooms();
  });
});

const port = Number(process.env.PORT) || 3000;
server.listen(port, '0.0.0.0', () => console.log(`DIG BUILD multiplayer listening on ${port}`));
