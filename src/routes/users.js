import {
	changePassword,
	createUser,
	getUser,
	getUsers,
	login,
	updateUser,
	userActivities,
} from '../controllers/User/index.js';
import { verifyJwt } from '../middleware/JWTAuth.js';

export default function (fastify, opts, done) {
	fastify.post('/user', (request, reply) => {
		return createUser(request, reply);
	});

	fastify.get('/users', { onRequest: [verifyJwt] }, (request, reply) => {
		return getUsers(request, reply);
	});

	fastify.get('/user/:id', { onRequest: [verifyJwt] }, (request, reply) => {
		return getUser(request, reply);
	});
	fastify.put('/user/:id', { onRequest: [verifyJwt] }, (request, reply) => {
		return updateUser(request, reply);
	});

	fastify.post('/login', { onRequest: [verifyJwt] }, (request, reply) => {
		return login(request, reply);
	});

	fastify.put('/reset-password', (request, reply) => {
		return changePassword(request, reply);
	});

	fastify.get(
		'/user/activities',
		{ onRequest: [verifyJwt] },
		(request, reply) => {
			return userActivities(request, reply);
		}
	);
	done();
}
