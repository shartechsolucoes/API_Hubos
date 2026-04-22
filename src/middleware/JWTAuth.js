export async function verifyJwt(request, reply) {
	try {
		await request.jwtVerify();

		if (request.user && !request.user.id && request.user.sub) {
			request.user.id = request.user.sub;
		}
	} catch (err) {
		return reply
			.status(401)
			.send({ message: 'Informe o token de acesso devidamente.' });
	}
}
