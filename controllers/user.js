const bcrypt = require("bcryptjs"); const { UserStatus } = require("@prisma/client"); const prisma = require("../config/connection"); const messages = 
require("../helper/messages"); const { rotateCsrfToken } = require("../middlewares/csrf");

const HASH_COST_FACTOR = 12;

/** * @openapi * /auth/login: * post: * summary: Login user * description: Authenticates a user, regenerates the session, stores user data in the session, and returns a CSRF 
 token. * tags: * - Auth * requestBody: * required: true * content: * application/json: * schema: * type: object * required: * - email * - password * properties: * email: * 
 type: string * format: email * example: user@example.com * password: * type: string * format: password * example: StrongPassword123 * rememberMe: * type: boolean * example: 
 true * responses: * 200: * description: Login successful * content: * application/json: * schema: * type: object * properties: * message: * type: string * example: Login 
 Successful * csrfToken: * type: string * example: csrf-token-value * 400: * description: Invalid email or password / validation error * 500: * description: Internal server 
 error */
const login = async (req, res) => { try {
		const isAuthenticated = req.session.user_id;
		
		if (isAuthenticated) { return messages.alreadyExists(res, "You are already logged in.");
		}

		const { email, password, rememberMe } = req.body;

		const user = await prisma.user.findUnique({ where: { email }, select: {
				id: true, full_name: true, email: true, password: true, role: true, status: true
			}
		});

		if (!user) { return messages.badRequest(res, "Invalid email or password");
		}

		const passwordMatches = await bcrypt.compare(password, user.password);

		if (!passwordMatches) { return messages.badRequest(res, "Invalid email or password");
		}

		if (user.status == UserStatus.Inactive) { return messages.Unauthorized(res, "Your account is disabled");
		}

		// Regenerating session instead of updating existing one
		req.session.regenerate((error) => { if (error) {
				return messages.serverError(res);
			}

			req.session.user_id = user.id;

			const csrfToken = rotateCsrfToken(req);

			// make session temporary
			if (!rememberMe) { req.session.cookie.maxAge = null;
			}

			req.session.save((error) => { if (error) {
					return messages.serverError(res);
				}

				return res.json({ message: "Login Successful", csrfToken
				});
			});
		});


	} catch (error) {
		console.error("login error:", error);

		return messages.serverError(res);
	}
};

/** * @openapi * /user/register: * post: * summary: Register user * description: Creates a new user account after checking that the email is not already registered. * tags: * 
 - Users * requestBody: * required: true * content: * application/json: * schema: * type: object * required: * - full_name * - email * - password * properties: * full_name: * 
 type: string * example: Ahmad Ali * email: * type: string * format: email * example: user@example.com * password: * type: string * format: password * example: 
 StrongPassword123 * responses: * 201: * description: Account created successfully * content: * application/json: * schema: * type: object * properties: * message: * type: 
 string * example: Account created successfully * 400: * description: Bad request / validation error * 409: * description: Email already exists * 500: * description: Internal 
 server error */

const register = async (req, res) => { try {
		const { full_name, email, password } = req.body;

		const existingUser = await prisma.user.findUnique({where: { email }});

		if (existingUser) { return messages.alreadyExists(res, "Email already exists");
		}

		const hashedPassword = await bcrypt.hash(password, HASH_COST_FACTOR);

		const user = await prisma.user.create({ data: {
				full_name, email, password: hashedPassword
			},
			select: { id: true, full_name: true, email: true
			}
		});

		return messages.createdSuccessfully(res, "Account created successfully");

	} catch (error) {
		console.error("Register error:", error);

		return messages.serverError(res);
	}
};

/** * @openapi * /user/profile: * get: * summary: Get user profile * description: Returns the profile information of the currently authenticated user. * tags: * - Users * 
 security: * - cookieAuth: [] * responses: * 200: * description: Profile loaded successfully * content: * application/json: * schema: * type: object * properties: * 
 full_name: * type: string * example: Ahmad Ali * email: * type: string * format: email * example: user@example.com * phone: * type: string * nullable: true * example: 
 "+970599000000" * birthdate: * type: string * format: date * nullable: true * example: "2000-01-15" * bio: * type: string * nullable: true * example: Software engineering 
 student. * city: * type: string * nullable: true * example: Gaza * 401: * description: Unauthenticated * 500: * description: Internal server error */

const profile = async (req, res) => { try {

		const full_name = req.user.full_name; const email = req.user.email; const phone = req.user.phone; const birthdate = req.user.birthdate; const bio = 
		req.user.bio; const city = req.user.city;

		const user = {full_name, email, phone, birthdate, bio, city};

		res.json(user);

	} catch (error) {
		console.error("Retrieving Profile error:", error);

		return messages.serverError(res);
	}
};

/** * @openapi * /user/profile: * put: * summary: Update a user profile * description: Updates user profile data * tags: * - User * security: * - cookieAuth: [] * 
 requestBody: * required: true * content: * application/json: * schema: * type: object * properties: * full_name: * type: string * example: Ahmad mohammed * phone: * type: 
 string * example: "+970599000000" * birthdate: * type: string * format: date * example: "2000-01-15" * bio: * type: string * example: Software engineering student. * city: * 
 type: string * example: Gaza * responses: * 200: * description: User profile updated successfully * content: * application/json: * schema: * type: object * properties: * 
 message: * type: string * example: User profile updated successfully * 400: * description: Bad request / validation error * 500: * description: Server Error */

const update_profile = async (req, res) => { try {

		const id = req.user.id;

		const { full_name, phone, birthdate, city, bio } = req.body;

		const user = await prisma.user.update({ where: {id}, data: {
				full_name, phone, birthdate, city, bio
			}
		});

		return messages.success(res, "User profile updated successfully");

	} catch (error) {
		if ( error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
    		) {
      			return messages.alreadyExists(res, "Phone already exists");
    		}
		console.error("Updating Profile error:", error);

		return messages.serverError(res);
	}
};

/**
 * @openapi
 * /user/posts:
 *   get:
 *     summary: Get current user's posts
 *     description: Returns posts created by the authenticated user with optional pagination, search, and category filtering.
 *     tags:
 *       - Users
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *         description: Page number. Use with limit.
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           example: 10
 *         description: Number of posts per page. Use with page.
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *           example: laptop
 *         description: Search term.
 *       - in: query
 *         name: searchIn
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - title
 *             - description
 *           example: title
 *         description: Field to search in. If omitted, title and description are searched.
 *       - in: query
 *         name: category
 *         required: false
 *         schema:
 *           type: integer
 *           example: 3
 *         description: Category ID.
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                     example: Post title
 *                   category:
 *                     type: string
 *                     example: Electronics
 *                   description:
 *                     type: string
 *                     example: Post description
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2026-06-24T10:00:00.000Z"
 *                   _count:
 *                     type: object
 *                     properties:
 *                       comments:
 *                         type: integer
 *                         example: 3
 *                       reactions:
 *                         type: integer
 *                         example: 20
 *       401:
 *         description: Unauthenticated
 *       500:
 *         description: Internal server error
 */

const posts = async (req, res) => { try {

		const id = req.user.id;

		let { page, limit, search, searchIn, category } = req.query;

		const where = { userId: id
		};

		if (category !== undefined) { where.category_id = category;
		}

		if (search) { if (searchIn != undefined) {
				where[searchIn] = {
					contains: search, mode: "insensitive"
				}
			} else {
				where.OR = [ {
						title: {
							contains: search, mode: "insensitive"
						}
					},
					{ description: {
							contains: search, mode: "insensitive"
						}
					}
				]
			}
		}

		const queryOptions = { where, orderBy: {"createdAt": "desc"}, select: {
				title: true, category: true, description: true, createdAt: true, _count: {
					select: { comments: true, reactions: true
					}
				}
			}
		}

		if (page !== undefined && limit !== undefined) { queryOptions.skip = (page - 1) * limit; queryOptions.take = limit;
		}

	
		const posts = await prisma.post.findMany(queryOptions);

		const formattedPosts = posts.map((post) => ({ ...post, category: post.category.name
		}))

		return res.json(formattedPosts);

	} catch (error) {
		console.error("Retreiving my-posts error: ", error);

		return messages.serverError(res);
	}
};

/** * @openapi * /auth/logout: * post: * summary: Logout user * description: Destroys the current session and clears both the session cookie and CSRF cookie. * tags: * - Auth 
 * security: * - cookieAuth: [] * responses: * 200: * description: Logged out successfully * content: * application/json: * schema: * type: object * properties: * message: * 
 type: string * example: Logged out successfully * 401: * description: Unauthorized * 403: * description: Forbidden / invalid CSRF token * 500: * description: Internal server 
 error / could not logout */
const logout = (req, res) => { req.session.destroy((error) => {
		if (error) {
			return messages.serverError(res, "Could not logout");
		}

		res.clearCookie("sid", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
		});

		return res.json({ message: "Logged out successfully"
		});
	});
};

/** * @openapi * /user: * post: * summary: Add user * description: Creates a new user account after checking that the email is not already registered. * tags: * - Admin * 
 requestBody: * required: true * content: * application/json: * schema: * type: object * required: * - full_name * - email * - password * properties: * full_name: * type: 
 string * example: Ahmad mohammed * password: * type: string * example: StrongPassword@123 * email: * type: string * format: email * example: user@example.com * phone: * 
 type: string * example: "+970599000000" * birthdate: * type: string * format: date * example: "2000-01-15" * bio: * type: string * example: Software engineering student. * 
 city: * type: string * example: Gaza * role: * type: string * enum: * - User * - Admin * example: User * status: * type: string * enum: * - Active * - Inactive * example: 
 Active * * responses: * 201: * description: Account created successfully * content: * application/json: * schema: * type: object * properties: * message: * type: string * 
 example: Account created successfully * 400: * description: Bad request / validation error * 409: * description: Email already exists * 500: * description: Internal server 
 error */

const add = async (req, res) => { try {
		const { full_name, email, password, city, bio, birthdate, phone, role, status } = req.body;

		const hashedPassword = await bcrypt.hash(password, HASH_COST_FACTOR);

		const response = await prisma.user.create({ data: {
				full_name, email, password: hashedPassword, city, bio, birthdate, phone, role, status
			}
		});

		return messages.createdSuccessfully(res, "Account created successfully");

	} catch (error) {
		if ( error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
    		) {
      			return messages.alreadyExists(res, "Email or phone already exists");
    		}
		console.error("Adding user error:", error);

		return messages.serverError(res);
	}
};

/** * @openapi * /user/{id}: * put: * summary: Update a user account * description: Updates user account * tags: * - Admin * security: * - cookieAuth: [] * parameters: * - 
 in: path * name: id * required: true * schema: * type: integer * description: User ID * requestBody: * required: true * content: * application/json: * schema: * type: object 
 * properties: * full_name: * type: string * example: Ahmad mohammed * password: * type: string * example: StrongPassword@123 * email: * type: string * format: email * 
 example: user@example.com * phone: * type: string * example: "+970599000000" * birthdate: * type: string * format: date * example: "2000-01-15" * bio: * type: string * 
 example: Software engineering student. * city: * type: string * example: Gaza * role: * type: string * enum: * - User * - Admin * example: User * status: * type: string * 
 enum: * - Active * - Inactive * example: Active * responses: * 200: * description: User updated successfully * content: * application/json: * schema: * type: object * 
 properties: * message: * type: string * example: User updated successfully * 400: * description: Bad request / validation error * 404: * description: User not found * 500: * 
 description: Server Error */

const update = async (req, res) => { try {
		const id = req.params.id;

		if (id == 1) { return messages.badRequest(res, "You can't update this user");
		}

		const { full_name, email, password, city, bio, birthdate, phone, role, status } = req.body;


		const hashedPassword = await bcrypt.hash(password, HASH_COST_FACTOR);

		const response = await prisma.user.update({ where: {
				id
			},
			data: { full_name, email, passowrd: hashedPassword, city, bio, birthdate, phone, role, status
			}
		});

		return messages.success(res, "Account updated successfully");

	} catch (error) {
		if ( error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
    		) {
      			return messages.alreadyExists(res, "Email or phone already exists");
    		}

		if (error instanceof Prisma.PrismaClientKnownRequestError) { if (error.code === "P2025") {
        			return messages.badRequest(res, "User not found");
      			}
		}

		console.error("Updating user error:", error);

		return messages.serverError(res);
	}
};

/** * @openapi * /users: * get: * summary: Get all users * description: Returns all users in the database * tags: * - Admin * security: * - cookieAuth: [] * responses: * 200: 
 * description: Users retrieved successfully * content: * application/json: * schema: * type: object * properties: * full_name: * type: string * example: Ahmad Ali * email: * 
 type: string * format: email * example: user@example.com * phone: * type: string * nullable: true * example: "+970599000000" * birthdate: * type: string * format: date * 
 nullable: true * example: "2000-01-15" * bio: * type: string * nullable: true * example: Software engineering student. * city: * type: string * nullable: true * example: 
 Gaza * role: * type: string * enym: * - Admin * - User * example: User * status: * type: string * enum: * - Active * - Inactive * example: Admin * createdAt: * type: 
 timestamp * 401: * description: Unauthenticated * 500: * description: Internal server error */

const get_all = async (req, res) => { try {

		const users = await prisma.user.findAll({ select: {
				id, full_name, email, city, bio, birthdate, phone, role, status, createdAt
			}
		});

		res.json(user);

	} catch (error) {
		console.error("Error retreiving all users: ", error);

		return messages.serverError(res);
	}
};

/** * @openapi * /user/{id}: * delete: * summary: Delete a user * description: Deletes an existing user by its id * tags: * - Admin * security: * - cookieAuth: [] * 
 parameters: * - in: path * name: id * required: true * schema: * type: integer * description: User ID * responses: * 204: * description: User deleted successfully * content: 
 * application/json: * schema: * type: object * properties: * message: * type: string * example: User deleted Successfully * 401: * description: Unauthorized * 403: * 
 description: Forbidden / invalid CSRF token * 404: * description: User not found * 500: * description: Internal server error */

const remove = async (req, res) => { try {
		const id = req.params.id;

		if (id == 1) { return messages.badRequest(res, "You can't delete this user");
		}

		await prisma.user.delete({where: {id}});

		return messages.deletedSuccessfully(res, "User deleted Successfully");

	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) { if (error.code === "P2025") {
        			return messages.badRequest(res, "User not found");
      			}
		}
		console.error("Deleting user error: ", error);

		return messages.serverError(res);
	}
};


module.exports = { login, register, profile, update_profile, logout, posts, add, update, remove, get_all
};
