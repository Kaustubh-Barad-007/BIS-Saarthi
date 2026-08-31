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
      const where = decoded.role === "admin" ? {} : { userId: decoded.userId };
      const licenses = await prisma.license.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      });
      return res.status(200).json(licenses);
    }

    if (req.method === "POST") {
      const { product, isCode } = req.body;
      if (!product || !isCode) return res.status(400).json({ error: "Missing required fields" });
      const license = await prisma.license.create({
        data: {
          userId: decoded.userId,
          product,
          isCode,
          status: "pending",
        },
      });
      return res.status(201).json(license);
    }

    if (req.method === "PATCH") {
      if (decoded.role !== "admin") return res.status(403).json({ error: "Admins only" });
      const { id, status, licenseNo, validUntil } = req.body;
      if (!id) return res.status(400).json({ error: "Missing license id" });
      
      const updateData: any = { status };
      if (licenseNo) updateData.licenseNo = licenseNo;
      if (validUntil) updateData.validUntil = new Date(validUntil);
      else if (status === "active") updateData.validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year by default

      const updated = await prisma.license.update({
        where: { id },
        data: updateData,
      });
      return res.status(200).json(updated);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("Licenses error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
