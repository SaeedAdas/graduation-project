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

/*
 * Implementing sliding-window log
 * const crypto = require("crypto")
 * const key = `rl:${scope}:${identifier}`
 * const now = Date.now();
 * const windowMs = window * 1000; 
 * const uniqueMember = `${now}:${crypto.randomUUID()}`;
   const SLIDING_WINDOW_LOG = `
	local limit = tonumber(ARGV[1])
	local cutoff = tonumber(ARGV[2])
	local now = tonumber(ARGV[3])
	local member = ARGV[4]
	local ttlSeconds = tonumber(ARGV[5])

	local allowed = 1

   	redis.call("ZREMRANGEBYSCORE", KEYS[1], 0, cutoff)

	local count = redis.call("ZCARD", KEYS[1])

   	if count < limit then
		redis.call("ZADD", KEYS[1], now, member)
	else 
		allowed = 0
   	end
	
	redis.call("EXPIRE", KEYS[1], ttlSeconds)

	if allowed == 1 then
   		return {allowed, count + 1}
	else
   		return {allowed, count}
	end
   `;

   return redis.eval(SLIDING_WINDOW_LOG, [key], [limit, now - windowMs, now, uniqueMember, window]) 
 */




/* Implenting Sliding-window counter
 * const now = Date.now();
 * const windowMs = window * 1000; 
 * const windowId = Math.floor(now / windowMs);
 * const currentWindowProgressPercentage = (now / windowMs) - windowId;
 * const overlapRatio = 1 - currentWindowProgressPercentage;
 * const ttlSeconds = Math.floor( window * (1 + overlapRatio)); // time-to-live seconds for each window
 * const currentWindowKey = `rl:${scope}:${identifier}:${windowId}`
 * const previousWindowKey = `rl:${scope}:${identifier}:${windowId - 1}`
 *
 * const SLIDING_WINDOW_COUNTER = `
 * 	local allowed = 1
 * 	local currentWindowKey = KEY[1]
 * 	local previousWindowKey = KEY[2]
 * 	local overlapRatio = tonumber(ARGV[1])
 * 	local ttlSeconds = tonumber(ARGV[2])
 * 	local limit = tonumber(ARGV[3])
 * 	local currentCount = tonumber(redis.call("GET", currentWindow) or "0")
 * 	local previousCount = tonumber(redis.call("GET", previousWindow) or "0")
 *
 * 	local estimatedCount = ( previousCount * overlapRatio ) + currentCount
 *
 * 	if estimatedCount + 1 <= limit then
 * 		currentCount = redis.call("INCR", currentWindow)
 *		redis.call("EXPIRE", currentWindowKey, ttlSeconds)
 * 		allowed = 1
 * 	else 
 * 		allowed = 0
 * 	end
 * 	
 * 	return {allowed, currentCount}
 * `;
 * return redis.eval(SLIDING_WINDOW_COUNTER, [currentWindowKey, previousWindowKey], [overlapRatio, ttlSeconds, limit]);
 */

module.exports = { 
	loginRateLimiter 
};

