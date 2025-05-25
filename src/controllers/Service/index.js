import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class Service {
	constructor(data = {}) {
		this.id = data.id || null;
		this.protocolNumber = data.protocolNumber || '';
		this.numberPost = data.numberPost || 0;
		this.observation = data.observation || '';
		this.userId = data.userId || '';
		this.orderId = data.orderId || 0;
		this.address = data.address || '';
		this.neighborhood = data.neighborhood || '';
		this.city = data.city || '';
		this.state = data.state || '';
		this.user = data.user || null;
		this.order = data.order || null;
	}

	static async listServices(page = 1, perPage = 10) {
		const skip = (page - 1) * perPage;

		const [services, total] = await Promise.all([
			prisma.service.findMany({
				skip,
				take: perPage,
				orderBy: { id: 'desc' },
			}),
			prisma.service.count(),
		]);

		return {
			data: services,
			meta: {
				total,
				page,
				perPage,
				totalPages: Math.ceil(total / perPage),
			},
		};
	}
	static async getById(id) {
		return await prisma.service.findUnique({
			where: { id: Number(id) },
		});
	}

	async createService() {
		const data = {
			protocolNumber: this.protocolNumber,
			numberPost: this.numberPost,
			observation: this.observation,
			address: this.address,
			neighborhood: this.neighborhood,
			city: this.city,
			state: this.state,
		};

		const result = await prisma.service.create({ data });
		this.id = result.id;
		return result;
	}

	async updateService() {
		const data = {
			protocolNumber: this.protocolNumber,
			numberPost: this.numberPost,
			observation: this.observation,
			userId: this.userId ?? null,
			orderId: this.orderId > 0 ? this.orderId : null,
			address: this.address,
			neighborhood: this.neighborhood,
			city: this.city,
			state: this.state,
		};

		console.log(data);
		if (!this.id) throw new Error('ID é obrigatório para atualizar.');
		if (data.userId) {
			const userExists = await prisma.user.findUnique({
				where: { id: data.userId },
			});

			if (!userExists) {
				throw new Error(`Usuário com id ${data.userId} não encontrado`);
			}
		}

		return await prisma.service.update({
			where: { id: this.id },
			data,
		});
	}

	static async deleteService(id) {
		return await prisma.service.delete({
			where: { id: Number(id) },
		});
	}
}
