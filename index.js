// Import the framework and instantiate it
import fastifyJwt from '@fastify/jwt';
import Fastify from 'fastify';
import users from './src/routes/users.js';
import materials from './src/routes/materials.js';
import kits from './src/routes/kits.js';
import cors from '@fastify/cors';
import orders from './src/routes/orders.js';
import dashboard from './src/routes/dashboard.js';
import avatar from './src/routes/avatar.js';
import fastifyMultipart from '@fastify/multipart';
import path, { dirname } from 'path';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;
const fastify = Fastify({
	logger: true,
});

fastify.register(fastifyMultipart, {
	addToBody: true, // Adiciona os arquivos processados ao corpo da requisição
	limits: {
		fileSize: 10 * 1024 * 1024, // Limite de tamanho de arquivo (10MB)
	},
});

fastify.register(fastifyStatic, {
	root: path.join(__dirname, 'public', 'uploads'), // Diretório onde os arquivos são armazenados
	prefix: '/images/', // Prefixo na URL para acessar os arquivos
});

await fastify.register(cors, {
	// put your options here
});
const secret = process.env.SECRET;
// Declare a route
fastify.register(fastifyJwt, {
	secret: secret,
});
fastify.register(users);
fastify.register(materials);
fastify.register(kits);
fastify.register(orders);
fastify.register(dashboard);
fastify.register(avatar);

// Run the server!
try {
	await fastify.listen({ port: PORT });
} catch (err) {
	fastify.log.error(err);
	process.exit(1);
}
