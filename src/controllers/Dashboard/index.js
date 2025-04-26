import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardData = async (req, res) => {
	const { userId } = req.query;

	const userDate = await prisma.user.findFirst({
		where: { id: userId },
	});

	const [order, user, kit] = await prisma.$transaction([
		prisma.order.count({
			where: {
				active: true,
				...(userId && userId !== '' && userDate.access_level !== 0
					? { userId }
					: {}),
			},
		}),
		prisma.user.count(),
		prisma.kit.count({ where: { active: true } }),
	]);

	res.send({ order, user, kit });
};
