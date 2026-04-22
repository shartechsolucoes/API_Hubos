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

	fastify.post('/user', createUser);

	fastify.get('/users', { onRequest: [verifyJwt] }, getUsers);

	fastify.get('/user/:id', { onRequest: [verifyJwt] }, getUser);

	fastify.put('/user/:id', { onRequest: [verifyJwt] }, updateUser);

	fastify.post('/login', login);

	fastify.put('/reset-password', changePassword);

	fastify.get(
		'/user/activities',
		{ onRequest: [verifyJwt] },
		userActivities
	);

	done();
}