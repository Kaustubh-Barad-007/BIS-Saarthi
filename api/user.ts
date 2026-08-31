import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-demo';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const { avatar } = req.body;
    if (!avatar) return res.status(400).json({ error: 'No avatar provided' });

    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: { avatar },
    });

    return res.status(200).json({ success: true, avatar: user.avatar });
  } catch (error: any) {
    console.error('Avatar error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
