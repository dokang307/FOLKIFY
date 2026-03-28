import { FormEvent, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Mail } from "lucide-react";
import folkifyLogo from "../../assets/logofolkify.png";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSent, setIsSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setError("Vui lòng nhập email để nhận hướng dẫn đặt lại mật khẩu.");
      return;
    }

    setError("");
    setIsSent(true);
  }

  return (
    <div className="relative flex justify-center min-h-screen overflow-hidden bg-[#0e2a1f]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(149,213,178,0.45),transparent_35%),radial-gradient(circle_at_85%_15%,rgba(116,198,157,0.35),transparent_40%),linear-gradient(165deg,#0c241b_0%,#1c5440_58%,#3f8f6d_100%)]" />
      <div className="absolute -top-20 -left-14 h-56 w-56 rounded-full bg-[#95D5B2]/25 blur-3xl" />
      <div className="absolute bottom-10 -right-20 h-64 w-64 rounded-full bg-[#D8F3DC]/20 blur-3xl" />
      <div className="absolute top-1/2 left-8 h-24 w-24 rounded-full border border-white/20" />

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
              Quên mật khẩu
            </h1>
            <p className="mt-1 text-sm text-[#D8F3DC] text-center">
              Nhập email, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu cho bạn
            </p>
          </div>

          {isSent ? (
            <div className="rounded-2xl border border-emerald-200/40 bg-emerald-100/85 px-4 py-4 text-center">
              <p className="text-sm text-emerald-900" style={{ fontWeight: 600 }}>
                Đã gửi hướng dẫn đến {email}
              </p>
              <p className="mt-1 text-xs text-emerald-800">
                Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
              </p>
            </div>
          ) : (
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

              {error ? <p className="text-sm text-red-200">{error}</p> : null}

              <button
                type="submit"
                className="w-full rounded-xl bg-[#1B4332] py-3 text-white text-sm transition-colors hover:bg-[#163726] active:scale-[0.99]"
                style={{ fontWeight: 700 }}
              >
                Gửi hướng dẫn đặt lại mật khẩu
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
