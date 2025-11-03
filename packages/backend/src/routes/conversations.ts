import { FastifyInstance } from 'fastify';
import db from '../db';
import { randomUUID } from 'crypto';

export default async function convoRoutes(fastify: FastifyInstance) {
  fastify.post('/conversations', { preValidation: [fastify.authenticate] }, async (req: any, reply) => {
    const { members, is_group, title, auto_delete_after_seconds } = req.body;
    const id = randomUUID();
    await db.query('INSERT INTO conversations (id, title, is_group, created_by, auto_delete_after_seconds) VALUES ($1,$2,$3,$4,$5)', [id, title, is_group, req.user.sub, auto_delete_after_seconds]);
    for (const m of members || []) {
      await db.query('INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1,$2)', [id, m]);
    }
    await db.query('INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, req.user.sub]);
    return { id };
  });

  fastify.post('/media/upload-url', { preValidation: [fastify.authenticate] }, async (req: any) => {
    const { filename, contentType } = req.body;
    const key = `uploads/${Date.now()}_${filename}`;
    const url = await fastify.s3.getPresignedUploadUrl(key, contentType, 300);
    return { url, key, publicUrl: `${process.env.S3_ENDPOINT.replace(/\/$/, '')}/${process.env.S3_BUCKET}/${key}` };
  });
}
