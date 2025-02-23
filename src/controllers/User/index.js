import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
const { hashSync, genSaltSync, compareSync } = bcryptjs;

const prisma = new PrismaClient();

export const createUser = async (req, res) => {
	const { login, password, email, name, access_level, expiration, picture } =
		req.body;

	const level = parseInt(access_level);

	const salt = genSaltSync();
	const hash = hashSync(password, salt);

	const user = await prisma.user.findFirst({
		where: {
			login,
		},
	});

	if (user) {
		return res.status(400).send({ err: 'Used User name' });
	}

	const newUser = await prisma.user.create({
		data: {
			login,
			password: hash,
			name,
			access_level: level,
			expiration: 0,
			picture: '',
			email,
		},
	});

	return res.status(201).send({ msg: `User ${newUser.login} created` });
};

export const login = async (req, res) => {
	const { login, password } = req.body;

	const user = await prisma.user.findFirst({
		where: {
			login,
		},
	});

	if (!user) {
		return res.status(400).send({ err: 'User not found' });
	}

	const correctUser = compareSync(password, user.password);

	if (!correctUser) {
		return res.status(400).send({ err: 'Incorrect Password' });
	}

	try {
		const token = await res.jwtSign(
			{ login: user.login },
			{ sign: { sub: user.id } }
		);
		return res.send({ token, access_level: user.access_level, userId: user.id });
	} catch (err) {
		return res.status(400).send({ msg: 'Internal error', err });
	}
};

export const getUsers = async (req, res) => {
	const users = await prisma.user.findMany({
		omit: { password: true },
	});

	return res.send(users);
};

export const getUser = async (req, res) => {
	const { id } = req.params;
	const user = await prisma.user.findFirst({
		where: { id },
		omit: { password: true },
	});

	res.send(user);
};

export const updateUser = async (req, res) => {
	const { login, password, email, name, access_level, expiration, picture } =
		req.body;

	const { id } = req.params;

	const level = parseInt(access_level);
	// if (password) {
	// 	const salt = genSaltSync();
	// 	const hash = hashSync(password, salt);
	// }

	const user = await prisma.user.update({
		where: { id },
		data: {
			login,
			// password: hash,
			name,
			access_level: level,
			expiration: 0,
			picture: '',
			email,
		},
	});

	return res.status(201).send(user);
};
