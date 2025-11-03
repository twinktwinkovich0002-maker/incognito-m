import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import db from '../db';
import { randomUUID } from 'crypto';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/signup', async (req, reply) => {
    const { nickname, password, display_name } = req.body as any;
    if (!nickname || !password) return reply.status(400).send({ error: 'missing' });
    const hash = await bcrypt.hash(password, 10);
    const id = randomUUID();
    await db.query('INSERT INTO users (id, nickname, display_name, password_hash) VALUES ($1,$2,$3,$4)', [id, nickname, display_name, hash]);
    return reply.send({ ok: true });
  });

  fastify.post('/auth/login', async (req, reply) => {
    const { nickname, password } = req.body as any;
    const res = await db.query('SELECT id, password_hash FROM users WHERE nickname = $1', [nickname]);
    if (res.rowCount === 0) return reply.status(401).send({ error: 'invalid' });
    const user = res.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return reply.status(401).send({ error: 'invalid' });
    const token = fastify.jwt.sign({ sub: user.id });
    return reply.send({ token });
  });
}
