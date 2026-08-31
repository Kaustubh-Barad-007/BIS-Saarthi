import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const query = (req.query.query || req.query.q) as string | undefined;
      const category = req.query.category as string | undefined;
      const where: any = {};
      if (category && typeof category === 'string') {
        where.category = { contains: category, mode: 'insensitive' };
      }
      if (query && typeof query === 'string') {
        where.OR = [
          { code: { contains: query, mode: 'insensitive' } },
          { title: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ];
      }
      const standards = await prisma.standard.findMany({
        where,
        orderBy: { code: 'asc' },
      });
      return res.status(200).json({ standards, total: standards.length });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { code, title, category, mandatory, scheme, description } = body;
      if (!code || !title) return res.status(400).json({ error: 'Code and title required' });
      const standard = await prisma.standard.create({
        data: {
          code,
          title,
          category: category || 'General',
          mandatory: mandatory ?? true,
          scheme: scheme || 'ISI Mark',
          description,
        },
      });
      return res.status(201).json(standard);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Standards error:', error);
    return res.status(500).json({ error: error.message });
  }
}
