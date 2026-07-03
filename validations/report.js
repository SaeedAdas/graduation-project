const { z } = require("zod");

const reportSchema = z.object({
        reason: z
		.string("Reasong must be a string")
		.min(8, "Minimum length of reason is 8")
		.max(1000, "Maxmimum length of reason is 1000")
}).strict();

const create = reportSchema;

const update = reportSchema;

module.exports = {
	create,
        update
};
