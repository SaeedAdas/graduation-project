const express = require("express");
const cors = require("cors");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const { Pool } = require("pg");
const {	getOrCreateCsrfToken, csrfProtection } = require("./middlewares/csrf");

const router = require('./router');

const app = express();

app.set("trust proxy", 1);

app.use(cors({
	  origin: process.env.FRONTEND_URL,
	  credentials: true
}));

app.use(express.json());

app.get("/keep-alive", (req, res) => {
	res.status(200).json({
		message: "Kept alive successfully"
	})
});

const pgPool = new Pool({
	  connectionString: process.env.DATABASE_URL,
	  ssl: process.env.NODE_ENV === "production"
	    ? { rejectUnauthorized: false }
	    : false
});

app.use(session({
	store: new pgSession({
		pool: pgPool,
		tableName: "session",

		// Table already exists. Do not check/create it every time.
		createTableIfMissing: false,
			
		// Very important for Neon Free:
		// connect-pg-simple was waking the DB every 15 minutes. Now it's 24 hours
		pruneSessionInterval: 60 * 60 * 24,
			
		// Reduces writes on every request.
	        // Session expiry becomes absolute, not sliding.
		disableTouch: true,
		ttl: 60 * 60 * 24 * 7
	}),
	name: "sid",
	secret: process.env.SESSION_SECRET,
	resave: false,
  	saveUninitialized: false,
	proxy: true,
	cookie: {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: 1000 * 60 * 60 * 24 * 7
	}
}));


app.get("/csrf-token", (req, res, next) => {
	try {
    		const csrfToken = getOrCreateCsrfToken(req, res);

		// force-save CSRF-token in req.session.csrfToken before sending to client
    		req.session.save((error) => {
      			if (error) {
        			return next(error);
      			}

      			return res.json({ csrfToken });
    		});
  	} catch (error) {
    		return next(error);
  	}
});


app.use(csrfProtection);


app.use("/", router);

app.use((error, req, res, next) => {
	console.error(error);

  	return res.status(500).json({
    		message: "Internal server error"
  	});
});





const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
	  console.log(`Server running on port ${PORT}`);
});
