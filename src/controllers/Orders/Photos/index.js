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

const currentDate = new Date();
const day = currentDate.getDate();
const month = currentDate.getMonth();
const year = currentDate.getFullYear();
const time = currentDate.getTime();

const parseDate = day + '-' + month + '-' + year + '_' + time;

export const insertStartPhoto = async (req, res) => {
	const parts = req.parts();
	const { id, os } = req.query;
	console.log(os);

	if (!fs.existsSync(`./public/order/${os}`)) {
		fs.mkdirSync(`./public/order/${os}`, { recursive: true });
	}

	for await (const part of parts) {
		if (part.file) {
			const fileType = mime.lookup(part.filename);
			if (!fileType || !fileType.startsWith('image/')) {
				return res.send({
					error: 'O arquivo enviado não é uma imagem válida.',
				});
			}
			// const uploadPath = path.join('public', 'endWork', part.filename);
			const webpFilename = 'start-' + parseDate + '.webp';
			const webpPath = path.join('public', 'order', os, webpFilename);

			const writeStream = fs.createWriteStream(webpPath);

			// Usando o sharp para converter a imagem para WebP
			try {
				part.file
					.pipe(
						sharp()
							.toFormat('webp')
							.on('error', (err) => {
								console.error('Erro ao processar a imagem PNG para WebP:', err);
							})
					)
					.pipe(writeStream);
				await new Promise((resolve, reject) => {
					writeStream.on('finish', resolve);
					writeStream.on('error', reject);
				});
				if (id) {
					try {
						await prisma.order.update({
							where: { id: parseInt(id) },
							data: {
								photoStartWork: `/images/order/${os}/start-${parseDate}.webp`,
								status: 1,
							},
						});
					} catch (error) {
						console.error(error);
						return res.send({
							error: 'Erro ao vincular a imagem, por favor, tente novamente.',
						});
					}
				}
				res.send({
					message: 'Arquivo enviado com sucesso!',
					file: `/images/order/${os}/start-${parseDate}.webp`,
				});
			} catch (error) {
				console.error('Erro ao processar a imagem');
				console.error(error);
				return res.send({
					error: 'Erro ao processar a imagem, por favor, tente novamente.',
				});
			}

			// Espera o upload ser finalizado
		} else {
			res.send({ error: 'Nenhum arquivo encontrado.' });
		}
	}
};

export const insertEndPhoto = async (req, res) => {
	const parts = req.parts();
	const { id, os } = req.query;

	if (!fs.existsSync(`./public/order/${os}`)) {
		fs.mkdirSync(`./public/order/${os}`, { recursive: true });
	}

	for await (const part of parts) {
		if (part.file) {
			const fileType = mime.lookup(part.filename);
			if (!fileType || !fileType.startsWith('image/')) {
				return res.send({
					error: 'O arquivo enviado não é uma imagem válida.',
				});
			}
			// const uploadPath = path.join('public', 'endWork', part.filename);
			const webpFilename = 'end-' + parseDate + '.webp';
			const webpPath = path.join('public', 'order', os, webpFilename);

			const writeStream = fs.createWriteStream(webpPath);

			// Usando o sharp para converter a imagem para WebP
			try {
				part.file
					.pipe(
						sharp()
							.toFormat('webp')
							.on('error', (err) => {
								console.error('Erro ao processar a imagem PNG para WebP:', err);
							})
							.webp()
					)
					.pipe(writeStream);
				await new Promise((resolve, reject) => {
					writeStream.on('finish', resolve);
					writeStream.on('error', reject);
				});
				if (id) {
					console.log('entra');
					try {
						await prisma.order.update({
							where: { id: parseInt(id) },
							data: {
								photoEndWork: `/images/order/${os}/end-${parseDate}.webp`,
								status: 2,
							},
						});
					} catch (error) {
						console.error(error);
						return res.send({
							error: 'Erro ao vincular a imagem, por favor, tente novamente.',
						});
					}
				}
				await res.send({
					message: 'Arquivo enviado com sucesso!',
					file: `/images/order/${os}/end-${parseDate}.webp`,
				});
			} catch (error) {
				console.error('Erro ao processar a imagem');
				return res.send({
					error: 'Erro ao processar a imagem, por favor, tente novamente.',
				});
			}

			// Espera o upload ser finalizado
		} else {
			res.send({ error: 'Nenhum arquivo encontrado.' });
		}
	}
};
