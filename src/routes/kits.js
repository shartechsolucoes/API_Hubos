import {
	createKit,
	deleteKit,
	getKit,
	listKits,
	removeMaterialKit,
	updateKit,
} from '../controllers/Kits/index.js';
import { verifyJwt } from '../middleware/JWTAuth.js';

export default function (fastify, opts, done) {
	fastify.get('/kits', { onRequest: [verifyJwt] }, (request, reply) => {
		return listKits(request, reply);
	});
	fastify.get('/kit/:id', { onRequest: [verifyJwt] }, (request, reply) => {
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

	fastify.delete(
		'/kit-material/:materialid/:kitid',
		{ onRequest: [verifyJwt] },
		(request, reply) => {
			return removeMaterialKit(request, reply);
		}
	);

	done();
}
