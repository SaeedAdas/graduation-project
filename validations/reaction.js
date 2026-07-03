const { z } = require("zod");

// preprocess lets you modify input before going to the parser
const reactionSchema = z.preprocess(
	(value) => value === "" ? undefined : value, // we modify the empty string to be undefined because Number("") is 0 in javascript
	z.coerce // coerce.number runs Number(input)
	.number({
		error: (issue) =>
		issue.input === undefined
			? "Reaction is required"
		        : "Reaction must be a number"
	})
	.int("Reaction must be an integer")
	.min(0, "Reaction must be at least 0")
	.max(100, "Reaction must be at most 100")
);

const create = z.object({
	reaction: reactionSchema
}).strict();

const update = z.object({
	reaction: reactionSchema
}).strict();

module.exports = {
	create,
        update
};
