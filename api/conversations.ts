import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

function getUserId(req: VercelRequest): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET) as any;
    return decoded.userId;
  } catch { return null; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    let id = req.query.id as string | undefined;
    if (Array.isArray(id)) id = id[0];
    if (!id && req.url && req.url.includes('?id=')) {
      id = req.url.split('?id=')[1].split('&')[0];
    }

    if (req.method === 'GET') {
      if (id) {
        const conv = await prisma.conversation.findFirst({
          where: { id, userId },
          include: {
            messages: { orderBy: { createdAt: 'asc' } },
          },
        });
        if (!conv) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json(conv);
      } else {
        const conversations = await prisma.conversation.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: { id: true, title: true, createdAt: true },
        });
        return res.status(200).json(conversations);
      }
    }

    if (req.method === 'POST') {
      const { title } = req.body;
      const conv = await prisma.conversation.create({
        data: { title: title || 'New Chat', userId },
      });
      return res.status(201).json(conv);
    }

    if (req.method === 'PATCH') {
      const convId = id || req.body.id;
      const { title } = req.body;
      if (!convId || !title) return res.status(400).json({ error: 'Conversation ID and title are required' });
      const updated = await prisma.conversation.updateMany({
        where: { id: convId, userId },
        data: { title },
      });
      return res.status(200).json({ success: true, updated });
    }

    if (req.method === 'DELETE' && id) {
      await prisma.message.deleteMany({ where: { conversationId: id } });
      await prisma.conversation.deleteMany({ where: { id, userId } });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Conversations error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
