const messages = require("../helper/messages");
const idPattern = /^\d{1,9}$/

const parseSchema = (res, schema, data) => {
	if (schema == null) {
		return {
			success: true,
			data
		}
	}

	const result = schema.safeParse(data);

	if (!result.success) {
		return {
			success: false,
			errors: result.error.issues
		}
	}

	return {
		success: true,
		data: result.data
	}
};

const validate = (schemas) => {
	return (req, res, next) => {
		/*
		const parameterKey = Object.keys(req.params)[0];
		if (parameterKey) {
			const id = req.params[parameterKey];

			if (id && !idPattern.test(id)) {
				return messages.badRequest(res, "Invalid parameter");
			}

			req.params[parameterKey] = Number(id);
		}
		*/

		const validationTargets = [
			"body": schemas.bodySchema,
			"query": schemas.querySchema,
			"params": schemas.paramsSchema
		]

		for (const [key, schema] of validationTargets) {
			const result = parseSchema(res, schema, req[key]);

			if (!result.success) {
				return messages.badRequest(res, result.errors);
			}

		}

		next();
	};
};

module.exports = { validate };
