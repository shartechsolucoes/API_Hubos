import { PrismaClient } from '@prisma/client';

import * as fs from 'fs';
import path, { dirname } from 'path';
import sharp from 'sharp';
import mime from 'mime-types';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

if (!fs.existsSync('./public/order')) {
	fs.mkdirSync('./public/order', { recursive: true });
}

// Utilitário para gerar o parseDate no momento do upload
const getParseDate = () => {
	const currentDate = new Date();
	const day = currentDate.getDate();
	const month = currentDate.getMonth() + 1; // +1 pois getMonth() começa em 0
	const year = currentDate.getFullYear();
	const time = currentDate.getTime();
	return `${day}-${month}-${year}_${time}`;
};

// Utilitário para garantir que o diretório existe
const ensureDir = (dirPath) => {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
	}
};

// Utilitário para processar e salvar imagem como WebP
const saveImageAsWebp = (fileStream, outputPath) => {
	return new Promise((resolve, reject) => {
		const writeStream = fs.createWriteStream(outputPath);
		fileStream
			.pipe(
				sharp()
					.toFormat('webp')
					.on('error', (err) => {
						console.error('Erro ao processar imagem para WebP:', err);
						reject(err);
					})
			)
			.pipe(writeStream);

		writeStream.on('finish', resolve);
		writeStream.on('error', reject);
	});
};

export const insertStartPhoto = async (req, res) => {
	const parts = req.parts();
	const { id, os } = req.query;

	ensureDir(`./public/order/${os}`);

	const parseDate = getParseDate();

	for await (const part of parts) {
		if (!part.file) {
			return res.send({ error: 'Nenhum arquivo encontrado.' });
		}

		const fileType = mime.lookup(part.filename);
		if (!fileType || !fileType.startsWith('image/')) {
			return res.send({ error: 'O arquivo enviado não é uma imagem válida.' });
		}

		const webpFilename = `start-${parseDate}.webp`;
		const webpPath = path.join('public', 'order', os, webpFilename);
		const publicPath = `/images/order/${os}/${webpFilename}`;

		try {
			await saveImageAsWebp(part.file, webpPath);

			if (id) {
				await prisma.order.update({
					where: { id: parseInt(id) },
					data: {
						photoStartWork: publicPath,
						status: 1,
					},
				});
			}

			return res.send({
				message: 'Arquivo enviado com sucesso!',
				file: publicPath,
			});
		} catch (error) {
			console.error('Erro ao processar a imagem:', error);
			return res.send({ error: 'Erro ao processar a imagem, por favor, tente novamente.' });
		}
	}
};

export const insertEndPhoto = async (req, res) => {
	const parts = req.parts();
	const { id, os } = req.query;

	ensureDir(`./public/order/${os}`);

	const parseDate = getParseDate();

	for await (const part of parts) {
		if (!part.file) {
			return res.send({ error: 'Nenhum arquivo encontrado.' });
		}

		const fileType = mime.lookup(part.filename);
		if (!fileType || !fileType.startsWith('image/')) {
			return res.send({ error: 'O arquivo enviado não é uma imagem válida.' });
		}

		const webpFilename = `end-${parseDate}.webp`;
		const webpPath = path.join('public', 'order', os, webpFilename);
		const publicPath = `/images/order/${os}/${webpFilename}`;

		try {
			await saveImageAsWebp(part.file, webpPath);

			if (id) {
				await prisma.order.update({
					where: { id: parseInt(id) },
					data: {
						photoEndWork: publicPath,
						status: 2,
					},
				});
			}

			return res.send({
				message: 'Arquivo enviado com sucesso!',
				file: publicPath,
			});
		} catch (error) {
			console.error('Erro ao processar a imagem:', error);
			return res.send({ error: 'Erro ao processar a imagem, por favor, tente novamente.' });
		}
	}
};