const { z } = require("zod");

const searchableFields = ["description", "title"];

const pagination_search = {
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
			.optional()
};

const post = z
	.object({
		...pagination_search,
		searchIn: z
			.enum(searchableFields, "Please input a valid search field: title, description")
			.optional(),
		category: z
			.string("Please input the category name")
			.min(3, "Category should be at least 3 characters")
			.optional(),
	})
	.refine(
		(data) => data.page && data.limit, 
		{
			message: "Page and limit must be provided together"
		}
	)
	.refine(
		(data) => !data.searchIn || !!data.search, // !!data.search always returns a boolean
		{
			message: "Search query parameter must be provided if searchIn is provided"
		}
	);

const postDetails = z.object({
		commentsPage: z
			.coerce
			.number("Comments page query must be a number")
			.int("Comments page query must be an integer")
			.min(1, "Comments page should be at least 1")
			.optional(),
		commentsLimit: z
			.coerce
			.number("Comments limit query must be a number")
			.int("Comments limit query must be an integer")
			.min(1, "Comments limit should be at least 1")
			.optional()
});

const category = z.object(pagination_search);


const report = z.object(pagination_search);

module.exports = {
	post,
	postDetails,
	category,
	report
};
