import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createMaterial = async (req, res) => {
	const { description, quantity, kitId } = req.body;

	const newMaterial = await prisma.material.create({
		data: {
			description,
			quantity,
			kitId,
		},
	});

	return res.send(newMaterial);
};
export const updateMaterial = async (req, res) => {
	const { id } = req.params;
	const materialId = parseInt(id);
	const { description, quantity, kitId } = req.body;

	const newMaterial = await prisma.material.update({
		where: { id: materialId },
		data: {
			description,
			quantity,
			kitId,
		},
	});

	return res.send(newMaterial);
};
export const deleteMaterial = async (req, res) => {
	const { id } = req.params;
	await prisma.material.update({
		where: { id },
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
	const materials = await prisma.material.findMany();
	return res.send(materials);
};
