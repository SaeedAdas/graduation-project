const { z } = require("zod");

const id = z.object({
	id: z
	    .coerce
  	    .number("id must be a number")
	    .int("id must be an integer")
	    .min(1, "ID must be greater than 0")
});

const black_listed_admins = z.object({
	id: z
	    .coerce
  	    .number("id must be a number")
	    .int("id must be an integer")
	    .min(1, "ID must be greater than 0")
	    .refine((id) => id !== 1, {
		message: "User id 1 cannot be changed or deleted"
	    })
});

const black_listed_categories = z.object({
	id: z
	    .coerce
  	    .number("id must be a number")
	    .int("id must be an integer")
	    .min(1, "ID must be greater than 0")
	    .refine((id) => id !== 1, {
		message: "Category id 1 cannot be changed or deleted"
	    })
});

const post_id = z.object({
	post_id: z
	    .coerce
  	    .number("id must be a number")
	    .int("id must be an integer")
	    .min(1, "ID must be greater than 0")
});


module.exports = {
	id,
	post_id,
	black_listed_admins,
	black_listed_categories
};
