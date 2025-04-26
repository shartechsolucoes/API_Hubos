import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

BigInt.prototype.toJSON = function () {
	const int = Number.parseInt(this.toString());
	return int ?? this.toString();
};

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
		photoEndWork,
		photoStartWork,
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
			photoEndWork,
			photoStartWork,
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
		photoEndWork,
		photoStartWork,
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
			photoEndWork,
			photoStartWork,
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
	const { page, os, neighborhood, status, dateStart, dateEnd, userId } =
		req.query;

	const user = await prisma.user.findFirst({
		where: { id: userId },
	});

	let querySearch = '';
	let queryPagination = '';

	if (os) {
		querySearch += ` AND o.qr_code LIKE CONCAT('%', ${os}, '%')`;
	}

	if (status && status !== '') {
		querySearch += `${querySearch} AND o.status = ` + status;
	}

	if (neighborhood) {
		querySearch += ` AND o.neighborhood LIKE '%${neighborhood}%'`;
	}

	if (dateStart && dateStart !== '') {
		querySearch += ` AND o.registerDay >= \'${dateStart + ' 00:00:00.000'}\'`;
	}

	if (dateEnd && dateEnd !== '') {
		querySearch += ` AND o.registerDay <= \'${dateEnd + ' 23:59:59.999'}\'`;
	}

	if (page && page !== '') {
		queryPagination += `LIMIT 10 OFFSET ${parseInt(page || 0) * 10}`;
	}

	if (userId && userId !== '' && user.access_level !== 0) {
		querySearch += ` AND o.userId = '${userId}'`;
	}

	const listOs = await prisma.$queryRawUnsafe(
		`SELECT
  		o.*,
  		k.description AS ordersKits
		FROM \`Order\` o
		LEFT JOIN OrdersKits ok ON ok.order_id = o.id
		LEFT JOIN Kit k ON k.id = ok.kit_id
		WHERE o.active = 1
  	${querySearch}
		GROUP BY o.id
		ORDER BY o.id DESC
		${queryPagination};`
	);
	const [total, actives] = await prisma.$transaction([
		prisma.$queryRawUnsafe(
			`SELECT COUNT(*) as total
			FROM \`Order\` o
			where o.active = 1 ${querySearch} ;`
		),
		prisma.order.count({ where: { active: true } }),
	]);

	console.log(listOs);

	const listOrders = listOs.map(async (order) => {
		if (!order.userId) {
			return { ...order, user: {} };
		}
		const user = await prisma.user.findFirst({
			where: { id: order.userId },
		});
		return { ...order, user };
	});

	const resolvePromise = await Promise.all(listOrders);
	return res.send({
		orders: resolvePromise,
		count: { total: total[0].total, actives },
	});
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

	const materialsData = await prisma.$queryRaw`
				select o.qr_code as OS, ok.kit_id as IDKit, ok.quantity as qtdKits, m.id as idMaterial, m.description, km.quantity as qtdMaterialporkits, m.unit as unit from \`Order\` o
        inner join
        OrdersKits ok on o.id = ok.order_id
        inner join KitMaterial km on km.kit_id = ok.kit_id
        inner join Material m on m.id = km.material_id
        where o.active=1 AND o.registerDay  >= ${
					start + ' 00:00:00.000'
				} AND o.registerDay <= ${end + ' 23:59:59.999'};
`;

	const multiplyItens = materialsData.reduce((iterable, item) => {
		const qtdMaterial = parseInt(item.qtdMaterialporkits);
		const qtdKit = parseInt(item.qtdKits);

		const mountObject = {
			id: item.idMaterial,
			description: item.description,
			quantity: qtdMaterial * qtdKit,
			unit: item.unit,
		};
		iterable.push(mountObject);
		return iterable;
	}, []);

	const reduceMaterialList = multiplyItens.reduce((iterable, item) => {
		if (!iterable.some((i) => i.id === item.id)) {
			iterable.push(item);
		}

		return iterable;
	}, []);
	const sumMaterials = reduceMaterialList.map((material) => {
		let sum = 0;
		multiplyItens.forEach((itemM) => {
			if (material.id === itemM.id) {
				sum += itemM.quantity;
			}
		});
		return { ...material, quantity: sum };
	});

	res.send(sumMaterials);
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
			photoStartWork: '',
			photoEndWork: '',
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
