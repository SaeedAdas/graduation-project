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
			ORDER BY
                		fp.created_at DESC NULLS LAST,
                		fp.id DESC
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
                        FROM reports
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
		ORDER BY
        		pp.created_at DESC NULLS LAST,
        		pp.id DESC
                `;

	return formatOutput(rows, page, limit);
};

const listPostWithDetails = async (postId, page, limit, viewerId) => {
        const offset = (page - 1) * limit;

	const [postRows, comments] = await prisma.$transaction([
                prisma.$queryRaw`
                        WITH per_user_rating AS (
                                SELECT
                                        c.user_id,
                                        AVG(c.rating) AS user_average
                                FROM comments c
                                WHERE c.post_id = ${postId}
                                        AND c.rating IS NOT NULL
                                GROUP BY c.user_id
                        ),

                        post_stats AS (
                                SELECT
                                        (
                                                SELECT COUNT(*)::int
                                                FROM comments c
                                                WHERE c.post_id = ${postId}
                                        ) AS comments_count,

                                        (
                                                SELECT
                                                        COALESCE(
                                                                ROUND(
                                                                        AVG(pur.user_average)::numeric,
                                                                        1
                                                                ),
                                                                0
                                                        )::float
                                                FROM per_user_rating pur
                                        ) AS average_rating,

                                        (
                                                SELECT COUNT(*)::int
                                                FROM reactions r
                                                WHERE r.post_id = ${postId}
                                        ) AS reactions_count,

                                        (
                                                SELECT COUNT(*)::int
                                                FROM reports rp
                                                WHERE rp.post_id = ${postId}
                                        ) AS reports_count
                        )

                        SELECT
                                p.id,
                                p.user_id AS "userId",
                                author.full_name,
                                category.name,
                                p.title,
                                p.description,
                                p.created_at,

                                stats.comments_count AS "commentsCount",
                                stats.average_rating AS "averageRating",
                                stats.reactions_count AS "reactionsCount",
                                stats.reports_count AS "reportsCount",

                                EXISTS (
                                        SELECT 1
                                        FROM reactions current_reaction
                                        WHERE current_reaction.post_id = p.id
                                                AND current_reaction.user_id = ${viewerId}
                                ) AS "hasReacted",

                                EXISTS (
                                        SELECT 1
                                        FROM reports current_report
                                        WHERE current_report.post_id = p.id
                                                AND current_report.user_id = ${viewerId}
                                ) AS "hasReported"

                        FROM posts p
                        INNER JOIN users author
                                ON author.id = p.user_id
                        INNER JOIN categories category
                                ON category.id = p.category_id
                        CROSS JOIN post_stats stats
                        WHERE p.id = ${postId}
                `,

                prisma.$queryRaw`
                        SELECT
                                c.id,
                                c.user_id AS "userId",
                                u.full_name,
                                c.content,
                                c.rating,
                                c.created_at AS "createdAt"

                        FROM comments c
                        INNER JOIN users u
                                ON u.id = c.user_id

                        WHERE c.post_id = ${postId}

                        ORDER BY
                                c.created_at DESC NULLS LAST,
                                c.id DESC

                        LIMIT ${limit}
                        OFFSET ${offset}
                `
        ]);

        const post = postRows[0];

        if (!post) {
                return null;
        }

        const total = post.commentsCount;
        const totalPages = Math.ceil(total / limit);

        return {
                ...post,

                comments: {
                        items: comments,

                        pagination: {
                                page: page,
                                limit: limit,
                                total,
                                totalPages,
                                hasNext: page < totalPages,
                                hasPrevious:
                                        page > 1 && totalPages > 0
                        }
                }
	}
};

module.exports = {
        listPostsWithStats,
	listPostWithDetails
};
