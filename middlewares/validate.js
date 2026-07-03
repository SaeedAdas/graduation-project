const messages = require("../helper/messages");

const parseSchema = (res, schema, data) => {
	if (schema == null) {
		return {
			success: true,
			data
		}
	}

	const result = schema.safeParse(data);

	if (!result.success) {
		console.log("issues: ", result.error.issues);
		console.log("error: ", result.error);
		console.log("message: ", result.error.issues.message);
		return {
			success: false,
			errors: { issues: result.error.issues.map((issue) => issue.message) }
		}
	}

	return {
		success: true,
		data: result.data
	}
};

const validate = (schemas) => {
	return (req, res, next) => {

		const validationTargets = {
			body: schemas.body,
			query: schemas.query,
			params: schemas.params
		}

		for (const [key, schema] of Object.entries(validationTargets)) {
			const result = parseSchema(res, schema, req[key]);

			if (!result.success) {
				return messages.badRequest(res, result.errors);
			}

			req[key] = result.data;
		}

		next();
	};
};

module.exports = { validate };
