import type { VercelRequest, VercelResponse } from "@vercel/node";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-demo";

function getUserId(req: VercelRequest): { userId: string; role: string } | null {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch { return null; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const decoded = getUserId(req);
    if (!decoded) return res.status(401).json({ error: "Unauthorized" });

    if (req.method === "GET") {
      // Admin sees all; users see own
      const where = decoded.role === "admin" ? {} : { userId: decoded.userId };
      const complaints = await prisma.complaint.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: { select: { name: true, email: true } } },
      });
      return res.status(200).json(complaints);
    }

    if (req.method === "POST") {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { subject, details, category, productName, brand, priority } = body;
      if (!subject || !details) return res.status(400).json({ error: "Missing required fields: subject and details" });
      const complaint = await prisma.complaint.create({
        data: {
          userId: decoded.userId,
          subject,
          details,
          category: category || "general",
          productName: productName || null,
          brand: brand || null,
          priority: priority || "normal",
          status: "pending",
        },
      });
      return res.status(201).json(complaint);
    }

    if (req.method === "PATCH") {
      if (decoded.role !== "admin") return res.status(403).json({ error: "Admins only" });
      const { id, status, adminNote } = req.body;
      if (!id) return res.status(400).json({ error: "Missing complaint id" });
      const updated = await prisma.complaint.update({
        where: { id },
        data: { status, adminNote },
      });
      return res.status(200).json(updated);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("Complaints error:", error);
    return res.status(500).json({ error: error?.message || "Internal server error" });
  }
}
