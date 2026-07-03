const { z } = require("zod");

const commentSchema = z.object({
	content: z
		.string("Content must be a string")
		.min(3, "Minimum length of content is 3")
		.max(500, "Maxmimum length of content is 500"),
	rating: z
		.coerce
		.number("Rating must be a number")
		.min(0, "Minimum rating is 0")
		.max(5, "Maxmimum rating is 5")
		.default(0) 
}).strict();

const create = commentSchema;

const update = commentSchema;

module.exports = {
	create,
        update
};
