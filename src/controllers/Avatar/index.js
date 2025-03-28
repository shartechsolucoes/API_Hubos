import { PrismaClient } from '@prisma/client';

import * as fs from 'fs';
import path, { dirname } from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

if (!fs.existsSync('./public/uploads')) {
	fs.mkdirSync('./public/uploads', { recursive: true });
}

export const postAvatar = async (req, res) => {
	const parts = req.parts();
	const { id } = req.query;

	for await (const part of parts) {
		if (part.file) {
			const uploadPath = path.join('public', 'uploads', part.filename);

			// Cria o diretório 'uploads' se não existir

			// Cria um stream de escrita para salvar o arquivo
			const writeStream = fs.createWriteStream(uploadPath);
			part.file.pipe(writeStream);

			// Espera o upload ser finalizado
			await new Promise((resolve, reject) => {
				writeStream.on('finish', resolve);
				writeStream.on('error', reject);
			});

			if (id) {
				await prisma.user.update({
					where: { id },
					data: { picture: `/images/${part.filename}` },
				});
			}

			res.send({
				message: 'Arquivo enviado com sucesso!',
				file: `/images/${part.filename}`,
			});
		} else {
			res.send({ error: 'Nenhum arquivo encontrado.' });
		}
	}
};
