// Import the framework and instantiate it
import fastifyJwt from '@fastify/jwt';
import Fastify from 'fastify';
import users from './src/routes/users.js';
import materials from './src/routes/materials.js';
import kits from './src/routes/kits.js';
import cors from '@fastify/cors';
import orders from './src/routes/orders.js';
import dashboard from './src/routes/dashboard.js';

const PORT = process.env.PORT || 3000;
const fastify = Fastify({
	logger: true,
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

// Run the server!
try {
	await fastify.listen({ port: PORT });
} catch (err) {
	fastify.log.error(err);
	process.exit(1);
}
