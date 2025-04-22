import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createMaterial = async (req, res) => {
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
export const updateMaterial = async (req, res) => {
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
export const deleteMaterial = async (req, res) => {
	const { id } = req.params;
	const materialId = parseInt(id);
	await prisma.material.update({
		where: { id: materialId },
		data: { active: false },
	});
	return res.send({ msg: 'Successfully deleted ' });
};
export const getMaterial = async (req, res) => {
	const { id } = req.params;
	const materialId = parseInt(id);
	const materials = await prisma.material.findFirst({
		where: { id: materialId },
	});
	return res.send(materials);
};
export const listMaterials = async (req, res) => {
	const { name } = req.query;

	let queryDB = { active: true };

	if (name) {
		queryDB = { ...queryDB, description: { contains: name } };
	}

	const materials = await prisma.material.findMany({
		where: queryDB,
	});
	return res.send(materials);
};
