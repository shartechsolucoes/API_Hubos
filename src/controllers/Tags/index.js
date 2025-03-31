import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createTags = async (req, res) => {
	const { start, end } = req.query;

	const qr_code = await prisma.$queryRaw`
		SELECT o.qr_code AS referenceCode FROM \`Order\` o

		UNION

		SELECT t.referenceCode AS referenceCode FROM  Tag t
	`;

	const newTags = [];

	for (let index = parseInt(start); index <= end; index++) {
		const haveInList = qr_code.some((qr) => qr.referenceCode === `${index}`);

		if (!haveInList) {
			newTags.push({ referenceCode: `${index}` });
		}
	}

	if (newTags.length > 0) {
		await prisma.tag.createMany({
			data: newTags,
		});
	}

	if (newTags.length === 0) {
		return res.code(403).send();
	}

	return res.send(newTags);
};

export const getTags = async (req, res) => {
	const { page } = req.query;

	let queryPagination = '';
	if (page && page !== '') {
		queryPagination += `LIMIT 10 OFFSET ${parseInt(page || 0) * 10}`;
	}
	const qr_code = await prisma.$queryRawUnsafe(
		`SELECT t.*, o.qr_code FROM Tag t LEFT JOIN \`Order\` o ON o.qr_code = t.referenceCode ${queryPagination};`
	);

	return res.send(qr_code);
};

export const updateRegisteredTags = async (req, res) => {
	const qr_code = await prisma.$queryRaw`
	SELECT cast(o.qr_code as VARCHAR(10)) AS referenceCode FROM \`Order\` o
`;

	qr_code.forEach(async (code) => {
		const finded = await prisma.tag.findFirst({
			where: { referenceCode: code.referenceCode },
		});

		if (finded === undefined) {
			await prisma.tag.create({
				data: { referenceCode: code.referenceCode },
			});
		}
	});
};
