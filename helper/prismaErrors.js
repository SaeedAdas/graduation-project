const { Prisma } = require("@prisma/client");
const messages = require("./messages");

const handlePrismaError = (res, error, options = {}) => {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
                return false;
        }

        if (error.code === "P2002") {
                return messages.alreadyExists(
                        res,
                        options.uniqueMessage || "Record already exists"
                );
        }

        if (error.code === "P2003") {
                return messages.badRequest(
                        res,
                        options.foreignKeyMessage || "Invalid related record"
                );
        }

        if (error.code === "P2025") {
                return messages.badRequest(
                        res,
                        options.notFoundMessage || "Record not found"
                );
        }

        return false;
};

module.exports = {
        handlePrismaError
};
