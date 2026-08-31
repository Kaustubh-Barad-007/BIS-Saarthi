import type { VercelRequest, VercelResponse } from "@vercel/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      const { state, product, query } = req.query;
      const where: any = {};
      
      if (state && typeof state === "string" && state.length > 1) {
        where.OR = [
          { state: { contains: state, mode: "insensitive" } },
          { location: { contains: state, mode: "insensitive" } },
        ];
      }

      if (query && typeof query === "string" && query.length > 0) {
        where.OR = [
          ...(where.OR || []),
          { name: { contains: query, mode: "insensitive" } },
          { location: { contains: query, mode: "insensitive" } },
          { state: { contains: query, mode: "insensitive" } },
        ];
      }

      let labs = await prisma.laboratory.findMany({
        where,
        orderBy: { name: "asc" },
      });

      if (product && typeof product === "string" && product.length > 1) {
        const pLower = product.toLowerCase();
        labs = labs.filter(l => l.products.some(p => p.toLowerCase().includes(pLower)));
      }

      return res.status(200).json({ labs, total: labs.length });
    }

    if (req.method === "POST") {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { name, location, state, address, products, nabl, bis, phone, email, website, established } = body;
      if (!name || !location || !state) return res.status(400).json({ error: "Name, location, and state are required" });
      const lab = await prisma.laboratory.create({
        data: {
          name,
          location,
          state,
          address,
          products: Array.isArray(products) ? products : [products || "General"],
          nabl: nabl ?? true,
          bis: bis ?? true,
          phone,
          email,
          website,
          established,
        },
      });
      return res.status(201).json(lab);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("Labs error:", error);
    return res.status(500).json({ error: error.message });
  }
}
