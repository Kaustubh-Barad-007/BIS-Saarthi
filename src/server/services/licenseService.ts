import { prisma } from '../db/client';

export const licenseService = {
  async getLicenses(userId: string, role: string) {
    const where = role === "admin" ? {} : { userId };
    return await prisma.license.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    });
  },

  async applyForLicense(userId: string, product: string, isCode: string) {
    if (!product || !isCode) throw new Error("Missing required fields");
    return await prisma.license.create({
      data: {
        userId,
        product,
        isCode,
        status: "pending",
      },
    });
  },

  async updateLicenseStatus(id: string, status: string, licenseNo?: string, validUntil?: string) {
    const updateData: any = { status };
    if (licenseNo) updateData.licenseNo = licenseNo;
    if (validUntil) updateData.validUntil = new Date(validUntil);
    else if (status === "active") updateData.validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    const updated = await prisma.license.update({
      where: { id },
      data: updateData,
    });

    // Side effect: notify user
    await prisma.notification.create({
      data: {
        userId: updated.userId,
        title: `License Status: ${status.toUpperCase()}`,
        message: licenseNo ? `Your license for ${updated.product} is approved. CM/L No: ${licenseNo}` : `Your license application status is now: ${status}.`,
        type: "STATUS_UPDATE"
      }
    });

    return updated;
  }
};
