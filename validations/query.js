const { z } = require("zod");

const postFieldsEnum = ["description", "title"];

const post = z
	.object({
		page: z
			.coerce
			.number("Page query must be a number")
			.int("Page query must be an integer")
			.min(1, "Page should be at least 1")
			.optional(),
		limit: z
			.coerce
			.number("Limit query must be a number")
			.int("Limit query must be an integer")
			.min(1, "Limit should be at least 1")
			.optional(),
		search: z
			.string("Search must be a string")
			.optional(),
		searchIn: z
			.enum(postFieldsEnum)
			.optional(),
		category: z
			.coerce
			.number("Category must be a number")
			.int("Category must be an integer")
			.min(1, "Category should be at least 1")
			.optional(),
	})
	.refine(
		(data) => (data.page === undefined) === (data.limit === undefined),
		{
			message: "Page and limit must be provided together or discarded together"
		}
	);


module.exports = {
	post
};
