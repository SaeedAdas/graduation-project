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

/* Implementing token bucket
 * const capacity = 20; // max tokens of bucket
 * const tokensPerSecond = 1; // tokens refill per second
 * const cost = 2; // Request cost
 * const key = `rl:token-bucket:${scope}:${identifier}`
 * const currentTimeMs = Date.now()
 * const idleTTLSeconds = Math.ceil(capacity / tokensPerSecond);
 * const TOKEN_BUCKET = `
 *	local allowed = 1
 *	local key = KEYS[1]
 *	local currentTimeMs = tonumber(ARGV[1])
 *	local bucketCapacity = tonumber(ARGV[2])
 *	local requestCost = tonumber(ARGV[3])
 *	local tokensPerSecond = tonumber(ARGV[4])
 *	local ttlSeconds = tonumber(ARGV[5])
 *
 *	local values = redis.call("HMGET", key, "tokens", "last_refill")
 *	local storedTokens = values[1]
 *	local lastRefillMs = values[2]
 *	
 *	if storedTokens == false or lastRefillMs == false then
 *		storedTokens = capacity
 *		lastRefillMs = currentTimeMs
 *	else
 *		storedTokens = tonumber(storedTokens)
 *		lastRefillMs = tonumber(lastRefillMs)
 *	end
 *
 *	local elapsedSeconds = math.max(0, (currentTimeMs - lastRefillMs) / 1000)
 *
 *	local earnedTokens = elapsedSeconds * tokensPerSecond
 *
 *	local availableTokens = math.min(capacity, storedTokens + earnedTokens)
 *	local remainingTokens = availableTokens - requestCost
 *
 *	if remainingTokens >= 0
 *		redis.call("HSET", key, "tokens", remainingTokens, "last_refill", currentTimeMs)
 *	else 
 *		redis.call("HSET", key, "tokens", availableTokens, "last_refill", currentTimeMs)
 *		allowed = 0
 *	end
 *
 *	redis.call("EXPIRE", key, ttlSeconds)
 *
 * 	return allowed
 * `;
 * return redis.eval(TOKEN_BUCKET, [key], [currentTimeMs, capacity, cost, tokensPerSecond, idleTTLSeconds])
 */

module.exports = { 
	loginRateLimiter 
};

