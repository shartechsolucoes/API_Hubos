import { postAvatar } from '../controllers/Avatar/index.js';
import { verifyJwt } from '../middleware/JWTAuth.js';

export default function (fastify, opts, done) {
	fastify.post('/avatar', { onRequest: [verifyJwt] }, (request, reply) => {
		return postAvatar(request, reply);
	});

	done();
}
