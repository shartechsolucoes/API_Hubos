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

	static async listServices(userId, page = 1, perPage = 10) {
		const skip = (page - 1) * perPage;

		const where = userId ? { userId, active: true } : { active: true }; // aplica filtro apenas se userId existir

		const [services, total] = await Promise.all([
			prisma.service.findMany({
				where,
				skip,
				take: perPage,
				orderBy: { id: 'desc' },
				include: {
					user: true,
					order: true,
				},
			}),
			prisma.service.count({
				where,
			}),
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
			address: this.address,
			neighborhood: this.neighborhood,
			city: this.city,
			state: this.state,
		};

		// Verifica e adiciona userId se existir e for válido
		if (this.userId) {
			const userExists = await prisma.user.findUnique({
				where: { id: this.userId },
			});

			if (!userExists) {
				throw new Error(`Usuário com id ${this.userId} não encontrado`);
			}

			data.userId = this.userId;
		}

		// Verifica e adiciona orderId se existir e for válido
		if (this.orderId) {
			const orderExists = await prisma.order.findUnique({
				where: { id: this.orderId },
			});

			if (!orderExists) {
				throw new Error(`Ordem com id ${this.orderId} não encontrada`);
			}

			data.orderId = this.orderId;
		} else {
			// Define null apenas se o campo aceitar null (o que parece ser o seu caso)
			data.orderId = null;
		}

		// Atualiza o serviço com os dados validados
		return await prisma.service.update({
			where: { id: this.id },
			data,
		});
	}

	static async deleteService(id) {
		return await prisma.service.update({
			where: { id: Number(id) },
			data: {
				active: false,
			},
		});
	}
}
