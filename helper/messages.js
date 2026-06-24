// Success codes with 200+

exports.success = (res, message = "Operation successful") => {
	res.status(200).json({
		message: message 
	});
};

exports.createdSuccessfully = (res, message = "Created successfully") => {
	res.status(201).json({
		message: message 
	});
};

exports.deletedSuccessfully = (res) => {
	res.status(204).send();
};


// Errors with status 400+

exports.badRequest = (res, message = "Bad request") => {
	res.status(400).json({
		message: message 
	});
};

exports.Unauthenticated = (res, message = "Unauthenticated") => {
	res.status(401).json({
		message
	});
};

exports.Unauthorized = (res, message = "Forbidden") => {
	res.status(403).json({
		message
	});
};

exports.notFound = (res, message = "Not found") => {
	res.status(404).json({
		message: message 
	});
};

exports.alreadyExists = (res, message = "Already exists") => {
	res.status(409).json({
		message: message 
	});
};

// Server errors with 500+
exports.serverError = (res, message = "Server Error") => {
	res.status(500).json({
		message: message
	});
};

exports.notImplemented = (res) => {
	res.status(501).json({
		message: "Not Implemented"
	});
};
