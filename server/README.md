# DIG BUILD multiplayer server

Deploy this folder as a Render **Web Service**.

- Root Directory: `server`
- Runtime: Node
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/health`

The server uses Socket.IO for player movement, room chat, and shared block edits. Rooms are temporary and held in memory; they reset when the service restarts or the room becomes empty. Players must use worlds with the same seed. Player inventories, animal positions, furnace contents, and world saves are not shared in this first multiplayer release.
