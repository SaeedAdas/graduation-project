const bcrypt = require("bcryptjs");
const { Prisma, UserStatus } = require("@prisma/client");
const prisma = require("../config/connection");
const messages = require("../helper/messages");
const postRepository = require("../repositories/postRepository");
const { handlePrismaError } = require("../helper/prismaErrors");
const { rotateCsrfToken } = require("../middlewares/csrf");

const HASH_COST_FACTOR = 12;

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticates a user, regenerates the session, stores the user ID in the session, and returns a CSRF token.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: StrongPassword123
 *               rememberMe:
 *                 type: boolean
 *                 default: false
 *                 example: true
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login Successful
 *                 csrfToken:
 *                   type: string
 *                   example: csrf-token-value
 *       400:
 *         description: Invalid email or password / validation error
 *       401:
 *         description: Account is disabled
 *       409:
 *         description: User is already logged in
 *       500:
 *         description: Internal server error
 */

const login = async (req, res) => {
	try {
		const isAuthenticated = req.session.user_id;

		if (isAuthenticated) {
			return messages.alreadyExists(res, "You are already logged in.");
		}

		const { email, password, rememberMe } = req.body;

		const user = await prisma.user.findUnique({
			where: { email },
			select: {
				id: true,
				full_name: true,
				email: true,
				password: true,
				role: true,
				status: true
			}
		});

		if (!user) {
			return messages.badRequest(res, "Invalid email or password");
		}

		const passwordMatches = await bcrypt.compare(password, user.password);

		if (!passwordMatches) {
			return messages.badRequest(res, "Invalid email or password");
		}

		if (user.status == UserStatus.Inactive) {
			return messages.Unauthorized(res, "Your account is disabled");
		}

		// Regenerating session instead of updating existing one
		req.session.regenerate((error) => {
			if (error) {
				return messages.serverError(res);
			}

			req.session.user_id = user.id;

			const csrfToken = rotateCsrfToken(req);

			// make session temporary
			if (!rememberMe) {
				req.session.cookie.maxAge = null;
			}

			req.session.save((error) => {
				if (error) {
					return messages.serverError(res);
				}

				return res.json({
					message: "Login Successful",
					csrfToken
				});
			});
		});
	} catch (error) {
		console.error("login error:", error);

		return messages.serverError(res);
	}
};

/**
 * @openapi
 * /user/register:
 *   post:
 *     summary: Register user
 *     description: Creates a new user account after checking that the email is not already registered.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - email
 *               - password
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: Ahmad Ali
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: StrongPassword123
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Account created successfully
 *       400:
 *         description: Bad request / validation error
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Internal server error
 */

const register = async (req, res) => {
	try {
		const { full_name, email, password } = req.body;

		const hashedPassword = await bcrypt.hash(password, HASH_COST_FACTOR);

		await prisma.user.create({
			data: {
				full_name,
				email,
				password: hashedPassword
			},
			select: {
				id: true,
				full_name: true,
				email: true
			}
		});

		return messages.createdSuccessfully(res, "Account created successfully");

	} catch (error) {
		const handled = handlePrismaError(res, error, {
			uniqueMessage: "Email already exists"
		});

		if (handled) return handled;

		console.error("Register error:", error);

		return messages.serverError(res);
	}
};

/**
 * @openapi
 * /user/profile:
 *   get:
 *     summary: Get user profile
 *     description: Returns the profile information of the currently authenticated user.
 *     tags:
 *       - Users
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Profile loaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 full_name:
 *                   type: string
 *                   example: Ahmad Ali
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: user@example.com
 *                 phone:
 *                   type: string
 *                   nullable: true
 *                   example: "+970599000000"
 *                 birthdate:
 *                   type: string
 *                   format: date
 *                   nullable: true
 *                   example: "2000-01-15"
 *                 bio:
 *                   type: string
 *                   nullable: true
 *                   example: Software engineering student.
 *                 city:
 *                   type: string
 *                   nullable: true
 *                   example: Gaza
 *       401:
 *         description: Unauthenticated
 *       500:
 *         description: Internal server error
 */

const profile = async (req, res) => {
	try {
		const full_name = req.user.full_name;
		const email = req.user.email;
		const phone = req.user.phone;
		const birthdate = req.user.birthdate;
		const bio = req.user.bio;
		const city = req.user.city;
		const role = req.user.role;

		const user = { full_name, email, phone, birthdate, bio, city, role };

		return res.json(user);

	} catch (error) {
		console.error("Retrieving Profile error:", error);

		return messages.serverError(res);
	}
};

/**
 * @openapi
 * /user/profile/{id}:
 *   get:
 *     summary: Get public user profile
 *     description: Returns the profile information of the requested id
 *     tags:
 *       - Users
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 2
 *         description: User ID
 *     responses:
 *       200:
 *         description: Profile loaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 full_name:
 *                   type: string
 *                   example: Ahmad Ali
 *                 phone:
 *                   type: string
 *                   nullable: true
 *                   example: "+970599000000"
 *                 birthdate:
 *                   type: string
 *                   format: date
 *                   nullable: true
 *                   example: "2000-01-15"
 *                 bio:
 *                   type: string
 *                   nullable: true
 *                   example: Software engineering student.
 *                 city:
 *                   type: string
 *                   nullable: true
 *                   example: Gaza
 *       401:
 *         description: Unauthenticated
 *       500:
 *         description: Internal server error
 */

const public_profile = async (req, res) => {
	try {
		const user_id = req.params.id;

		const user = await prisma.user.findUnique({
			where: {
				id: user_id
			},
			select: {
				full_name: true,
				phone: true,
				birthdate: true,
				bio: true,
				city: true,
				createdAt: true
			}
		});

		return res.json(user);

	} catch (error) {
		console.error("Retrieving public profile error:", error);

		return messages.serverError(res);
	}
};

/**
 * @openapi
 * /user/profile:
 *   put:
 *     summary: Update user profile
 *     description: Updates the current authenticated user's profile data.
 *     tags:
 *       - Users
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: Ahmad Mohammed
 *               phone:
 *                 type: string
 *                 nullable: true
 *                 example: "+970599000000"
 *               birthdate:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 example: "2000-01-15"
 *               bio:
 *                 type: string
 *                 nullable: true
 *                 example: Software engineering student.
 *               city:
 *                 type: string
 *                 nullable: true
 *                 example: Gaza
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User profile updated successfully
 *       400:
 *         description: Bad request / validation error
 *       401:
 *         description: Unauthenticated
 *       403:
 *         description: Forbidden / invalid CSRF token
 *       409:
 *         description: Phone already exists
 *       500:
 *         description: Internal server error
 */

const update_profile = async (req, res) => {
	try {
		const id = req.user.id;

		const { full_name, phone, birthdate, city, bio } = req.body;

		await prisma.user.update({
			where: { id },
			data: {
				full_name,
				phone,
				birthdate,
				city,
				bio
			}
		});

		return messages.success(res, "User profile updated successfully");
	} catch (error) {
		const handled = handlePrismaError(res, error, {
			uniqueMessage: "Phone already exists"
		});

		if (handled) return handled;

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
 *         description: Page number. Use together with limit.
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           example: 10
 *         description: Number of posts per page. Use together with page.
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
 *         description: Field to search in. If omitted, both title and description are searched.
 *       - in: query
 *         name: category
 *         required: false
 *         schema:
 *           type: String
 *           example: Electronics
 *         description: Category name.
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
 *                     nullable: true
 *                     example: Post description
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2026-06-24T10:00:00.000Z"
 *                   commentsCount:
 *                     type: number
 *                     example: 3
 *                   averageRating:
 *                     type: float
 *                     example: 4.2
 *                   reactionsCount:
 *                     type: number
 *                     example: 3
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */

const posts = async (req, res) => {
	try {
		const id = req.user.id;

		const condition = {
			userId: id	
		};

		const posts = await postRepository.listPostsWithStats({ ...req.query, currentUserId: id, condition: condition });

		return res.json(posts);

	} catch (error) {
		console.error("Retreiving current user posts error: ", error);

		return messages.serverError(res);
	}
};

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Destroys the current session and clears the session cookie.
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden / invalid CSRF token
 *       500:
 *         description: Internal server error / could not logout
 */

const logout = (req, res) => {
	req.session.destroy((error) => {
		if (error) {
			return messages.serverError(res, "Could not logout");
		}

		res.clearCookie("sid", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
		});

		return res.json({
			message: "Logged out successfully"
		});
	});
};

/**
 * @openapi
 * /user:
 *   post:
 *     summary: Add user
 *     description: Creates a new user account. Fails if the email or phone already exists.
 *     tags:
 *       - Admin
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - email
 *               - password
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: Ahmad Mohammed
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: StrongPassword@123
 *               phone:
 *                 type: string
 *                 nullable: true
 *                 example: "+970599000000"
 *               birthdate:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 example: "2000-01-15"
 *               bio:
 *                 type: string
 *                 nullable: true
 *                 example: Software engineering student.
 *               city:
 *                 type: string
 *                 nullable: true
 *                 example: Gaza
 *               role:
 *                 type: string
 *                 enum:
 *                   - User
 *                   - Admin
 *                 example: User
 *               status:
 *                 type: string
 *                 enum:
 *                   - Active
 *                   - Inactive
 *                 example: Active
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Account created successfully
 *       400:
 *         description: Bad request / validation error
 *       401:
 *         description: Unauthenticated
 *       403:
 *         description: Forbidden / invalid CSRF token
 *       409:
 *         description: Email or phone already exists
 *       500:
 *         description: Internal server error
 */

const add = async (req, res) => {
	try {
		const { full_name, email, password, city, bio, birthdate, phone, role, status } = req.body;

		const hashedPassword = await bcrypt.hash(password, HASH_COST_FACTOR);

		await prisma.user.create({
			data: {
				full_name,
				email,
				password: hashedPassword,
				city,
				bio,
				birthdate,
				phone,
				role,
				status
			}
		});

		return messages.createdSuccessfully(res, "Account created successfully");
	} catch (error) {
		const handled = handlePrismaError(res, error, {
			uniqueMessage: "Email or phone already exists"
		});

		if (handled) return handled;

		console.error("Adding user error:", error);

		return messages.serverError(res);
	}
};

/**
 * @openapi
 * /user/{id}:
 *   put:
 *     summary: Update user account
 *     description: Updates an existing user account by ID.
 *     tags:
 *       - Admin
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 2
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: Ahmad Mohammed
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: StrongPassword@123
 *               phone:
 *                 type: string
 *                 nullable: true
 *                 example: "+970599000000"
 *               birthdate:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 example: "2000-01-15"
 *               bio:
 *                 type: string
 *                 nullable: true
 *                 example: Software engineering student.
 *               city:
 *                 type: string
 *                 nullable: true
 *                 example: Gaza
 *               role:
 *                 type: string
 *                 enum:
 *                   - User
 *                   - Admin
 *                 example: User
 *               status:
 *                 type: string
 *                 enum:
 *                   - Active
 *                   - Inactive
 *                 example: Active
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Account updated successfully
 *       400:
 *         description: Bad request / validation error
 *       401:
 *         description: Unauthenticated
 *       403:
 *         description: Forbidden / invalid CSRF token
 *       404:
 *         description: User not found
 *       409:
 *         description: Email or phone already exists
 *       500:
 *         description: Internal server error
 */

const update = async (req, res) => {
	try {
		const id = req.params.id;


		const { full_name, email, password, city, bio, birthdate, phone, role, status } = req.body;

		const data = { full_name, email, city, bio, birthdate, phone, role, status };

		if(password) {
			data.password = await bcrypt.hash(password, HASH_COST_FACTOR);
		}


		await prisma.user.update({
			where: { id },
			data
		});

		return messages.success(res, "Account updated successfully");
	} catch (error) {
		const handled = handlePrismaError(res, error, {
			uniqueMessage: "Email or phone already exists",
			notFoundMessage: "User not found"
		});

		if (handled) return handled;

		console.error("Updating user error:", error);

		return messages.serverError(res);
	}
};

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Returns all users in the database.
 *     tags:
 *       - Admin
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   full_name:
 *                     type: string
 *                     example: Ahmad Ali
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: user@example.com
 *                   phone:
 *                     type: string
 *                     nullable: true
 *                     example: "+970599000000"
 *                   birthdate:
 *                     type: string
 *                     format: date
 *                     nullable: true
 *                     example: "2000-01-15"
 *                   bio:
 *                     type: string
 *                     nullable: true
 *                     example: Software engineering student.
 *                   city:
 *                     type: string
 *                     nullable: true
 *                     example: Gaza
 *                   role:
 *                     type: string
 *                     enum:
 *                       - User
 *                       - Admin
 *                     example: User
 *                   status:
 *                     type: string
 *                     enum:
 *                       - Active
 *                       - Inactive
 *                     example: Active
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2026-06-24T10:00:00.000Z"
 *       401:
 *         description: Unauthenticated
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */

const get_all = async (req, res) => {
	try {
		const result = await prisma.user.findMany({
			select: {
				id: true,
				full_name: true,
				email: true,
				city: true,
				bio: true,
				birthdate: true,
				phone: true,
				role: true,
				status: true,
				createdAt: true
			}
		});

		const users = result.map((user) => ({
			...user,
			birthdate: user.birthdate?.toISOString().slice(0, 10) ?? null
		}))

		return res.json(users);
		
	} catch (error) {
		console.error("Error retreiving all users: ", error);

		return messages.serverError(res);
	}
};

/**
 * @openapi
 * /user/{id}:
 *   delete:
 *     summary: Delete user
 *     description: Deletes an existing user by ID.
 *     tags:
 *       - Admin
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 2
 *         description: User ID
 *     responses:
 *       204:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted Successfully
 *       400:
 *         description: Cannot delete protected user
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden / invalid CSRF token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

const remove = async (req, res) => {
	try {
		const id = req.params.id;

		await prisma.user.delete({ where: { id } });

		return messages.deletedSuccessfully(res, "User deleted Successfully");
	} catch (error) {
		const handled = handlePrismaError(res, error, {
			notFoundMessage: "User not found"
		});

		if (handled) return handled;

		console.error("Deleting user error: ", error);

		return messages.serverError(res);
	}
};

module.exports = {
	login,
	register,
	profile,
	public_profile,
	update_profile,
	logout,
	posts,
	add,
	update,
	remove,
	get_all
};

