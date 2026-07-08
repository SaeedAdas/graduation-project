// repository is file/module resposible for talking to the database
const { Prisma } = require("@prisma/client");
const prisma = require("../config/connection");

const allowedPostsCondition = {
	userId: Prisma.sql`p.user_id`
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

const listPostsWithStats = async ({ page, limit, search, searchIn, category, condition }) => {
	const skip = (page - 1) * limit;

        const searchValue = `%${search}%`
        const searchInValue = `%${searchIn}%`
        const categoryValue = `%${category}%`

	// condition is an object with key represnting field and the value 
	const conditionsFilter = buildConditionFilter(condition);

        const searchFilter = searchIn
        	? Prisma.sql`
                	AND (
                        	p.${searchIn} ILIKE ${searchValue}
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

    	const posts = await prisma.$queryRaw`
          	WITH filtered_posts AS (
                     	SELECT
                        	p.id,
                                p.title,
                                c.name,
                                p.description,
                                p.created_at
                        FROM posts p
                        INNER JOIN categories c  ON c.id = p.category_id
                        WHERE 1 = 1
				${conditionsFilter}
                                ${searchFilter}
                                ${categoryFilter}
                ),

                paginated_posts AS (
                        SELECT *
                        FROM filtered_posts fp
                        ORDER BY created_at DESC
                        ${paginationClause}
                ),

                comments_stats AS (
                        SELECT
                                post_id,
                                COUNT(*)::int AS comments_count,
                                ROUND(AVG(rating)::numeric, 1)::float AS average_rating
                        FROM comments
                        WHERE post_id IN (
                                SELECT id FROM paginated_posts
                        )
                        GROUP BY post_id
                ),

                reactions_stats AS (
                        SELECT
                                post_id,
                                COUNT(*)::int AS reactions_count
                        FROM reactions
                        WHERE post_id IN (
                                SELECT id FROM paginated_posts
                        )
                        GROUP BY post_id
                )

                SELECT
                        pp.*,
                        COALESCE(cm.comments_count, 0)::int AS "commentsCount",
                        COALESCE(cm.average_rating, 0)::float AS "averageRating",
                        COALESCE(r.reactions_count, 0)::int AS "reactionsCount"
                FROM paginated_posts pp
                LEFT JOIN comments_stats cm ON cm.post_id = pp.id
                LEFT JOIN reactions_stats r ON r.post_id = pp.id

                `;

	return posts;
};

module.exports = {
        listPostsWithStats
};
