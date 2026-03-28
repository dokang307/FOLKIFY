import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import folkifyLogo from "../../assets/logofolkify.png";
import { login, registerUser } from "../auth";

export function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu cần ít nhất 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    const registerResult = registerUser({ name, email, password });
    if (!registerResult.ok) {
      setError(registerResult.error);
      return;
    }

    setError("");
    login(email);
    navigate("/", { replace: true });
  }

  return (
    <div className="relative flex justify-center min-h-screen overflow-hidden bg-[#0e2a1f]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(149,213,178,0.45),transparent_35%),radial-gradient(circle_at_85%_10%,rgba(116,198,157,0.35),transparent_40%),linear-gradient(155deg,#0c241b_0%,#1f5a43_55%,#3f8f6d_100%)]" />
      <div className="absolute -top-16 right-4 h-56 w-56 rounded-full bg-[#95D5B2]/25 blur-3xl" />
      <div className="absolute bottom-0 -left-20 h-64 w-64 rounded-full bg-[#D8F3DC]/20 blur-3xl" />
      <div className="absolute top-2/3 right-8 h-20 w-20 rounded-full border border-white/25" />

      <div className="relative w-full max-w-sm min-h-screen px-6 pt-14 pb-8">
        <div className="rounded-3xl border border-white/30 bg-white/15 px-5 py-6 backdrop-blur-xl shadow-[0_20px_45px_rgba(0,0,0,0.25)]">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-sm text-[#D8F3DC] hover:text-white"
          >
            <ArrowLeft size={16} />
            Quay lại đăng nhập
          </Link>

          <div className="flex flex-col items-center mt-5 mb-7">
            <img
              src={folkifyLogo}
              alt="Folkify"
              className="w-14 h-14 rounded-2xl shadow-md ring-2 ring-white/40"
            />
            <h1 className="mt-4 text-2xl text-white" style={{ fontWeight: 700 }}>
              Tạo tài khoản
            </h1>
            <p className="mt-1 text-sm text-[#D8F3DC] text-center">
              Đăng ký để bắt đầu hành trình học nhạc cụ dân tộc
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-xs text-[#D8F3DC] mb-1 block">Họ và tên</span>
              <div className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/85 px-3 py-3">
                <User size={16} className="text-gray-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm outline-none text-gray-700 placeholder:text-gray-400 bg-transparent"
                  placeholder="Nguyễn Văn A"
                />
              </div>
            </label>

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
                  placeholder="Tối thiểu 6 ký tự"
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

            <label className="block">
              <span className="text-xs text-[#D8F3DC] mb-1 block">Nhập lại mật khẩu</span>
              <div className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/85 px-3 py-3">
                <Lock size={16} className="text-gray-500" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-sm outline-none text-gray-700 placeholder:text-gray-400 bg-transparent"
                  placeholder="Nhập lại mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label={
                    showConfirmPassword ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"
                  }
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {error ? <p className="text-sm text-red-200">{error}</p> : null}

            <button
              type="submit"
              className="w-full rounded-xl bg-[#1B4332] py-3 text-white text-sm transition-colors hover:bg-[#163726] active:scale-[0.99]"
              style={{ fontWeight: 700 }}
            >
              Đăng ký
            </button>

            <p className="text-center text-xs text-[#D8F3DC]">
              Đã có tài khoản?{" "}
              <Link to="/login" className="text-white underline underline-offset-2">
                Đăng nhập
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
