import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import convoRoutes from './routes/conversations';
import adminRoutes from './routes/admin';
import * as s3mod from './s3';
import db from './db';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = Fastify({ logger: true });

app.register(fastifyCors, { origin: true });
app.register(fastifyJwt, { secret: process.env.JWT_SECRET || 'secret' });

app.decorate('authenticate', async (request: any, reply: any) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

app.decorate('s3', s3mod);

app.register(authRoutes, { prefix: '/api' });
app.register(convoRoutes, { prefix: '/api' });
app.register(adminRoutes);

// Auto-migrate: run SQL schema on startup
async function runMigrations() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'sql', 'schema.sql')).toString();
    await db.pool.query(sql);
    app.log.info('Database migrated (schema.sql executed).');
  } catch (err) {
    app.log.error('Migration error', err);
  }
}

const server = http.createServer(app.server);
const io = new IOServer(server, { path: '/ws', cors: { origin: true, methods: ['GET','POST'] } });

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('auth'));
  try {
    const payload = app.jwt.verify(token);
    (socket as any).user = payload;
    next();
  } catch (err) { next(new Error('auth')); }
});

io.on('connection', (socket) => {
  const user = (socket as any).user;
  app.log.info(`user connected ${user.sub}`);
  socket.on('join_conversation', (convId) => socket.join(convId));
  socket.on('message.send', async (payload) => {
    // Simplified: verify membership omitted (should check in production)
    const expiresAt = payload.ttlSeconds ? new Date(Date.now() + payload.ttlSeconds*1000).toISOString() : null;
    const res = await db.pool.query(
      'INSERT INTO messages (conversation_id, sender_id, body, media_url, media_type, expires_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [payload.conversationId, user.sub, payload.body, payload.mediaUrl || null, payload.mediaType || null, expiresAt]
    );
    const message = res.rows[0];
    io.to(payload.conversationId).emit('message.created', message);
  });
});

const PORT = Number(process.env.PORT || 4000);

server.listen(PORT, '0.0.0.0', async () => {
  app.log.info(`Server listening on ${PORT}`);
  await runMigrations();
});
