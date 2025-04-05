import {
	createOrder,
	deleteOrder,
	duplicateOrder,
	findOrdersByDate,
	findOrdersMaterialsByDate,
	getOrder,
	listOrders,
	removeKitOrder,
	updateOrder,
} from '../controllers/Orders/index.js';
import {
	insertEndPhoto,
	insertStartPhoto,
} from '../controllers/Orders/Photos/index.js';
import { verifyJwt } from '../middleware/JWTAuth.js';

export default function (fastify, opts, done) {
	fastify.get('/orders', { onRequest: [verifyJwt] }, (request, reply) => {
		return listOrders(request, reply);
	});
	fastify.get('/order/:id', { onRequest: [verifyJwt] }, (request, reply) => {
		return getOrder(request, reply);
	});
	fastify.post('/order', { onRequest: [verifyJwt] }, (request, reply) => {
		return createOrder(request, reply);
	});
	fastify.delete('/order/:id', { onRequest: [verifyJwt] }, (request, reply) => {
		return deleteOrder(request, reply);
	});
	fastify.put('/order/:id', { onRequest: [verifyJwt] }, (request, reply) => {
		return updateOrder(request, reply);
	});

	fastify.delete(
		'/kit-order/:kitid/:orderid',
		{ onRequest: [verifyJwt] },
		(request, reply) => {
			return removeKitOrder(request, reply);
		}
	);

	fastify.get(
		'/orders/report',
		{ onRequest: [verifyJwt] },
		(request, reply) => {
			return findOrdersByDate(request, reply);
		}
	);

	fastify.get(
		'/orders/report-materials',
		{ onRequest: [verifyJwt] },
		(request, reply) => {
			return findOrdersMaterialsByDate(request, reply);
		}
	);

	fastify.post(
		'/order/duplicate/:id',
		{ onRequest: [verifyJwt] },
		(request, reply) => {
			return duplicateOrder(request, reply);
		}
	);
	fastify.post(
		'/order/start-work-photo',
		{ onRequest: [verifyJwt] },
		(request, reply) => {
			return insertStartPhoto(request, reply);
		}
	);

	fastify.post(
		'/order/end-work-photo',
		{ onRequest: [verifyJwt] },
		(request, reply) => {
			return insertEndPhoto(request, reply);
		}
	);

	done();
}
