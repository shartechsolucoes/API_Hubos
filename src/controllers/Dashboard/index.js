import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardData = async (req, res) => {
	const [order, user, kit] = await prisma.$transaction([
		prisma.order.count({where: { active: true }}),
		prisma.user.count({where: { active: true }}),
		prisma.kit.count({where: { active: true }}),
	]);

	res.send({ order, user, kit });
};
