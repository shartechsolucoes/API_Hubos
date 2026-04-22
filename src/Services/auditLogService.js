import prisma from "../lib/prisma.js";

export async function logAction({
                                    userId = null,
                                    action,
                                    entity = null,
                                    entityId = null,
                                    route = null,
                                    method = null,
                                    ip = null,
                                    userAgent = null,
                                    metadata = null
                                }) {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                entity,
                entityId,
                route,
                method,
                ip,
                userAgent,
                metadata
            }
        });
    } catch (err) {
        console.error("AuditLog error:", err);
    }
}