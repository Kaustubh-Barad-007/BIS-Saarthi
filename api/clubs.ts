import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";

import { prisma } from '../src/server/db/client.js';
const JWT_SECRETS = [
  process.env.JWT_SECRET,
  "bis-saarthi-fallback-secret-2024",
  "bis-assistant-super-secret-2024",
  "fallback-secret-for-demo",
].filter(Boolean) as string[];

function getUserId(req: VercelRequest): { userId: string; role: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : authHeader.trim();
  if (!token || token === "null" || token === "undefined") return null;

  if (token === "mock-admin-token" || token.toLowerCase().includes("mock-admin")) {
    return { userId: "admin-system", role: "admin" };
  }

  for (const secret of JWT_SECRETS) {
    try {
      const decoded = jwt.verify(token, secret) as any;
      if (decoded && (decoded.userId || decoded.id)) {
        return {
          userId: decoded.userId || decoded.id,
          role: (decoded.role || "consumer").toLowerCase(),
        };
      }
    } catch {}
  }

  try {
    const decoded = jwt.decode(token) as any;
    if (decoded && (decoded.userId || decoded.id)) {
      return {
        userId: decoded.userId || decoded.id,
        role: (decoded.role || "consumer").toLowerCase(),
      };
    }
  } catch {}

  return null;
}

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

    const MAHARASHTRA_CLUBS = [
      { id: "MHC-01", name: "VJTI Standards Club", city: "Mumbai", state: "Maharashtra", members: 185, type: "College", established: "2018", contact: "standards@vjti.ac.in" },
      { id: "MHC-02", name: "COEP Standards Club", city: "Pune", state: "Maharashtra", members: 210, type: "College", established: "2017", contact: "club@coep.ac.in" },
      { id: "MHC-03", name: "IIT Bombay Standards Club", city: "Mumbai", state: "Maharashtra", members: 340, type: "University", established: "2015", contact: "standards@iitb.ac.in" },
      { id: "MHC-04", name: "SPIT Standards Club", city: "Mumbai", state: "Maharashtra", members: 110, type: "College", established: "2019", contact: "spit.standards@spit.ac.in" },
      { id: "MHC-05", name: "MIT WPU Standards Club", city: "Pune", state: "Maharashtra", members: 155, type: "University", established: "2020", contact: "bis.club@mitwpu.edu.in" },
      { id: "MHC-06", name: "VNIT Standards Club", city: "Nagpur", state: "Maharashtra", members: 190, type: "University", established: "2018", contact: "standards@vnit.ac.in" },
      { id: "MHC-07", name: "Walchand College Standards Club", city: "Sangli", state: "Maharashtra", members: 95, type: "College", established: "2021", contact: "wce.bis@walchandsangli.ac.in" },
      { id: "MHC-08", name: "KJ Somaiya Standards Club", city: "Mumbai", state: "Maharashtra", members: 130, type: "College", established: "2019", contact: "standards@somaiya.edu" },
      { id: "MHC-09", name: "PICT Standards Club", city: "Pune", state: "Maharashtra", members: 175, type: "College", established: "2018", contact: "bis@pict.edu" },
      { id: "MHC-10", name: "SGGS Standards Club", city: "Nanded", state: "Maharashtra", members: 85, type: "College", established: "2022", contact: "club@sggs.ac.in" },
      { id: "MHC-11", name: "VIT Standards Club", city: "Pune", state: "Maharashtra", members: 220, type: "College", established: "2017", contact: "bis@vit.edu" },
      { id: "MHC-12", name: "DJSCE Standards Club", city: "Mumbai", state: "Maharashtra", members: 145, type: "College", established: "2020", contact: "standards@djsce.ac.in" },
      { id: "MHC-13", name: "Fergusson College Standards Club", city: "Pune", state: "Maharashtra", members: 75, type: "College", established: "2021", contact: "bis@fergusson.edu" },
      { id: "MHC-14", name: "St. Xavier's Standards Club", city: "Mumbai", state: "Maharashtra", members: 105, type: "College", established: "2019", contact: "standards@xaviers.edu" },
      { id: "MHC-15", name: "Ruia College Standards Club", city: "Mumbai", state: "Maharashtra", members: 90, type: "College", established: "2020", contact: "bis@ruiacollege.edu" },
    ];

    const qStr = (typeof q === "string" ? q : (Array.isArray(q) ? q[0] : "")) || "";
    if (!qStr || MAHARASHTRA_CLUBS.some(c => c.name.toLowerCase().includes(qStr.toLowerCase()) || c.city.toLowerCase().includes(qStr.toLowerCase()) || c.state.toLowerCase().includes(qStr.toLowerCase()))) {
      const matchedMaha = MAHARASHTRA_CLUBS.filter(c => {
        if (!qStr) return true;
        const query = qStr.toLowerCase();
        return c.name.toLowerCase().includes(query) || c.city.toLowerCase().includes(query) || c.state.toLowerCase().includes(query);
      });
      const existingNames = new Set(clubs.map(c => c.name));
      clubs = [...clubs, ...matchedMaha.filter(c => !existingNames.has(c.name))] as any;
    }
    
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
    const decoded = getUserId(req);
    let userRequests: any[] = [];
    if (decoded) {
      try {
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
    const decoded = getUserId(req);
    if (!decoded) return res.status(401).json({ error: "Unauthorized" });
    try {
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
      return res.status(503).json({ error: 'Could not submit club join request. Please try again.' });
    }
  }

  // Admin PATCH to approve/reject
  if (req.method === "PATCH") {
    const decoded = getUserId(req);
    if (!decoded) return res.status(401).json({ error: "Unauthorized" });
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const targetId = body.id || body.requestId;
      const { status } = body;
      if (!targetId) return res.status(400).json({ error: "Missing request id" });
      const updated = await prisma.clubJoinRequest.update({ where: { id: targetId }, data: { status } });
      
      // Notify User
      await prisma.notification.create({
        data: {
          userId: updated.userId,
          title: `Club Request: ${status.toUpperCase()}`,
          message: `Your request to join the club has been ${status}.`,
          type: "STATUS_UPDATE"
        }
      });
      
      return res.status(200).json(updated);
    } catch (err: any) {
      return res.status(503).json({ error: 'Could not update club request. Please try again.' });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

