const { z } = require("zod");

const id = z.object({
	id: z
	    .coerce
  	    .number("id must be a number")
	    .int("id must be an integer")
});

const post_id = z.object({
	post_id: z
	    .coerce
  	    .number("id must be a number")
	    .int("id must be an integer")
});


module.exports = {
	id,
	post_id
};
