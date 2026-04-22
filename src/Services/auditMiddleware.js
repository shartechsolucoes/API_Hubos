import { logAction } from "./auditLogService.js";

const ACTION_MAP = {
    POST: "CREATE",
    GET: "VIEW",
    PUT: "UPDATE",
    PATCH: "UPDATE",
    DELETE: "DELETE"
};

export default async function auditMiddleware(fastify) {

    fastify.addHook("onResponse", async (request, reply) => {

        try {

            if (!request.user) return;

            const action = ACTION_MAP[request.method];
            if (!action) return;

            const routePattern =
                request.routeOptions?.url || request.routerPath || request.url;

            const entity =
                routePattern
                    ?.split("?")[0]
                    .split("/")
                    .filter(Boolean)[0] || null;

            // O token de login usa `sub`, entao o audit precisa aceitar esse campo.
            const authenticatedUserId =
                request.user.id || request.user.sub || null;

            const entityId =
                request.params?.id || null;

            await logAction({
                userId: authenticatedUserId,
                action,
                entity,
                entityId: entityId ? String(entityId) : null,
                route: routePattern,
                method: request.method,
                ip: request.ip,
                userAgent: request.headers["user-agent"],
                metadata: {
                    statusCode: reply.statusCode
                }
            });

        } catch (err) {

            console.error("Audit middleware error:", err);

        }

    });

}
