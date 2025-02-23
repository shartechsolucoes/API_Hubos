import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardData = async (req, res) => {
	const [order, user, kit] = await prisma.$transaction([
		prisma.order.count(),
		prisma.user.count(),
		prisma.kit.count(),
	]);

	res.send({ order, user, kit });
};
