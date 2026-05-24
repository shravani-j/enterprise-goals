"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

function AuthForms({ authView, setAuthView }: { authView: string, setAuthView: any }) {
  const router = useRouter();
  
  // Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  
  // Register State
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("EMPLOYEE");
  const [regManagerEmail, setRegManagerEmail] = useState("");
  const [regCompanyCode, setRegCompanyCode] = useState("ENTERPRISE2026");
  const [regError, setRegError] = useState("");

  // Common State
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError("");
    const res = await signIn("credentials", {
      email: loginEmail,
      password: loginPassword,
      redirect: false,
    });
    if (res?.error) {
      setLoginError("Invalid credentials");
      setIsLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setRegError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          companyCode: regCompanyCode,
          role: regRole,
          managerEmail: regRole === "EMPLOYEE" ? regManagerEmail.trim() : undefined,
        }),
      });
      if (res.ok) {
        setAuthView("LOGIN");
        setLoginEmail(regEmail);
        setRegName("");
        setRegPassword("");
        setRegCompanyCode("");
      } else {
        const data = await res.json();
        setRegError(data.message || "Registration failed");
      }
    } catch (err) {
      setRegError("Error during registration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {authView === "LOGIN" && (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold font-manrope text-zinc-900">Welcome back</h2>
              <p className="text-sm text-zinc-500 mt-2 font-inter">Sign in to your enterprise account</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && <p className="text-sm text-red-500 text-center bg-red-50 p-2 rounded">{loginError}</p>}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1 font-inter">Email</label>
                <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-mimosa)] transition-all text-zinc-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1 font-inter">Password</label>
                <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-mimosa)] transition-all text-zinc-900" />
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => setAuthView("FORGOT_PASSWORD")} className="text-sm font-medium text-[var(--color-dijon)] hover:underline font-inter">Forgot password?</button>
              </div>
              <button type="submit" disabled={isLoading} className="w-full py-2.5 bg-[var(--color-dijon)] text-white font-medium rounded-lg hover:bg-amber-600 transition-colors shadow-lg shadow-[var(--color-dijon)]/30 disabled:opacity-50 mt-4">
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>
            <div className="mt-6 text-center text-sm text-zinc-600 font-inter">
              Don't have an account? <button onClick={() => setAuthView("REGISTER")} className="font-medium text-[var(--color-dijon)] hover:underline">Register here</button>
            </div>
          </motion.div>
        )}

        {authView === "REGISTER" && (
          <motion.div
            key="register"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold font-manrope text-zinc-900">Create Account</h2>
              <p className="text-sm text-zinc-500 mt-2 font-inter">Join the enterprise portal</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {regError && <p className="text-sm text-red-500 text-center bg-red-50 p-2 rounded">{regError}</p>}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1 font-inter">Full Name</label>
                <input type="text" required value={regName} onChange={e => setRegName(e.target.value)} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-mimosa)] text-zinc-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1 font-inter">Email</label>
                <input type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-mimosa)] text-zinc-900" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1 font-inter">Password</label>
                  <input type="password" required value={regPassword} onChange={e => setRegPassword(e.target.value)} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-mimosa)] text-zinc-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1 font-inter">Role</label>
                  <select value={regRole} onChange={e => setRegRole(e.target.value)} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-mimosa)] text-zinc-900">
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
              {regRole === "EMPLOYEE" && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1 font-inter">Manager Email</label>
                  <input
                    type="email"
                    value={regManagerEmail}
                    onChange={e => setRegManagerEmail(e.target.value)}
                    placeholder="manager@enterprise.com"
                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-mimosa)] text-zinc-900"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1 font-inter">Company Code</label>
                <input type="text" required value={regCompanyCode} onChange={e => setRegCompanyCode(e.target.value)} placeholder="ENTERPRISE2026" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-mimosa)] text-zinc-900" />
              </div>
              <button type="submit" disabled={isLoading} className="w-full py-2.5 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-900/20 disabled:opacity-50 mt-4">
                {isLoading ? "Creating..." : "Create Account"}
              </button>
            </form>
            <div className="mt-6 text-center text-sm text-zinc-600 font-inter">
              Already have an account? <button onClick={() => setAuthView("LOGIN")} className="font-medium text-[var(--color-dijon)] hover:underline">Sign in</button>
            </div>
          </motion.div>
        )}

        {authView === "FORGOT_PASSWORD" && (
          <motion.div
            key="forgot"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold font-manrope text-zinc-900">Reset Password</h2>
              <p className="text-sm text-zinc-500 mt-2 font-inter">Enter your email to receive a reset link</p>
            </div>
            <form onSubmit={e => { e.preventDefault(); alert("Reset link sent!"); setAuthView("LOGIN"); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1 font-inter">Email</label>
                <input type="email" required className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-mimosa)] text-zinc-900" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-[var(--color-dijon)] text-white font-medium rounded-lg hover:bg-amber-600 transition-colors shadow-lg shadow-[var(--color-dijon)]/30 mt-4">
                Send Reset Link
              </button>
            </form>
            <div className="mt-6 text-center text-sm">
              <button onClick={() => setAuthView("LOGIN")} className="font-medium text-zinc-500 hover:text-zinc-800 font-inter">← Back to login</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LandingPage() {
  const [animationStage, setAnimationStage] = useState<"INTRO" | "AUTH">("INTRO");
  const [authView, setAuthView] = useState<"LOGIN" | "REGISTER" | "FORGOT_PASSWORD">("LOGIN");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const timer = setTimeout(() => {
      setAnimationStage("AUTH");
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!isClient) return <div className="min-h-screen bg-white" />; // Prevent hydration mismatch

  return (
    <div className="relative min-h-screen bg-white text-zinc-900 overflow-hidden flex flex-col items-center justify-center font-sans">
      
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-[var(--color-mimosa)] mix-blend-multiply filter blur-[120px] opacity-70 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50rem] h-[50rem] rounded-full bg-[var(--color-flax)] mix-blend-multiply filter blur-[150px] opacity-60" />
      </div>

      {/* Logo Container */}
      <motion.div
        className="absolute z-50 flex items-center gap-3 font-poppins font-bold tracking-tight"
        initial={{ top: "50%", left: "50%", x: "-50%", y: "-50%", scale: 1.5 }}
        animate={
          animationStage === "AUTH"
            ? { top: "2rem", left: "2rem", x: "0%", y: "0%", scale: 0.9 }
            : { top: "50%", left: "50%", x: "-50%", y: "-50%", scale: 1.5 }
        }
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="w-12 h-12 rounded-xl bg-[var(--color-dijon)] flex items-center justify-center text-white shadow-xl shadow-[var(--color-dijon)]/40">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-3xl text-zinc-900">Enterprise<span className="text-[var(--color-dijon)]">Goals</span></span>
      </motion.div>

      {/* Auth Panel */}
      <AnimatePresence>
        {animationStage === "AUTH" && (
          <motion.div
            className="z-10 w-full max-w-md px-8 py-10 bg-white/80 backdrop-blur-xl border border-zinc-100 shadow-2xl rounded-3xl mx-4"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
             <AuthForms authView={authView} setAuthView={setAuthView} />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
