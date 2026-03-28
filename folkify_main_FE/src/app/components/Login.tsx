import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import folkifyLogo from "../../assets/logofolkify.png";
import { authenticateUser, login } from "../auth";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const state = location.state as { from?: string } | null;
  const redirectTo =
    state?.from && state.from.startsWith("/") ? state.from : "/";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Vui lòng nhập email và mật khẩu.");
      return;
    }

    const loginResult = authenticateUser({ email, password });
    if (!loginResult.ok) {
      setError(loginResult.error);
      return;
    }

    setError("");
    login(loginResult.user.email);
    navigate(redirectTo, { replace: true });
  }

  return (
    <div className="relative flex justify-center min-h-screen overflow-hidden bg-[#0e2a1f]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(149,213,178,0.45),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(116,198,157,0.35),transparent_40%),linear-gradient(160deg,#0e2a1f_0%,#1f5a43_60%,#3f8f6d_100%)]" />
      <div className="absolute -top-20 -right-14 h-56 w-56 rounded-full bg-[#95D5B2]/30 blur-3xl" />
      <div className="absolute top-1/3 -left-20 h-64 w-64 rounded-full bg-[#D8F3DC]/20 blur-3xl" />
      <div className="absolute bottom-8 right-6 h-24 w-24 rounded-full border border-white/25" />

      <div className="relative w-full max-w-sm min-h-screen px-6 pt-14 pb-8">
        <div className="rounded-3xl border border-white/30 bg-white/15 px-5 py-6 backdrop-blur-xl shadow-[0_20px_45px_rgba(0,0,0,0.25)]">
          <div className="flex flex-col items-center mb-7">
            <img
              src={folkifyLogo}
              alt="Folkify"
              className="w-16 h-16 rounded-2xl shadow-md ring-2 ring-white/40"
            />
            <h1
              className="mt-4 text-2xl text-white"
              style={{ fontWeight: 700 }}
            >
              Đăng nhập
            </h1>
            <p className="mt-1 text-sm text-[#D8F3DC] text-center">
              Đăng nhập để bắt đầu học nhạc cụ cùng Folkify
            </p>
          </div>

          <div className="mb-4 flex items-center justify-center gap-2 text-[11px] text-[#E8F5EE]">
            <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1">
              Dân tộc Việt
            </span>
            <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1">
              Học theo bài
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-xs text-[#D8F3DC] mb-1 block">Email</span>
              <div className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/85 px-3 py-3">
                <Mail size={16} className="text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm outline-none text-gray-700 placeholder:text-gray-400 bg-transparent"
                  placeholder="you@example.com"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs text-[#D8F3DC] mb-1 block">Mật khẩu</span>
              <div className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/85 px-3 py-3">
                <Lock size={16} className="text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-sm outline-none text-gray-700 placeholder:text-gray-400 bg-transparent"
                  placeholder="Nhập mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {error ? <p className="text-sm text-red-200">{error}</p> : null}

            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-xs text-[#D8F3DC] hover:text-white"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#1B4332] py-3 text-white text-sm transition-colors hover:bg-[#163726] active:scale-[0.99]"
              style={{ fontWeight: 700 }}
            >
              Đăng nhập
            </button>

            <p className="text-center text-xs text-[#D8F3DC]">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="text-white underline underline-offset-2"
              >
                Đăng ký
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
