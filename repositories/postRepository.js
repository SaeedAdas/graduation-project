// repository is file/module resposible for talking to the database
const { Prisma } = require("@prisma/client");
const prisma = require("../config/connection");

const searchableFields = {
	title: Prisma.sql`p.title`,
	description: Prisma.sql`p.description`,
}

const allowedPostsCondition = {
	userId: Prisma.sql`p.user_id`
}

function formatOutput(rows, page, limit) {
	const total = rows[0]?.total ?? 0;
	const totalPages = Math.ceil(total / limit);
	const formattedOutput = {
		items: rows.map(({total, ...post}) => post),
		pagination: {
			page,
			limit,
			total,
			totalPages,
			hasNext: page < totalPages,
			hasPrevious: page > 1
		}
	}

	return formattedOutput;
}

function buildConditionFilter(conditions) {
	if (!conditions || Object.keys(conditions).length == 0) {
		return Prisma.empty;
	}

	const filters = Object.entries(conditions)
			.filter(([, value]) => value !== undefined && value !== null)
			.map(([field, value]) => {
				const column = allowedPostsCondition[field];	

				if (!column) {
					throw new Error(`Invalid condition field: ${field}`);
				}

				return Prisma.sql`${column} = ${value}`
			});
	
	if (filters.length == 0) {
		return Prisma.empty;
	}

	return Prisma.sql`
		AND (
			${Prisma.join(filters, Prisma.sql` AND `)}
		)
	`

	
};

const listPostsWithStats = async ({ page, limit, search, searchIn, category, currentUserId, condition }) => {
	const skip = (page - 1) * limit;

	const searchColumn = searchableFields[searchIn];
        const searchValue = `%${search}%`
        const categoryValue = `%${category}%`

	// condition is an object with key represnting field and the value 
	const conditionsFilter = buildConditionFilter(condition);

        const searchFilter = searchIn
        	? Prisma.sql`
                	AND (
                        	${searchColumn} ILIKE ${searchValue}
                        )
		` : search
		? Prisma.sql`
			AND (
                        	p.title ILIKE ${searchValue}
                                OR
                                p.description ILIKE ${searchValue}
                        )
                ` : Prisma.empty;

        const categoryFilter = category
                ? Prisma.sql`
                       	AND (
                         	c.name ILIKE ${categoryValue}
                        )
                ` : Prisma.empty;

       	const paginationClause = page
              	? Prisma.sql`
                  	LIMIT ${limit}
                     	OFFSET ${skip}
           	` : Prisma.empty;

    	const rows = await prisma.$queryRaw`
          	WITH filtered_posts AS (
                     	SELECT
                        	p.id,
                                p.title,
				p.user_id,
                                u.full_name,
                                c.name,
                                p.description,
                                p.created_at
                        FROM posts p
                        INNER JOIN categories c  ON c.id = p.category_id
                        INNER JOIN users u  ON u.id = p.user_id
                        WHERE 1 = 1
				${conditionsFilter}
                                ${searchFilter}
                                ${categoryFilter}
                ),

                paginated_posts AS (
                        SELECT *
                        FROM filtered_posts fp
                        ORDER BY created_at DESC, id DESC
                        ${paginationClause}
                ),

		user_average_rating AS (
			SELECT
            			post_id,
            			user_id,
	    			COUNT(*)::int AS comments_count,
            			AVG(rating)::numeric AS user_average_rating
        		FROM comments
                 	GROUP BY post_id, user_id
		),

                comments_stats AS (
                        SELECT
                                post_id,
                                SUM(comments_count) AS count,
                                ROUND(AVG(user_average_rating)::numeric, 1)::float AS average_rating
                        FROM user_average_rating
                        WHERE post_id IN (
                                SELECT id FROM paginated_posts
                        )
                        GROUP BY post_id
                ),

                reactions_stats AS (
                        SELECT
                                post_id,
                                COUNT(*)::int AS count
                        FROM reactions
                        WHERE post_id IN (
                                SELECT id FROM paginated_posts
                        )
                        GROUP BY post_id
                ),

                reports_stats AS (
                        SELECT
                                post_id,
                                COUNT(*)::int AS count
                        FROM reactions
                        WHERE post_id IN (
                                SELECT id FROM paginated_posts
                        )
                        GROUP BY post_id
                )

                SELECT
                        pp.*,
                        COALESCE(comments.count, 0)::int AS "commentsCount",
                        COALESCE(comments.average_rating, 0)::float AS "averageRating",
                        COALESCE(reactions.count, 0)::int AS "reactionsCount",
                        COALESCE(reports.count, 0)::int AS "reportsCount",

			(
				SELECT COUNT(*)::int
				FROM filtered_posts
			) AS "total",

			EXISTS (
				SELECT 1
				FROM reactions current_reaction
				WHERE current_reaction.post_id = pp.id
					AND current_reaction.user_id = ${currentUserId}
			) AS "hasReacted",

			EXISTS (
				SELECT 1
				FROM reports current_report
				WHERE current_report.post_id = pp.id
					AND current_report.user_id = ${currentUserId}
			) AS "hasReported"
		
                FROM paginated_posts pp
                LEFT JOIN comments_stats comments ON comments.post_id = pp.id
                LEFT JOIN reactions_stats reactions ON reactions.post_id = pp.id
                LEFT JOIN reports_stats reports ON reports.post_id = pp.id

                `;

	return formatOutput(rows, page, limit);
};

const listPostWithDetails = async (postId, page, limit, currentUserId) => {
        const offset = (page - 1) * limit;

	const post = await prisma.$queryRaw`
		WITH paginated_comments AS (
			SELECT
				c.*,
				COUNT(*)::int as count,
				u.full_name
			FROM comments c
			INNER JOIN users u ON u.id = c.user_id
			WHERE c.post_id = ${postId}
			LIMIT ${limit}
			OFFSET ${offset}
			ORDER BY createdAt desc
		),

		user_average_rating AS (
			SELECT
            			user_id,
            			AVG(rating)::numeric AS rating
        		FROM comments
			WHERE post_id = ${postId}
                 	GROUP BY user_id
		)

		SELECT
			p.*,
			c.name,
			COALESCE(pc.count, 0)::int AS "commentsCount",
			COALESCE(ROUND(AVG(uar.rating)::numeric, 1), 0)::float AS "averageRating",
			COALESCE(COUNT(reactions.id), 0)::int AS "reactionsCount",
			COALESCE(COUNT(reports.id), 0)::int AS "reportsCount",

			EXISTS (
				SELECT 1
				FROM reactions current_reaction
				WHERE current_reaction.post_id = p.id
					AND current_reaction.user_id = ${currentUserId}
			) AS "hasReacted",

			EXISTS (
				SELECT 1
				FROM reports current_report
				WHERE current_report.post_id = p.id
					AND current_report.user_id = ${currentUserId}
			) AS "hasReported",

			pc.*

		FROM posts p
		INNER JOIN categories c ON c.id = p.categoryId
		LEFT JOIN paginated_comments pc ON pc.post_id = p.id
		LEFT JOIN user_average_rating uar ON uar.user_id = p.user_id
		LEFT JOIN reactions ON reactions.post_id = p.id
		LEFT JOIN reports ON reports.post_id = p.id
		WHERE p.id = ${postId}
	`;

	return post;
};

module.exports = {
        listPostsWithStats,
	listPostWithDetails
};
