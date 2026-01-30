import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createPost = async (req, res) => {
	const { description, group, active, unit, status } = req.body;

	let activeMaterial;
	if (typeof active === 'string') {
		activeMaterial = active === 'true';
	} else {
		activeMaterial = active;
	}

	const newMaterial = await prisma.material.create({
		data: {
			description,
			group,
			active: activeMaterial,
			unit,
			status,
		},
	});

	return res.send(newMaterial);
};
export const updatePost = async (req, res) => {
	const { id } = req.params;
	const materialId = parseInt(id);
	const { description, kitId, group, active, unit, status } = req.body;

	let activeMaterial;
	if (typeof active === 'string') {
		activeMaterial = active === 'true';
	} else {
		activeMaterial = active;
	}

	const newMaterial = await prisma.material.update({
		where: { id: materialId },
		data: {
			description,
			kitId,
			group,
			active: activeMaterial,
			unit,
			status,
		},
	});

	return res.send(newMaterial);
};
export const deletePost = async (req, res) => {
	const { id } = req.params;
	const materialId = parseInt(id);

	const usedMaterial = await prisma.kitMaterial.findFirst({
		where: { material_id: materialId },
	});

	const usedKit = await prisma.ordersKits.findFirst({
		where: { kit_id: usedMaterial.kit_id },
	});

	if (usedKit) {
		return res
			.code(405)
			.send({ msg: 'Não é possível deletar, material em uso' });
	}

	await prisma.material.update({
		where: { id: materialId },
		data: { active: false },
	});
	return res.send({ msg: 'Successfully deleted ' });
};
export const getPost = async (req, res) => {
	const { id } = req.params;
	const materialId = parseInt(id);
	const materials = await prisma.material.findFirst({
		where: { id: materialId },
	});
	return res.send(materials);
};

export const listPosts = async (req, res) => {
	try {
		const posts = await prisma.post.findMany({
			orderBy: { id: 'desc' },
		});

		return res.send(posts); // Fastify usa send, não json
	} catch (error) {
		console.error(error);
		return res.status(500).send({ error: 'Erro ao listar postes' });
	}
};
