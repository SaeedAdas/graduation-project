const { z } = require("zod");

function hasIncreasingDigitSequence(password, minLength = 4) {
	let count = 1;

	const isNumber = (string) => {
		return /\d/.test(string);
	}

  	for (let i = 1; i < password.length; i++) {
    		const prev = password[i - 1];
    		const curr = password[i];

    		if (isNumber(prev) && isNumber(curr) && Number(curr) === Number(prev) + 1) {
      			count++;

      			if (count >= minLength) {
        			return true;
      			}
    		} else {
      			count = 1;
    		}
  	}

  	return false;
}

const passwordSchema = z
	.string("Password must be a string")
	.min(8, "Password must be at least 8 characters")
	.regex(/[A-Z]/, "Password must contain a capital english letter")
	.regex(/[a-z]/, "Password must contain a small english letter")
	.regex(/\d/, "Password must contain a number")
	.regex(/[^A-Za-z0-9\s]/, "Password must contain a special character")
	.refine(
    		(password) => !hasIncreasingDigitSequence(password, 4),
    		"Password cannot contain 4 or more increasing numbers in sequence"
  	)

const register = z.object({
	full_name: z
		.string("Full name must be a string")
		.min(3, "Minimum length of full name is 3"),
	email: z.email("Must follow email format username@domain.tld"),
	password: passwordSchema
});

const login = z.object({
	email: z.email("Must follow email format username@domain.tld"),
	password: passwordSchema,
	rememberMe: z.boolean("rememberMe must be a boolean")
});

const update = z.object({
	full_name: z.string("Full name must be a string"),
	phone: z.string("Phone must be a string").regex(/^(?:\+97[02]5[69]\d{7}|05[69]\d{7})$/, {
  			message: "Invalid phone number, must start with 056 or 059 or +97259 or +97256 followed by 7 numbers"
		}),
	city: z.string("City must be a string"),
	bio: z
	     .string("Bio must be a string")
	     .max(1500, "Bio must be 1500 characters or less"),
	birthdate: z.iso.date({
    		error: "Birthdate must be in YYYY-MM-DD format"
  	})
});

module.exports = {
	register,
        login,
	update
};
