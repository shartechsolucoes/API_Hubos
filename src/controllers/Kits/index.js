import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createKit = async (req, res) => {
	const { description, materials } = req.body;
	console.log(req.body);

	const newKit = await prisma.kit.create({
		data: {
			description,
		},
	});

	materials.forEach(async (material) => {
		await prisma.kitMaterial.create({
			data: {
				quantity: material.quantity,
				kit_id: newKit.id,
				material_id: material.id,
			},
		});
	});

	return res.send({ msg: 'Successfully created ' });
};

export const updateKit = async (req, res) => {
	const { id } = req.params;
	const { description, materials } = req.body;

	const newKit = await prisma.kit.update({
		where: { id },
		data: {
			description,
			materials,
		},
	});

	return res.send(newKit);
};

export const deleteKit = async (req, res) => {
	const { id } = req.params;
	await prisma.kit.delete({
		where: { id },
	});
	return res.send({ msg: 'Successfully deleted ' });
};
export const getKit = async (req, res) => {
	const { id } = req.params;
	const kit = await prisma.kit.findFirst({
		where: { id },
	});
	return res.send(kit);
};

export const listKits = async (req, res) => {
	const kits = await prisma.kit.findMany();

	const listKits = kits.map(async (kit) => {
		const materials = await prisma.kitMaterial.findMany({
			include: {
				material: true,
			},
			omit: {
				id: true,
				material_id: true,
				kit_id: true,
				// quantity: true,
			},
			where: { kit_id: kit.id },
		});
		return { ...kit, materials };
	});

	const all = await Promise.all(listKits);

	return res.send(all);
};
