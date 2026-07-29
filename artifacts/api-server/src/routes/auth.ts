import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Router, type IRouter } from "express";
import { UserModel } from "@workspace/db";
import { RegisterBody, LoginBody, RegisterResponse, LoginResponse, GetMeResponse } from "@workspace/api-zod";
import { hashPassword, comparePassword, signToken } from "../lib/auth";
import { authenticate } from "../middlewares/authenticate";

const router: IRouter = Router();

// POST /api/auth/register
router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, email, password } = parsed.data;

  const existing = await UserModel.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(409).json({ error: "Cet email est déjà utilisé" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const isAdminEmail = email.toLowerCase() === "babioabdoul93@gmail.com";
  const user = new UserModel({ name, email, passwordHash, role: isAdminEmail ? "admin" : "user" });
  await user.save();

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  res.status(201).json(RegisterResponse.parse({
    token,
    user: {
      id: user.id, name: user.name, email: user.email, role: user.role,
      isPremium: user.isPremium, promptsUsed: user.promptsUsed, createdAt: user.createdAt,
    },
  }));
});

// POST /api/auth/login
router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;

  const user = await UserModel.findOne({ email: email.toLowerCase() });
  if (!user) {
    res.status(401).json({ error: "Email ou mot de passe incorrect" });
    return;
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Email ou mot de passe incorrect" });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  res.json(LoginResponse.parse({
    token,
    user: {
      id: user.id, name: user.name, email: user.email, role: user.role,
      isPremium: user.isPremium, promptsUsed: user.promptsUsed, createdAt: user.createdAt,
    },
  }));
});

// GET /api/auth/me
router.get("/auth/me", authenticate, async (req, res): Promise<void> => {
  const user = await UserModel.findOne({ id: req.user!.userId });
  if (!user) {
    res.status(401).json({ error: "Utilisateur introuvable" });
    return;
  }
  res.json(GetMeResponse.parse({
    id: user.id, name: user.name, email: user.email, role: user.role,
    isPremium: user.isPremium, promptsUsed: user.promptsUsed, createdAt: user.createdAt,
  }));
});


// ─── Google OAuth ─────────────────────────────────────────────────────────────

passport.use(new GoogleStrategy(
  {
    clientID: process.env["GOOGLE_CLIENT_ID"]!,
    clientSecret: process.env["GOOGLE_CLIENT_SECRET"]!,
    callbackURL: "/api/auth/google/callback",
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase();
      if (!email) return done(new Error("Email non fourni par Google"));

      let user = await UserModel.findOne({ email });

      if (!user) {
        // Nouvel utilisateur → on le crée sans mot de passe
        const isAdminEmail = email === "babioabdoul93@gmail.com";
        user = new UserModel({
          name: profile.displayName,
          email,
          passwordHash: "",
          role: isAdminEmail ? "admin" : "user",
        });
        await user.save();
      }

      done(null, user);
    } catch (err) {
      done(err as Error);
    }
  }
));

// GET /api/auth/google
router.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// GET /api/auth/google/callback
router.get("/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${process.env["CLIENT_URL"]}/login?error=google` }),
  (req, res) => {
    const user = req.user as any;
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.redirect(`${process.env["CLIENT_URL"]}/auth/callback?token=${encodeURIComponent(token)}`);
  }
);


export default router;
