import { FastifyInstance } from 'fastify';
import db from '../db';

export default async function adminRoutes(fastify: FastifyInstance) {
  // purge expired messages (soft-delete)
  fastify.post('/internal/cron/purge-expired', async (req, reply) => {
    const res = await db.query("UPDATE messages SET is_deleted = true WHERE expires_at IS NOT NULL AND expires_at <= now() AND is_deleted = false RETURNING id");
    return { purged: res.rowCount };
  });
}
