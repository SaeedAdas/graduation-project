const { z } = require("zod");

const categorySchema = z.object({
	name: z
		.string("name must be a string")
		.min(3, "Minimum length of name is 3")
		.max(20, "Maxmimum length of name is 20"),
	description: z
		.string("description must be a string")
		.min(8, "Minimum length of description is 8")
		.max(500, "Maxmimum length of description is 500"),
}).strict();

const create = categorySchema;

const update = categorySchema;

module.exports = {
	create,
        update
};
