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

const pagination_search_schema = z
	.object(pagination_search)
	.refine(
		(data) => (data.page === undefined) === (data.limit === undefined),
		{
			message: "Page and limit must be provided together or discarded together"
		}
	);

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
		(data) => (data.page === undefined) === (data.limit === undefined),
		{
			message: "Page and limit must be provided together or discarded together"
		}
	).refine(
		(data) => !data.searchIn || !!data.search, // !!data.search always returns a boolean
		{
			message: "Search query parameter must be provided if searchIn is provided"
		}
	);

const category = pagination_search_schema;

const report = pagination_search_schema;

module.exports = {
	post,
	category,
	report
};
