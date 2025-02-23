import {
	createOrder,
	deleteOrder,
	duplicateOrder,
	findOrdersByDate,
	getOrder,
	listOrders,
	removeKitOrder,
	updateOrder,
} from '../controllers/Orders/index.js';
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

	fastify.post(
		'/order/duplicate/:id',
		{ onRequest: [verifyJwt] },
		(request, reply) => {
			return duplicateOrder(request, reply);
		}
	);
	done();
}
