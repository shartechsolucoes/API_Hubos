import {
	createMaterial,
	deleteMaterial,
	getMaterial,
	listMaterials,
	updateMaterial,
} from '../controllers/Materials/index.js';
import { verifyJwt } from '../middleware/JWTAuth.js';

export default function (fastify, opts, done) {
	fastify.get('/materials', { onRequest: [verifyJwt] }, (request, reply) => {
		return listMaterials(request, reply);
	});
	fastify.get('/material/:id', { onRequest: [verifyJwt] }, (request, reply) => {
		return getMaterial(request, reply);
	});
	fastify.post('/material', { onRequest: [verifyJwt] }, (request, reply) => {
		return createMaterial(request, reply);
	});
	fastify.delete(
		'/material/:id',
		{ onRequest: [verifyJwt] },
		(request, reply) => {
			return deleteMaterial(request, reply);
		}
	);
	fastify.put('/material/:id', { onRequest: [verifyJwt] }, (request, reply) => {
		return updateMaterial(request, reply);
	});
	done();
}
