const prisma = require("../config/connection");
const messages = require('../helper/messages');

async function authenticate(req, res, next) {
	const userId = req.session?.user_id;	

	if (!userId) {
		return messages.Unauthenticated(res);
	}

	try {
		// Handles user deletion and roles changing after authentication
		const user = await prisma.user.findUnique({
			where: {id: userId}
		});
	
		if (!user) {
			return messages.Unauthenticated(res);
		}
	
		req.user = {
			...user,
			birthdate: user.birthdate?.toISOString().slice(0, 10) ?? null
		}

		next();
	} catch (error) {
		next(error);
	}
}

module.exports = { authenticate };
