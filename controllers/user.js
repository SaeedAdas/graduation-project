const bcrypt = require("bcryptjs");
const prisma = require("../config/connection");
const messages = require("../helper/messages");
const { rotateCsrfToken } = require("../middlewares/csrf");

const HASH_COST_FACTOR = 12;

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticates a user, regenerates the session, stores user data in the session, and returns a CSRF token.
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
				role: true
			}
		});

		if (!user) {
			return messages.badRequest(res, "Invalid email or password");
		}

		const passwordMatches = await bcrypt.compare(password, user.password);

		if (!passwordMatches) {
			return messages.badRequest(res, "Invalid email or password");
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

		const existingUser = await prisma.user.findUnique({where: { email }});

		if (existingUser) {
			return messages.alreadyExists(res, "Email already exists");
		}

		const hashedPassword = await bcrypt.hash(password, HASH_COST_FACTOR); 

		const user = await prisma.user.create({
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
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
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

		const user = {full_name, email, phone, birthdate, bio, city};

		res.json(user);

	} catch (error) {
		console.error("Retrieving Profile error:", error);

		return messages.serverError(res);
	}
};

/**
 * @openapi
 * /user/profile:
 *   put:
 *     summary: Update a user profile
 *     description: Updates a user profile data
 *     tags:
 *       - User
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
 *                 example: Ahmad mohammed
 *               phone:
 *                 type: number
 *                 example: 0591234567
 *               birthdate:
 *                 type: string
 *                 example: Updated post description
 *               city:
 *                 type: string
 *                 example: Updated post description
 *               bio:
 *                 type: string
 *                 example: Updated post description
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Post updated successfully
 *       400:
 *         description: Bad request / validation error
 *       401:
 *         description: Unauthorized
 */

const update_profile = async (req, res) => {
	try {

		const id = req.user.id;

		const { full_name, phone, birthdate, city, bio } = req.body;

		const user = await prisma.user.update({
			where: {id},
			data: {
				full_name,
				phone,
				birthdate,
				city,
				bio
			}
		});

		return res.json(user);

	} catch (error) {
		console.error("Updating Profile error:", error);

		return messages.serverError(res);
	}
};

const posts = async (req, res) => {
	try {

		const id = req.user.id;

		let { page, limit, search, searchIn, category } = req.query;

		const where = {
			userId: id
		};

		if (category !== undefined) {
			where.category_id = category;
		}

		if (search) {
			if (searchIn != undefined) {
				where[searchIn] = {
					contains: search,
					mode: "insensitive"
				}
			} else {
				where.OR = [
					{
						title: {
							contains: search,
							mode: "insensitive"
						}
					},
					{
						description: {
							contains: search,
							mode: "insensitive"
						}
					}
				]
			}
		}

		const queryOptions = {
			where,
			orderBy: {"createdAt": "desc"},
			select: {
				title: true,
				category: true,
				description: true,
				createdAt: true,
				_count: {
					select: {
						comments: true,
						reactions: true
					}
				}
			}
		}

		if (page !== undefined && limit !== undefined) {
			queryOptions.skip = (page - 1) * limit;
			queryOptions.take = limit;
		}

	
		const posts = await prisma.post.findMany(queryOptions);

		const formattedPosts = posts.map((post) => ({
			...post,
			category: post.category.name
		}))

		return res.json(formattedPosts);

	} catch (error) {
		console.error("Retreiving my-posts error: ", error);

		return messages.serverError(res);
	}
};

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Destroys the current session and clears both the session cookie and CSRF cookie.
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
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

module.exports = {
	login,
	register,
	profile,
	update_profile,
	logout,
	posts
};
