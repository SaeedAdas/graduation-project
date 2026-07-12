const redis = require("../config/redis");
const messages = require("../helper/messages");

async function rateLimit(limit, window, identifier, scope) {
	try {
		// Implemented Fixed-window algorithm
		const now = Date.now()
		const windowMs = window * 1000;
		const windowId = Math.floor(now / windowMs);
		const windowEnd = (windowId + 1) * windowMs;

		const key = `rl:${scope}:${identifier}:${windowId}`

		const ttlSeconds = Math.max(
        		1,
        		Math.ceil((windowEnd - now) / 1000)
    		);

		// Atomic lua script to prevent calling expire after each increment 
		const RATE_LIMIT_SCRIPT = `
    			local count = redis.call("INCR", KEYS[1])

    			if count == 1 then
        			redis.call("EXPIRE", KEYS[1], tonumber(ARGV[1]))
    			end

    			return count
		`;

		const count = Number(
			await redis.eval(
				RATE_LIMIT_SCRIPT, 
				[key], 
				[ttlSeconds]
			)
		);

		if (count > limit) return false;

		return true;

	} catch(error) {
		console.error("Error in rate limiting retrieval: ", error);

		return messages.serverError(res);
	}

}

const loginRateLimiter = async (req, res, next) => {
	const identifier = "ip:" + req.ip;
	const message = "Too many login requests";

	const isAllowed = await rateLimit(10, 3 * 60, identifier, "login");

	if (!isAllowed) return messages.rateLimit(res, message);
		
	return next();
};

module.exports = { 
	loginRateLimiter 
};

