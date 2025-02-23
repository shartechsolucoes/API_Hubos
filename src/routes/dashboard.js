import { getDashboardData } from '../controllers/Dashboard/index.js';
import { verifyJwt } from '../middleware/JWTAuth.js';

export default function (fastify, opts, done) {
	fastify.get('/dashboard', { onRequest: [verifyJwt] }, (request, reply) => {
		return getDashboardData(request, reply);
	});

	done();
}
