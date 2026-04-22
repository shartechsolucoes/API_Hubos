import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

BigInt.prototype.toJSON = function () {
	const int = Number.parseInt(this.toString());
	return int ?? this.toString();
};

const BUSINESS_START = 8;  // 08:00
const BUSINESS_END = 18;   // 18:00

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
		type,
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
	const osType = parseInt(type);

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
			type: osType,
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
		type,
		qr_code,
		registerDay,
		protocolNumber,
		photoEndWork,
		photoStartWork,
	} = req.body;

	const date = new Date().toLocaleString('sv-SE', {
		timeZone: 'America/Sao_Paulo',
	});
	const tzoffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds
	const localISOTime = new Date(Date.now() - tzoffset).toISOString();

	const osCode = parseInt(qr_code);
	const osStatus = parseInt(status);
	const osType = parseInt(type);
	const dataToUpdate = {
		address,
		neighborhood,
		city,
		state,
		status: osStatus,
		observations,
		lat,
		long,
		type: osType,
		qr_code: osCode,
		protocolNumber,
		photoEndWork,
		updateDay: localISOTime,
		photoStartWork,
	};

	if (registerDay) {
		const parsedRegisterDay = new Date(registerDay);

		if (Number.isNaN(parsedRegisterDay.getTime())) {
			return res.status(400).send({ error: 'Data de registro inválida' });
		}

		dataToUpdate.registerDay = parsedRegisterDay;
	}

	const newOrder = await prisma.order.update({
		where: { id: orderId },
		data: dataToUpdate,
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
	let whereActive = "o.active = 1"; // padrão: só ativos

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

	if (userId && userId !== '' && user.access_level !== 0 && user.access_level !== 1 && user.access_level !== 99 && user.access_level !== 4) {
		querySearch += ` AND o.userId = '${userId}'`;
	}

	if (user.access_level === 99) {
		whereActive = "1=1"; // traz todos (ativos e inativos)
	}


	const listOs = await prisma.$queryRawUnsafe(
		`SELECT
			 o.*,
			 k.description AS ordersKits
		 FROM \`Order\` o
				  LEFT JOIN OrdersKits ok ON ok.order_id = o.id
				  LEFT JOIN Kit k ON k.id = ok.kit_id
		 WHERE ${whereActive}
			 ${querySearch}
		 GROUP BY o.id
		 ORDER BY o.id DESC
			 ${queryPagination};`
	);

	const [total, actives] = await prisma.$transaction([
		prisma.$queryRawUnsafe(
			`SELECT COUNT(*) as total
			 FROM \`Order\` o
			 WHERE ${whereActive} ${querySearch};`
		),
		prisma.order.count({ where: { active: true } }), // sempre conta só os ativos
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

export const ordersReports = async (req, reply) => {
	try {
		const { start, end } = req.query;

		if (!start || !end) {
			return reply.code(400).send({
				msg: 'Período inicial e final são obrigatórios',
			});
		}

		const startDate = new Date(`${start}T00:00:00`);
		const endDate = new Date(`${end}T23:59:59`);

		/* =========================
		   OS CRIADAS (DETALHADAS)
		========================= */
		const createdOrders = await prisma.order.findMany({
			where: {
				active: true,
				registerDay: {
					gte: startDate,
					lte: endDate,
				},
			},
			select: {
				registerDay: true,
				neighborhood: true,
			},
		});

		let createdOutsideBusinessHours = 0;

		const outsideByNeighborhood = {};

		for (const order of createdOrders) {
			const date = new Date(order.registerDay);

			// dia da semana (0 = domingo, 6 = sábado)
			const day = date.getDay();
			const hour = date.getHours();

			const isWeekend = day === 0 || day === 6;
			const isOutsideHours =
				hour < BUSINESS_START || hour >= BUSINESS_END;

			if (isWeekend || isOutsideHours) {
				createdOutsideBusinessHours++;

				if (order.neighborhood) {
					outsideByNeighborhood[order.neighborhood] =
						(outsideByNeighborhood[order.neighborhood] || 0) + 1;
				}
			}
		}

		/* =========================
		   AGRUPAMENTOS PADRÃO
		========================= */
		const dateFilter = {
			registerDay: {
				gte: startDate,
				lte: endDate,
			},
		};

		const created = await prisma.order.groupBy({
			by: ['neighborhood'],
			where: {
				active: true,
				...dateFilter,
			},
			_count: { _all: true },
		});

		const duplicated = await prisma.order.groupBy({
			by: ['neighborhood'],
			where: {
				duplicated: true,
				...dateFilter,
			},
			_count: { _all: true },
		});

		const deleted = await prisma.order.groupBy({
			by: ['neighborhood'],
			where: {
				active: false,
				...dateFilter,
			},
			_count: { _all: true },
		});

		const neighborhoods = new Set([
			...created.map((i) => i.neighborhood),
			...duplicated.map((i) => i.neighborhood),
			...deleted.map((i) => i.neighborhood),
		]);

		const report = Array.from(neighborhoods).map((bairro) => ({
			neighborhood: bairro,
			created:
				created.find((i) => i.neighborhood === bairro)?._count._all ??
				0,
			duplicated:
				duplicated.find((i) => i.neighborhood === bairro)?._count
					._all ?? 0,
			deleted:
				deleted.find((i) => i.neighborhood === bairro)?._count._all ??
				0,
			outsideBusinessHours:
				outsideByNeighborhood[bairro] ?? 0,
		}));

		return reply.send({
			period: { start, end },
			total: {
				created: createdOrders.length,
				duplicated: report.reduce((s, i) => s + i.duplicated, 0),
				deleted: report.reduce((s, i) => s + i.deleted, 0),
				createdOutsideBusinessHours,
			},
			byNeighborhood: report,
		});
	} catch (error) {
		console.error(error);
		return reply.code(500).send({
			msg: 'Erro ao gerar relatório',
		});
	}
};


