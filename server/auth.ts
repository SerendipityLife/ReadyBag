import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { db } from "@db";
import { users } from "@shared/schema";
import { eq, and, or } from "drizzle-orm";
import { 
  registerUserSchema,
  loginUserSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { pool } from "../db";

// Declaring user type for Express session
declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      nickname: string | null;
    }
  }
}

const scryptAsync = promisify(scrypt);

// Hash password using scrypt
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Compare provided password with stored hashed password
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Set up authentication for the Express app
export function setupAuth(app: Express) {
  // Create PostgreSQL session store
  const PostgresStore = connectPgSimple(session);
  
  // Set up session storage
  const sessionOptions: session.SessionOptions = {
    store: new PostgresStore({
      pool,
      tableName: "session", // Uses "session" table in your database
      createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || "readybag_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      httpOnly: true
    }
  };
  
  app.use(session(sessionOptions));
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Configure passport local strategy (email/password)
  passport.use(new LocalStrategy(
    { usernameField: "email" }, // Use email instead of username
    async (email, password, done) => {
      try {
        // Find user by email
        const userResults = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
        const user = userResults[0];
        
        if (!user) {
          return done(null, false, { message: "계정을 찾을 수 없습니다" });
        }
        
        // Check password
        const isValidPassword = await comparePasswords(password, user.password);
        if (!isValidPassword) {
          return done(null, false, { message: "비밀번호가 일치하지 않습니다" });
        }
        
        // Return user without password
        return done(null, {
          id: user.id,
          email: user.email,
          nickname: user.nickname
        });
      } catch (error) {
        return done(error);
      }
    }
  ));
  
  // Serialize user to session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const userResults = await db.select({
        id: users.id,
        email: users.email,
        nickname: users.nickname
      }).from(users).where(eq(users.id, id));
      
      const user = userResults[0];
      
      if (!user) {
        return done(null, false);
      }
      
      return done(null, user);
    } catch (error) {
      done(error);
    }
  });
  
  // Register route
  app.post("/api/auth/register", async (req, res) => {
    try {
      // Validate input
      const validatedData = registerUserSchema.parse(req.body);
      
      // Check if email already exists
      const existingUser = await db.select().from(users).where(eq(users.email, validatedData.email.toLowerCase()));
      
      if (existingUser.length > 0) {
        return res.status(400).json({ message: "이미 사용 중인 이메일입니다" });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);
      
      // Create user
      const newUser = await db.insert(users).values({
        email: validatedData.email.toLowerCase(),
        password: hashedPassword,
        nickname: validatedData.nickname || null
      }).returning({
        id: users.id,
        email: users.email,
        nickname: users.nickname
      });
      
      // Log in the newly registered user
      req.login(newUser[0], (err) => {
        if (err) {
          return res.status(500).json({ message: "로그인 중 오류가 발생했습니다" });
        }
        return res.status(201).json(newUser[0]);
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "입력 데이터가 유효하지 않습니다",
          errors: error.errors
        });
      }
      console.error("회원가입 오류:", error);
      return res.status(500).json({ message: "회원가입 처리 중 오류가 발생했습니다" });
    }
  });
  
  // Login route
  app.post("/api/auth/login", (req, res, next) => {
    try {
      // Validate input
      loginUserSchema.parse(req.body);
      
      passport.authenticate("local", (err: Error, user: Express.User, info: { message: string }) => {
        if (err) {
          return res.status(500).json({ message: "로그인 처리 중 오류가 발생했습니다" });
        }
        
        if (!user) {
          return res.status(401).json({ message: info.message || "로그인 실패" });
        }
        
        req.login(user, (loginErr) => {
          if (loginErr) {
            return res.status(500).json({ message: "로그인 처리 중 오류가 발생했습니다" });
          }
          return res.status(200).json(user);
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "입력 데이터가 유효하지 않습니다",
          errors: error.errors
        });
      }
      return res.status(500).json({ message: "로그인 처리 중 오류가 발생했습니다" });
    }
  });
  
  // Logout route
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "로그아웃 처리 중 오류가 발생했습니다" });
      }
      return res.status(200).json({ message: "로그아웃 되었습니다" });
    });
  });
  
  // Get current user
  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "인증되지 않은 사용자입니다" });
    }
    
    return res.status(200).json(req.user);
  });
  
  // Password reset request
  app.post("/api/auth/reset-password-request", async (req, res) => {
    try {
      const { email } = resetPasswordRequestSchema.parse(req.body);
      
      const userResults = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
      const user = userResults[0];
      
      if (!user) {
        // For security reasons, don't reveal if the email exists
        return res.status(200).json({ message: "비밀번호 재설정 링크가 이메일로 전송되었습니다." });
      }
      
      // Generate random token
      const resetToken = randomBytes(20).toString("hex");
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 1); // Token valid for 1 hour
      
      // Save token to user
      await db.update(users)
        .set({ 
          resetToken, 
          resetTokenExpiry: tokenExpiry 
        })
        .where(eq(users.id, user.id));
      
      // In a real implementation, send an email with the reset link
      // For now, just return the token in the response (for testing)
      const resetLink = `${req.protocol}://${req.get("host")}/reset-password?token=${resetToken}`;
      
      console.log("Password reset link:", resetLink);
      
      return res.status(200).json({ 
        message: "비밀번호 재설정 링크가 이메일로 전송되었습니다.",
        // In production, remove these fields
        debug: {
          token: resetToken,
          resetLink
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "입력 데이터가 유효하지 않습니다",
          errors: error.errors
        });
      }
      console.error("비밀번호 재설정 요청 오류:", error);
      return res.status(500).json({ message: "비밀번호 재설정 요청 처리 중 오류가 발생했습니다" });
    }
  });
  
  // Reset password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = resetPasswordSchema.parse(req.body);
      
      // Find user with this token and check if the token is still valid
      const now = new Date();
      const userResults = await db.select().from(users).where(
        and(
          eq(users.resetToken, token),
          or(
            eq(users.resetTokenExpiry, null),
            users.resetTokenExpiry > now
          )
        )
      );
      
      const user = userResults[0];
      
      if (!user) {
        return res.status(400).json({ message: "유효하지 않거나 만료된 토큰입니다" });
      }
      
      // Hash new password
      const hashedPassword = await hashPassword(password);
      
      // Update password and clear reset token
      await db.update(users)
        .set({
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null
        })
        .where(eq(users.id, user.id));
      
      return res.status(200).json({ message: "비밀번호가 성공적으로 재설정되었습니다" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "입력 데이터가 유효하지 않습니다",
          errors: error.errors
        });
      }
      console.error("비밀번호 재설정 오류:", error);
      return res.status(500).json({ message: "비밀번호 재설정 처리 중 오류가 발생했습니다" });
    }
  });

  // Middleware to check if user is authenticated
  app.use(["/api/user-products", "/api/user"], (req, res, next) => {
    // Allow session-based anonymous access if not authenticated
    if (!req.isAuthenticated() && !req.session.id) {
      return res.status(401).json({ message: "인증되지 않은 사용자입니다" });
    }
    next();
  });
}