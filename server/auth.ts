import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import session from "express-session";
import bcrypt from "bcrypt";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 1 week

export function buildSessionMiddleware() {
  const pgStore = connectPg(session);
  const store = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: SESSION_TTL / 1000,
    tableName: "sessions",
  });

  return session({
    secret: process.env.SESSION_SECRET || "localtaste-dev-secret-change-in-production",
    store,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_TTL,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);

  app.use(buildSessionMiddleware());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        if (!user || !user.password) return done(null, false);
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return done(null, false);
        return done(null, { localAuth: true, userId: user.id });
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, cb) => cb(null, user));
  passport.deserializeUser((user: any, cb) => cb(null, user));
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated() || !(req.user as any)?.localAuth) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export function getUserId(req: any): string | null {
  return req.user?.userId ?? req.session?.userId ?? null;
}
