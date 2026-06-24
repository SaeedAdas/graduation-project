const crypto = require("crypto");
const messages = require("../helper/messages");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function createCsrfToken() {
	return crypto.randomBytes(32).toString("base64url");
}

function getOrCreateCsrfToken(req) {
	if (!req.session) {
		return messages.Unauthenticated("Session middleware must be registered before CSRF middleware");
  	}

  	if (!req.session.csrfToken) {
    		req.session.csrfToken = createCsrfToken();
  	}

  	return req.session.csrfToken;
}

// a method to match csrf tokens
function constantTimeEqual(a, b) {
 	if (typeof a !== "string" || typeof b !== "string") {
    		return false;
  	}

  	const aBuffer = Buffer.from(a);
  	const bBuffer = Buffer.from(b);

  	if (aBuffer.length !== bBuffer.length) {
    		return false;
  	}

  	return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function csrfProtection(req, res, next) {
 	if (SAFE_METHODS.has(req.method)) {
    		return next();
  	}

  	if (!req.session) {
		return messages.Unauthenticated();
  	}

  	const sessionToken = req.session.csrfToken;
  	const requestToken = req.get("x-csrf-token");

  	if (!sessionToken || !requestToken || !constantTimeEqual(sessionToken, requestToken)) {
		return messages.Unauthorized("Invalid CSRF token");
  	}

  	return next();
}

function rotateCsrfToken(req) {
  	req.session.csrfToken = createCsrfToken();
  	return req.session.csrfToken;
}

module.exports = {
  	getOrCreateCsrfToken,
  	csrfProtection,
  	rotateCsrfToken
};
