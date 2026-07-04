const { z } = require("zod");

// without .strict(), extra fields are stripped down, with .strict() validation error is returned
const postSchema = z.object({
	category: z
		.coerce
		.number("category must be a number")
		.int("category must be an integer")
		.min(1, "Category must be at least 1"),
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
