import fastifyJwt from '@fastify/jwt';
import Fastify from 'fastify';

import users from './src/routes/users.js';
import materials from './src/routes/materials.js';
import kits from './src/routes/kits.js';
import orders from './src/routes/orders.js';
import dashboard from './src/routes/dashboard.js';
import avatar from './src/routes/avatar.js';
import tags from './src/routes/tags.js';
import services from './src/routes/services.js';
import posts from './src/routes/posts.js';
import audit from './src/routes/audit.js';

import cors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';

import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import auditMiddleware from "./src/Services/auditMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;


/*
 * PRIMEIRO: criar instância Fastify
 */
const fastify = Fastify({
	logger: true,
});

/*
 * DEPOIS: registrar plugins
 */
await fastify.register(cors);

await fastify.register(fastifyMultipart, {
	addToBody: true,
	limits: {
		fileSize: 10 * 1024 * 1024,
	},
});

await fastify.register(fastifyStatic, {
	root: path.join(__dirname, 'public', 'uploads'),
	prefix: '/images/',
	decorateReply: false,
});

await fastify.register(fastifyStatic, {
	root: path.join(__dirname, 'public', 'startWork'),
	prefix: '/images/startWork',
	decorateReply: false,
});

await fastify.register(fastifyStatic, {
	root: path.join(__dirname, 'public', 'endWork'),
	prefix: '/images/endWork',
	decorateReply: false,
});

await fastify.register(fastifyStatic, {
	root: path.join(__dirname, 'public', 'order'),
	prefix: '/images/order',
	decorateReply: false,
});

await fastify.register(fastifyJwt, {
	secret: process.env.SECRET
});

/*
 * O audit precisa ser aplicado na instância raiz para alcançar todas as rotas.
 */
await auditMiddleware(fastify);


/*
 * Depois registrar rotas
 */
fastify.register(users);
fastify.register(materials);
fastify.register(kits);
fastify.register(orders);
fastify.register(dashboard);
fastify.register(avatar);
fastify.register(tags);
fastify.register(services);
fastify.register(posts);
fastify.register(audit);


/*
 * Iniciar servidor
 */
try {
	await fastify.listen({ port: PORT });
} catch (err) {
	fastify.log.error(err);
	process.exit(1);
}
