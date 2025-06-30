import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import connectPgSimple from "connect-pg-simple";
import { pool } from "../db";
import { db } from "../db";
import { users, loginUserSchema, registerUserSchema, resetPasswordRequestSchema, resetPasswordSchema } from "@shared/schema";
import { eq, and, isNull, gt, or } from "drizzle-orm";
import { nanoid } from "nanoid";

// Express User interface 확장
declare global {
    namespace Express {
        interface User {
            id: number;
            email: string;
            nickname: string | null;
        }
    }
}

// 비밀번호 해싱 함수
export async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const hash = createHash("sha256");
    hash.update(password + salt);
    const hashedPassword = hash.digest("hex");
    return `${hashedPassword}.${salt}`;
}

// 비밀번호 비교 함수
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
    try {
        const [hashed, salt] = stored.split(".");
        const hash = createHash("sha256");
        hash.update(supplied + salt);
        const hashedBuffer = Buffer.from(hash.digest("hex"));
        const storedBuffer = Buffer.from(hashed);
        return hashedBuffer.toString() === storedBuffer.toString();
    } catch (error) {
        console.error("Error comparing passwords:", error);
        return false;
    }
}

// 이메일 전송 모의 함수 (실제 구현에서는 실제 이메일 서비스 사용)
async function sendPasswordResetEmail(email: string, resetToken: string, resetLink: string) {
    console.log(`
        To: ${email}
        Subject: ReadyBag 비밀번호 재설정
        
        아래 링크를 클릭하여 비밀번호를 재설정하세요:
        ${resetLink}
        
        이 링크는 1시간 동안 유효합니다.
    `);
    
    // 실제 구현에서는 여기에 이메일 서비스를 사용하여 이메일 전송
    return true;
}

// 인증 설정 함수
export function setupAuth(app: Express) {
    // Session store 설정
    const PgSessionStore = connectPgSimple(session);
    
    // 세션 설정
    app.use(
        session({
            store: new PgSessionStore({
                pool,
                tableName: "session", // 세션 테이블 이름
                createTableIfMissing: true, // 테이블이 없으면 생성
            }),
            secret: process.env.SESSION_SECRET || "readybag-session-secret",
            resave: false,
            saveUninitialized: false,
            cookie: {
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30일
                secure: process.env.NODE_ENV === "production",
                httpOnly: true,
            },
        })
    );
    
    // Passport 초기화
    app.use(passport.initialize());
    app.use(passport.session());
    
    // LocalStrategy 설정
    passport.use(
        new LocalStrategy(
            {
                usernameField: "email",
                passwordField: "password",
            },
            async (email, password, done) => {
                try {
                    // 사용자 조회 - 이메일 또는 username으로 조회
                    const user = await db.query.users.findFirst({
                        where: or(
                            eq(users.email, email),
                            eq(users.username, email)
                        ),
                    });
                    
                    if (!user) {
                        return done(null, false, { message: "이메일 또는 비밀번호가 일치하지 않습니다." });
                    }
                    
                    // 비밀번호 확인
                    const isPasswordValid = await comparePasswords(password, user.password);
                    
                    if (!isPasswordValid) {
                        return done(null, false, { message: "이메일 또는 비밀번호가 일치하지 않습니다." });
                    }
                    
                    // 인증 성공
                    return done(null, {
                        id: user.id,
                        email: user.email,
                        nickname: user.nickname,
                    });
                } catch (error) {
                    return done(error);
                }
            }
        )
    );
    
    // 세션에 사용자 정보 저장
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });
    
    // 세션에서 사용자 정보 복원
    passport.deserializeUser(async (id: number, done) => {
        try {
            const user = await db.query.users.findFirst({
                where: eq(users.id, id),
                columns: {
                    id: true,
                    email: true,
                    nickname: true,
                }
            });
            
            if (!user) {
                return done(null, false);
            }
            
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    });
    
    // 회원가입 엔드포인트
    app.post("/api/auth/register", async (req, res) => {
        try {
            // 요청 데이터 검증
            const validatedData = registerUserSchema.parse(req.body);
            
            // 이메일 중복 확인
            const existingUser = await db.query.users.findFirst({
                where: eq(users.email, validatedData.email),
            });
            
            if (existingUser) {
                return res.status(400).json({ message: "이미 사용 중인 이메일입니다." });
            }
            
            // 비밀번호 해싱
            const hashedPassword = await hashPassword(validatedData.password);
            
            // 사용자 생성
            const [newUser] = await db.insert(users)
                .values({
                    username: validatedData.email, // username 컬럼에도 이메일 저장
                    email: validatedData.email,
                    password: hashedPassword,
                    nickname: validatedData.nickname || null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning({
                    id: users.id,
                    email: users.email,
                    nickname: users.nickname,
                });
            
            // 자동 로그인
            req.login(newUser, (err) => {
                if (err) {
                    return res.status(500).json({ message: "로그인 처리 중 오류가 발생했습니다." });
                }
                
                return res.status(201).json(newUser);
            });
        } catch (error: any) {
            console.error("Registration error:", error);
            
            if (error.name === "ZodError") {
                return res.status(400).json({ message: "입력 데이터가 올바르지 않습니다.", errors: error.errors });
            }
            
            return res.status(500).json({ message: "회원가입 중 오류가 발생했습니다." });
        }
    });
    
    // 로그인 엔드포인트
    app.post("/api/auth/login", (req, res, next) => {
        try {
            // 요청 데이터 검증
            loginUserSchema.parse(req.body);
            
            passport.authenticate("local", (err: Error, user: Express.User, info: { message: string }) => {
                if (err) {
                    return next(err);
                }
                
                if (!user) {
                    return res.status(401).json({ message: info.message || "로그인에 실패했습니다." });
                }
                
                req.login(user, (err) => {
                    if (err) {
                        return next(err);
                    }
                    
                    return res.json(user);
                });
            })(req, res, next);
        } catch (error: any) {
            console.error("Login error:", error);
            
            if (error.name === "ZodError") {
                return res.status(400).json({ message: "입력 데이터가 올바르지 않습니다.", errors: error.errors });
            }
            
            return res.status(500).json({ message: "로그인 중 오류가 발생했습니다." });
        }
    });
    
    // 로그아웃 엔드포인트
    app.post("/api/auth/logout", (req, res) => {
        req.logout((err) => {
            if (err) {
                return res.status(500).json({ message: "로그아웃 중 오류가 발생했습니다." });
            }
            
            res.json({ message: "로그아웃 되었습니다." });
        });
    });
    
    // 현재 사용자 조회 엔드포인트
    app.get("/api/auth/user", (req, res) => {
        if (!req.isAuthenticated() || !req.user) {
            return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
        }
        
        res.json(req.user);
    });
    
    // 비밀번호 재설정 요청 엔드포인트
    app.post("/api/auth/reset-password-request", async (req, res) => {
        try {
            // 요청 데이터 검증
            const { email } = resetPasswordRequestSchema.parse(req.body);
            
            // 이메일로 사용자 조회
            const user = await db.query.users.findFirst({
                where: eq(users.email, email),
            });
            
            // 사용자가 존재하지 않더라도 보안을 위해 성공 응답
            if (!user) {
                return res.json({ message: "비밀번호 재설정 링크가 이메일로 전송되었습니다." });
            }
            
            // 토큰 생성
            const resetToken = nanoid(32);
            const now = new Date();
            const expiry = new Date(now.getTime() + 60 * 60 * 1000); // 1시간 후 만료
            
            // 토큰 저장
            await db.update(users)
                .set({
                    resetToken,
                    resetTokenExpiry: expiry,
                    updatedAt: now,
                })
                .where(eq(users.id, user.id));
            
            // 재설정 링크 생성
            // 현재 Replit 환경 호스트 가져오기 (X-Forwarded-Host 또는 Host 헤더 사용)
            const host = req.get("x-forwarded-host") || req.get("host");
            // Replit에서는 HTTPS 사용
            const protocol = req.get("x-forwarded-proto") || req.protocol;
            const resetLink = `${protocol}://${host}/reset-password?token=${resetToken}`;
            
            // 이메일 전송
            await sendPasswordResetEmail(email, resetToken, resetLink);
            
            res.json({ message: "비밀번호 재설정 링크가 이메일로 전송되었습니다." });
        } catch (error: any) {
            console.error("Reset password request error:", error);
            
            if (error.name === "ZodError") {
                return res.status(400).json({ message: "입력 데이터가 올바르지 않습니다.", errors: error.errors });
            }
            
            return res.status(500).json({ message: "비밀번호 재설정 요청 중 오류가 발생했습니다." });
        }
    });
    
    // 비밀번호 재설정 엔드포인트
    app.post("/api/auth/reset-password", async (req, res) => {
        try {
            // 요청 데이터 검증
            const { token, password, confirmPassword } = resetPasswordSchema.parse(req.body);
            
            // 토큰으로 사용자 조회
            const user = await db.query.users.findFirst({
                where: and(
                    eq(users.resetToken, token),
                    // 만료 시간이 현재보다 커야 함 (아직 만료되지 않음)
                    gt(users.resetTokenExpiry as any, new Date())
                ),
            });
            
            if (!user) {
                return res.status(400).json({ message: "유효하지 않거나 만료된 토큰입니다." });
            }
            
            // 비밀번호 해싱
            const hashedPassword = await hashPassword(password);
            
            // 비밀번호 업데이트 및 토큰 초기화
            await db.update(users)
                .set({
                    password: hashedPassword,
                    resetToken: null,
                    resetTokenExpiry: null,
                    updatedAt: new Date(),
                })
                .where(eq(users.id, user.id));
            
            res.json({ message: "비밀번호가 성공적으로 재설정되었습니다." });
        } catch (error: any) {
            console.error("Reset password error:", error);
            
            if (error.name === "ZodError") {
                return res.status(400).json({ message: "입력 데이터가 올바르지 않습니다.", errors: error.errors });
            }
            
            return res.status(500).json({ message: "비밀번호 재설정 중 오류가 발생했습니다." });
        }
    });
    
    // 사용자 경험을 개선하기 위한 에러 처리 미들웨어
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
        console.error("Authentication error:", err);
        res.status(500).json({ message: "인증 처리 중 오류가 발생했습니다." });
    });
}