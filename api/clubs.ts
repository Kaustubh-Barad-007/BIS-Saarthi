import type { VercelRequest, VercelResponse } from "@vercel/node";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-demo";

const CLUBS = [
  { id: "1", name: "Delhi Public School, R.K. Puram", city: "New Delhi", state: "Delhi", members: 45, type: "School", established: "2019", contact: "principal@dpsrkp.net" },
  { id: "2", name: "Kendriya Vidyalaya, IIT Powai", city: "Mumbai", state: "Maharashtra", members: 32, type: "School", established: "2020", contact: "kvpowai@kendriyavidyalaya.in" },
  { id: "3", name: "St. Xavier''s College", city: "Kolkata", state: "West Bengal", members: 120, type: "College", established: "2018", contact: "standards@sxccal.edu" },
  { id: "4", name: "Delhi Technological University", city: "New Delhi", state: "Delhi", members: 85, type: "University", established: "2017", contact: "standards@dtu.ac.in" },
  { id: "5", name: "National Institute of Technology", city: "Trichy", state: "Tamil Nadu", members: 60, type: "University", established: "2019", contact: "standards@nitt.edu" },
  { id: "6", name: "Sardar Patel Vidyalaya", city: "New Delhi", state: "Delhi", members: 28, type: "School", established: "2021", contact: "info@spvidyalaya.in" },
  { id: "7", name: "BITS Pilani", city: "Pilani", state: "Rajasthan", members: 140, type: "University", established: "2016", contact: "standards@bits-pilani.ac.in" },
  { id: "8", name: "IIT Bombay", city: "Mumbai", state: "Maharashtra", members: 200, type: "University", established: "2015", contact: "standards@iitb.ac.in" },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    const { q } = req.query;
    const where: any = {};
    if (q && typeof q === "string" && q.length > 0) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { state: { contains: q, mode: "insensitive" } },
      ];
    }
    
    let clubs = await prisma.standardClub.findMany({
      where,
      orderBy: { name: "asc" },
    });
    
    if (clubs.length === 0) {
      const CLUBS_SEED = [
        { name: "Delhi Public School, R.K. Puram", city: "New Delhi", state: "Delhi", members: 45, type: "School", established: "2019", contact: "principal@dpsrkp.net" },
        { name: "Kendriya Vidyalaya, IIT Powai", city: "Mumbai", state: "Maharashtra", members: 32, type: "School", established: "2020", contact: "kvpowai@kendriyavidyalaya.in" },
        { name: "St. Xavier's College", city: "Kolkata", state: "West Bengal", members: 120, type: "College", established: "2018", contact: "standards@sxccal.edu" },
        { name: "Delhi Technological University", city: "New Delhi", state: "Delhi", members: 85, type: "University", established: "2017", contact: "standards@dtu.ac.in" },
        { name: "National Institute of Technology", city: "Trichy", state: "Tamil Nadu", members: 60, type: "University", established: "2019", contact: "standards@nitt.edu" },
        { name: "Sardar Patel Vidyalaya", city: "New Delhi", state: "Delhi", members: 28, type: "School", established: "2021", contact: "info@spvidyalaya.in" }
      ];
      await prisma.standardClub.createMany({ data: CLUBS_SEED, skipDuplicates: true });
      clubs = await prisma.standardClub.findMany({ where, orderBy: { name: "asc" } });
    }


    // If user is logged in, attach their join requests
    const token = req.headers.authorization?.split(" ")[1];
    let userRequests: any[] = [];
    if (token) {
      try {
        
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded.role === "admin") {
          userRequests = await prisma.clubJoinRequest.findMany({
            orderBy: { createdAt: "desc" },
            include: { user: { select: { name: true, email: true } } }
          });
        } else {
          userRequests = await prisma.clubJoinRequest.findMany({ where: { userId: decoded.userId } });
        }

      } catch {}
    }
    return res.status(200).json({ clubs, userRequests });
  }

  if (req.method === "POST") {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { clubId, clubName } = body;
      if (!clubId) return res.status(400).json({ error: "Missing clubId" });
      // Check if already requested
      const existing = await prisma.clubJoinRequest.findFirst({ where: { userId: decoded.userId, clubId } });
      if (existing) return res.status(400).json({ error: "Already requested", request: existing });
      const request = await prisma.clubJoinRequest.create({
        data: { userId: decoded.userId, clubId, clubName: clubName || "Unknown Club", status: "pending" },
      });
      return res.status(201).json(request);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Admin PATCH to approve/reject
  if (req.method === "PATCH") {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const targetId = body.id || body.requestId;
      const { status } = body;
      if (!targetId) return res.status(400).json({ error: "Missing request id" });
      const updated = await prisma.clubJoinRequest.update({ where: { id: targetId }, data: { status } });
      return res.status(200).json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
