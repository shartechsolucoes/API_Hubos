import {
	createTags,
	getTags,
	updateRegisteredTags,
} from '../controllers/Tags/index.js';
import { verifyJwt } from '../middleware/JWTAuth.js';

export default function (fastify, opts, done) {
	fastify.post('/tags', { onRequest: [verifyJwt] }, (request, reply) => {
		return createTags(request, reply);
	});

	fastify.get('/tags', { onRequest: [verifyJwt] }, (request, reply) => {
		return getTags(request, reply);
	});

	fastify.post('/tags/update', { onRequest: [verifyJwt] }, (request, reply) => {
		return updateRegisteredTags(request, reply);
	});

	done();
}
