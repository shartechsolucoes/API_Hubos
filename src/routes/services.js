import { Service } from '../controllers/Service/index.js';
import { verifyJwt } from '../middleware/JWTAuth.js';

export default function (fastify, opts, done) {
	fastify.get(
		'/services',
		{ onRequest: [verifyJwt] },
		async (request, reply) => {
			const page = parseInt(request.query.page) || 1;
			const perPage = 10;

			const services = await Service.listServices(page, perPage);
			return reply.send(services);
		}
	);
	fastify.get(
		'/services/:id',
		{ onRequest: [verifyJwt] },
		async (request, reply) => {
			const { id } = request.params;
			const service = await Service.getById(id);
			if (!service.id) {
				reply.code(404).send({ error: 'Serviço não encontrado' });
			}
			return reply.send(service);
		}
	);

	fastify.post(
		'/services',
		{ onRequest: [verifyJwt] },
		async (request, reply) => {
			try {
				const service = new Service(request.body);
				const newService = await service.createService();
				return reply.code(200).send(newService);
			} catch (err) {
				return reply.code(400).send({ error: err.message });
			}
		}
	);

	fastify.put('/services/:id', async (request, reply) => {
		try {
			const service = new Service({
				...request.body,
				id: parseInt(request.params.id),
			});
			const updated = await service.updateService();
			reply.send(updated);
		} catch (err) {
			reply.code(400).send({ error: err.message });
		}
	});

	fastify.delete('/services/:id', async (request, reply) => {
		try {
			const deleted = await Service.deleteService(request.params.id);
			reply.send(deleted);
		} catch (err) {
			reply.code(400).send({ error: err.message });
		}
	});
	done();
}
