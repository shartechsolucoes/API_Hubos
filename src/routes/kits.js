import {
	createKit,
	deleteKit,
	getKit,
	listKits,
	updateKit,
} from '../controllers/Kits/index.js';
import { verifyJwt } from '../middleware/JWTAuth.js';

export default function (fastify, opts, done) {
	fastify.get('/kits', { onRequest: [verifyJwt] }, (request, reply) => {
		return listKits(request, reply);
	});
	fastify.get('/kit', { onRequest: [verifyJwt] }, (request, reply) => {
		return getKit(request, reply);
	});
	fastify.post('/kit', { onRequest: [verifyJwt] }, (request, reply) => {
		return createKit(request, reply);
	});
	fastify.delete('/kit/:id', { onRequest: [verifyJwt] }, (request, reply) => {
		return deleteKit(request, reply);
	});
	fastify.put('/kit/:id', { onRequest: [verifyJwt] }, (request, reply) => {
		return updateKit(request, reply);
	});
	done();
}
