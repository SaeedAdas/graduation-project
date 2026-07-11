const redis = require("../config/redis");

async function rateLimit(limit, window, identifier, scope) {
	return (req, res, next) => {

		const windowMs = window * 1000;
		const windowId = Math.floor(Date.now() / windowMs);

		const key = `rl:${scope}:${identifier}:${windowId}`

		const transaction = redis.multi();

		transaction.incr(key);
		transaction.expire(key, ttl);

		const results = await transaction.exec();

		const record = await redis.get(identifier); 	
	}
}

module.exports = { rateLimit };
