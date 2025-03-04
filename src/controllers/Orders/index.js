import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createOrder = async (req, res) => {
	const {
		address,
		neighborhood,
		city,
		state,
		status,
		observations,
		lat,
		long,
		qr_code,
		ordersKits,
		protocolNumber,
		userId,
	} = req.body;

	const date = new Date().toLocaleString('sv-SE', {
		timeZone: 'America/Sao_Paulo',
	});
	const osCode = parseInt(qr_code);
	const osStatus = parseInt(status);

	const tzoffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds
	const localISOTime = new Date(Date.now() - tzoffset).toISOString();

	const newOrder = await prisma.order.create({
		data: {
			address,
			neighborhood,
			city,
			state,
			status: osStatus,
			observations,
			lat,
			long,
			qr_code: osCode,
			registerDay: localISOTime,
			protocolNumber,
			userId,
		},
	});

	ordersKits.forEach(async (kit) => {
		await prisma.ordersKits.create({
			data: {
				order_id: newOrder.id,
				kit_id: kit.kit_id,
				quantity: kit.quantity,
			},
		});
	});

	return res.send(newOrder);
};
export const updateOrder = async (req, res) => {
	const { id } = req.params;
	const orderId = parseInt(id);
	const {
		address,
		neighborhood,
		city,
		state,
		status,
		ordersKits,
		observations,
		lat,
		long,
		qr_code,
		protocolNumber,
	} = req.body;

	const osCode = parseInt(qr_code);
	const osStatus = parseInt(status);

	const newOrder = await prisma.order.update({
		where: { id: orderId },
		data: {
			address,
			neighborhood,
			city,
			state,
			status: osStatus,
			observations,
			lat,
			long,
			qr_code: osCode,
			protocolNumber,
		},
	});
	ordersKits.forEach(async (kit) => {
		const findKit = await prisma.ordersKits.findFirst({
			where: { order_id: newOrder.id, kit_id: kit.kit_id },
		});

		if (!findKit) {
			await prisma.ordersKits.create({
				data: {
					order_id: newOrder.id,
					kit_id: kit.kit_id,
					quantity: kit.quantity,
				},
			});
		} else {
			await prisma.ordersKits.update({
				where: { id: findKit.id },
				data: {
					kit_id: kit.kit_id,
					quantity: kit.quantity,
				},
			});
		}
	});

	return res.send(newOrder);
};
export const deleteOrder = async (req, res) => {
	const { id } = req.params;
	const deleteID = parseInt(id);
	await prisma.order.update({
		where: { id: deleteID },
		data: { active: false },
	});
	return res.send({ msg: 'Successfully deleted ' });
};
export const getOrder = async (req, res) => {
	const { id } = req.params;
	const orderId = parseInt(id);
	const orders = await prisma.order.findFirst({
		where: { id: orderId },
	});
	const ordersKits = await prisma.ordersKits.findMany({
		where: { order_id: orderId },
		omit: { id: true, order_id: true },
	});

	return res.send({ ...orders, ordersKits });
};
export const listOrders = async (req, res) => {
	const orders = await prisma.order.findMany({
		where: { active: true },
		orderBy: [
			{
				id: 'desc',
			},
		],
	});
	const total = await prisma.order.count();
	return res.send({ orders, count: { total } });
};

export const removeKitOrder = async (req, res) => {
	const { kitid, orderid } = req.params;
	const kitId = parseInt(kitid);
	const orderId = parseInt(orderid);

	const findMaterial = await prisma.ordersKits.findFirst({
		where: { kit_id: kitId, order_id: orderId },
	});

	await prisma.ordersKits.delete({
		where: { id: findMaterial.id },
	});

	return res.send({ msg: 'removed' });
};

export const findOrdersByDate = async (req, res) => {
	const { start, end } = req.query;

	const filteredByDate = await prisma.order.findMany({
		where: {
			active: true,
			registerDay: {
				lte: new Date(`${end}T23:59:59.999Z`),
				gte: new Date(`${start}T00:00:00.000Z`),
			},
		},
	});

	const orderList = await filteredByDate.map(async (order) => {
		const orderId = order.id;

		const ordersKits = await prisma.ordersKits.findMany({
			where: { order_id: orderId },
			include: {
				kit: true,
			},
			omit: {
				id: true,
				order_id: true,
				kit_id: true,
			},
		});

		return { order, ordersKits };
	});

	const all = await Promise.all(orderList);

	res.send(all);
};

export const findOrdersMaterialsByDate = async (req, res) => {
	const { start, end } = req.query;

	const filteredByDate = await prisma.order.findMany({
		where: {
			active: true,
			registerDay: {
				lte: new Date(`${end}T23:59:59.999Z`),
				gte: new Date(`${start}T00:00:00.000Z`),
			},
		},
	});

	const orderList = await filteredByDate.map(async (order) => {
		const orderId = order.id;

		const ordersKits = await prisma.ordersKits.findMany({
			where: { order_id: orderId },
			include: {
				kit: true,
			},
			omit: {
				id: true,
				order_id: true,
				kit_id: true,
			},
		});

		const materialOrders = ordersKits.map(async (kit, index) => {
			const kitId = kit.kit.id;
			const materials = await prisma.kitMaterial.findMany({
				where: { kit_id: kitId },
				include: { material: true },
			});
			return materials[index];
		});

		const allMaterials = await Promise.all(materialOrders);

		return allMaterials;
	});

	const allMaterials = await Promise.all(orderList);
	const materialsInfos = allMaterials
		.flat()
		.map((material) => ({
			id: material.material.id,
			description: material.material.description,
			quantity: parseInt(material.quantity),
		}))
		.sort(function (a, b) {
			return a.id - b.id;
		});

	const sumArray = materialsInfos.map((material) => {
		const currentID = material.id;
		const reduceReturn = materialsInfos.reduce((accumulator, current) => {
			if (current.id === currentID) {
				accumulator += current.quantity;
			}
			return accumulator;
		}, 0);
		return { ...material, quantity: reduceReturn };
	});

	const filtered = sumArray.reduce((unique, item) => {
		if (!unique.some((obj) => obj.id === item.id)) {
			unique.push(item);
		}

		return unique;
	}, []);

	res.send(filtered);
};

export const duplicateOrder = async (req, res) => {
	const { id } = req.params;
	const orderId = parseInt(id);
	const order = await prisma.order.findFirst({
		omit: { id: true },
		orderBy: { qr_code: 'desc' },
	});

	const ordersKits = await prisma.ordersKits.findMany({
		where: { order_id: orderId },
		omit: { id: true, order_id: true },
	});

	const copyOrder = await prisma.order.findFirst({
		where: { id: orderId },
		omit: { id: true },
	});

	const osCode = parseInt(order.qr_code);

	const duplicateOrder = await prisma.order.create({
		data: {
			...copyOrder,
			qr_code: osCode + 1,
			registerDay: new Date(),
			active: true,
			duplicated: true,
		},
	});
	ordersKits.forEach(async (kit) => {
		await prisma.ordersKits.create({
			data: {
				order_id: duplicateOrder.id,
				kit_id: kit.kit_id,
				quantity: kit.quantity,
			},
		});
	});
};
