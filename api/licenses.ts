import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUserIdFromHeader } from '../src/server/utils/auth.js';
import { licenseService } from '../src/server/services/licenseService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const decoded = getUserIdFromHeader(req.headers.authorization);
    if (!decoded) return res.status(401).json({ error: "Unauthorized" });

    if (req.method === "GET") {
      const licenses = await licenseService.getLicenses(decoded.userId, decoded.role);
      return res.status(200).json(licenses);
    }

    if (req.method === "POST") {
      const { product, isCode } = req.body;
      const license = await licenseService.applyForLicense(decoded.userId, product, isCode);
      return res.status(201).json(license);
    }

    if (req.method === "PATCH") {
      if (decoded.role !== "admin") return res.status(403).json({ error: "Admins only" });
      const { id, status, licenseNo, validUntil } = req.body;
      if (!id) return res.status(400).json({ error: "Missing license id" });
      
      const updated = await licenseService.updateLicenseStatus(id, status, licenseNo, validUntil);
      return res.status(200).json(updated);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("Licenses error:", error);
    if (error.message === "Missing required fields") return res.status(400).json({ error: error.message });
    return res.status(503).json({ error: "License service temporarily unavailable. Please try again." });
  }
}
