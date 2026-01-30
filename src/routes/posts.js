import {
	createPost,
	deletePost,
	getPost,
	listPosts,
	updatePost,
} from '../controllers/Posts/index.js';
import { verifyJwt } from '../middleware/JWTAuth.js';

export default function (fastify, opts, done) {
	fastify.get('/posts', { onRequest: [verifyJwt] }, (request, reply) => {
		return listPosts(request, reply);
	});
	fastify.get('/post/:id', { onRequest: [verifyJwt] }, (request, reply) => {
		return getPost(request, reply);
	});
	fastify.post('/post', { onRequest: [verifyJwt] }, (request, reply) => {
		return createPost(request, reply);
	});
	fastify.delete(
		'/post/:id',
		{ onRequest: [verifyJwt] },
		(request, reply) => {
			return deletePost(request, reply);
		}
	);
	fastify.put('/post/:id', { onRequest: [verifyJwt] }, (request, reply) => {
		return updatePost(request, reply);
	});
	done();
}
