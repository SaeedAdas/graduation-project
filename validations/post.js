const { z } = require("zod");

// without .strict(), extra fields are stripped down, with .strict() validation error is returned
const postSchema = z.object({
	category: z
		.string("Category must be a string")
		.min(3, "Minimum length of category is 3")
		.max(20, "Maxmimum length of category is 20"),
	title: z
		.string("Title must be a string")
		.min(5, "Minimum length of title is 5")
		.max(100, "Maximum length of title is 100"),
	description: z
		.string("Description must be a string")
		.min(8, "Minimum length of description is 8")
		.max(1000, "Maxmimum length of description is 1000")
		.optional()
});

const create = postSchema;

const update = postSchema;

module.exports = {
	create,
        update
};
