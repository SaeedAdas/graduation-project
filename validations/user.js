const { z } = require("zod");

const register = z.object({
	full_name: z.string().min(3),
	email: z.email(),
	password: z.string().min(8)
});

const login = z.object({
	email: z.email(),
        password: z.string().min(8)
});

const update = z.object({
	full_name: z.string(),
	phone: z.string().regex(/^(?:\+97[02]5[69]\d{7}|05[69]\d{7})$/, {
  		message: "Invalid phone number, must start with 056 or 059 or +97259 or +97256 followed by 7 numbers"
	}),
	city: z.string(),
	bio: z.string().max(1500, "Bio must be 1500 characters"),
	birthdate: z.iso.date({
    		error: "Birthdate must be in YYYY-MM-DD format"
  	})
});

module.exports = {
	register,
        login,
	update
};
