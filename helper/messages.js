// Success codes with 200+

exports.success = (res, message = "Operation successful") => {
	return res.status(200).json({
		message
	});
};

exports.createdSuccessfully = (res, message = "Created successfully") => {
	return res.status(201).json({
		message
	});
};

exports.deletedSuccessfully = (res) => {
	return res.status(204).send();
};


// Errors with status 400+

exports.badRequest = (res, payload = "Bad request") => {
	if (typeof payload === "object") {
		return res.status(400).json(payload);
	}
	else { 
		return res.status(400).json({
			issues: [payload]
		});
	}
};

exports.Unauthenticated = (res, message = "Unauthenticated") => {
	return res.status(401).json({
		message
	});
};

exports.Unauthorized = (res, message = "Forbidden") => {
	return res.status(403).json({
		message
	});
};

exports.notFound = (res, message = "Not found") => {
	return res.status(404).json({
		message
	});
};

exports.alreadyExists = (res, message = "Already exists") => {
	return res.status(409).json({
		message
	});
};

exports.rateLimit = (res, message = "Too many requests") => {
	return res.status(429).json({
		message
	});
};

// Server errors with 500+
exports.serverError = (res, message = "Server Error") => {
	return res.status(500).json({
		message: message
	});
};

exports.notImplemented = (res) => {
	return res.status(501).json({
		message: "Not Implemented"
	});
};
