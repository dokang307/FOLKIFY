import { ArrowLeft, Check, Crown, Sparkles, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { useSubscription, type PlanTier } from "../subscription";
import folkifyLogo from "../../assets/logofolkify.png";

type PremiumRouteState = {
  from?: string;
  feature?: string;
  requiredPlan?: "basic" | "pro";
};

export function PremiumPlans() {
  const navigate = useNavigate();
  const location = useLocation();
  const { plan, setPlan } = useSubscription();
  const routeState = (location.state as PremiumRouteState | null) ?? null;

  const redirectTarget = routeState?.from || "/profile";
  const featureLabel = routeState?.feature || "tính năng này";
  const requiredPlan = routeState?.requiredPlan ?? "basic";
  const needsUpgradeForFeature = routeState?.feature
    ? requiredPlan === "pro"
      ? plan !== "pro"
      : plan === "free"
    : false;

  const handleChoosePlan = (nextPlan: PlanTier) => {
    setPlan(nextPlan);
    navigate(redirectTarget, { replace: true });
  };

  const planLabel: Record<PlanTier, string> = {
    free: "Free",
    basic: "Basic",
    pro: "Pro",
  };

  const plans: Array<{
    id: PlanTier;
    title: string;
    tag?: string;
    price: string;
    description: string;
    cta: string;
    features: Array<{ label: string; included: boolean }>;
  }> = [
    {
      id: "free",
      title: "FREE",
      price: "0 VND",
      description: "Trải nghiệm cơ bản - Không cần thẻ tín dụng - Học thử trước khi quyết định",
      cta: "👉 Bắt đầu miễn phí",
      features: [
        { label: "3 bài học video miễn phí/nhạc cụ", included: true },
        { label: "5 sheet nhạc cơ bản", included: true },
        { label: "Lộ trình học Beginner xem trước", included: true },
        { label: "Gamification cơ bản (điểm, streak)", included: true },
        { label: "AI chấm điểm kỹ thuật", included: false },
        { label: "Lộ trình cá nhân hóa", included: false },
        { label: "Toàn bộ thư viện video", included: false },
        { label: "Sheet nhạc nâng cao", included: false },
      ],
    },
    {
      id: "basic",
      title: "BASIC",
      tag: "Phổ biến nhất",
      price: "149K VND/tháng",
      description: "Học toàn diện theo lộ trình - Phù hợp sinh viên - Không có AI feedback",
      cta: "👉 Đăng ký Basic",
      features: [
        { label: "Toàn bộ video học (Beginner → Advanced)", included: true },
        { label: "Thư viện 100+ sheet nhạc truyền thống", included: true },
        { label: "Lộ trình học cá nhân hóa theo mục tiêu", included: true },
        { label: "Theo dõi tiến độ học tập chi tiết", included: true },
        { label: "Gamification đầy đủ + bảng xếp hạng", included: true },
        { label: "Tải sheet nhạc về thiết bị", included: true },
        { label: "AI chấm điểm kỹ thuật", included: false },
        { label: "Phân tích cảm âm nâng cao", included: false },
      ],
    },
    {
      id: "pro",
      title: "PRO",
      price: "199K VND/tháng",
      description: "Đầy đủ tính năng AI - Dành cho người muốn tiến bộ nhanh và đo lường được",
      cta: "👉 Đăng ký Pro",
      features: [
        { label: "Tất cả tính năng của gói Basic", included: true },
        { label: "AI chấm điểm kỹ thuật tức thì", included: true },
        { label: "Phân tích cảm âm & nhịp điệu", included: true },
        { label: "Báo cáo tiến bộ hàng tuần từ AI", included: true },
        { label: "Gợi ý bài luyện tập theo điểm yếu", included: true },
        { label: "Sheet nhạc premium + độc quyền", included: true },
        { label: "Ưu tiên hỗ trợ người dùng", included: true },
        { label: "Truy cập sớm tính năng mới", included: true },
      ],
    },
  ];

  return (
    <div className="flex flex-col min-h-full bg-[#F7FAF8]">
      <div className="bg-gradient-to-br from-[#1A3A2B] to-[#2D6A4F] px-5 pt-12 pb-8 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full" />
        <div className="absolute bottom-2 -left-7 w-24 h-24 bg-white/10 rounded-full" />
        <div className="relative">
          <div className="flex items-center gap-1.5 mb-4 -mt-2">
            <img
              src={folkifyLogo}
              alt="Folkify"
              className="w-10 h-10 rounded-xl"
            />
            <span className="text-white text-xl" style={{ fontWeight: 700 }}>
              Folkify
            </span>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center mb-4"
            aria-label="Quay lại"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-4">
            <Crown size={28} className="text-amber-300" />
          </div>
          <div className="flex items-center gap-2">
            <Crown size={20} className="text-amber-300" />
            <h1 className="text-white text-2xl" style={{ fontWeight: 700 }}>
              Chọn gói học
            </h1>
          </div>
          <p className="text-[#B7E4C7] text-sm mt-2">
            So sánh quyền lợi giữa Free, Basic và Pro.
          </p>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4">
        {needsUpgradeForFeature && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
            <p className="text-amber-800 text-sm">
              Bạn cần gói {requiredPlan === "pro" ? "Pro" : "Basic hoặc Pro"} để dùng{" "}
              <span style={{ fontWeight: 700 }}>{featureLabel}</span>.
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-gray-500 text-xs">Gói hiện tại</p>
          <p className="text-[#1A3A2B] text-lg mt-0.5" style={{ fontWeight: 700 }}>
            {planLabel[plan]}
          </p>
        </div>

        <div className="space-y-4">
          {plans.map((tier) => {
            const isCurrent = plan === tier.id;
            const isPopular = tier.id === "basic";

            return (
              <div
                key={tier.id}
                className={`bg-white rounded-2xl p-4 shadow-sm border ${
                  isCurrent
                    ? "border-[#2D6A4F]"
                    : isPopular
                      ? "border-amber-300"
                      : "border-gray-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-[#1A3A2B] text-base" style={{ fontWeight: 700 }}>
                    {tier.title}
                  </h2>
                  {tier.tag && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      {tier.tag}
                    </span>
                  )}
                  {isCurrent && (
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[#E8F5EE] text-[#2D6A4F]">
                      Đang dùng
                    </span>
                  )}
                </div>

                <p className="text-[#1A3A2B] text-xl mt-2" style={{ fontWeight: 800 }}>
                  {tier.price}
                </p>

                <p className="text-gray-600 text-sm mt-2">{tier.description}</p>

                <div className="mt-4 space-y-2">
                  {tier.features.map((feature) => (
                    <div key={feature.label} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check size={14} className="text-[#2D6A4F] mt-0.5 flex-shrink-0" />
                      ) : (
                        <X size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      )}
                      <p className={`text-sm ${feature.included ? "text-gray-700" : "text-gray-500"}`}>
                        {feature.label}
                        {!feature.included ? " ❌" : ""}
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleChoosePlan(tier.id)}
                  className={`w-full mt-4 py-3 rounded-2xl text-sm ${
                    isCurrent
                      ? "bg-white border border-gray-300 text-gray-500"
                      : tier.id === "pro"
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                        : tier.id === "basic"
                          ? "bg-[#1A3A2B] text-white"
                          : "bg-[#E8F5EE] text-[#1A3A2B]"
                  }`}
                  style={{ fontWeight: 700 }}
                  disabled={isCurrent}
                >
                  {isCurrent ? "Đang sử dụng" : tier.cta}
                </button>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-[#2D6A4F]" />
            <p className="text-[#1A3A2B] text-sm" style={{ fontWeight: 700 }}>
              Lưu ý
            </p>
          </div>
          <p className="text-gray-600 text-xs">
            Bạn có thể đổi gói bất cứ lúc nào trong mục Subscription.
          </p>
        </div>
      </div>
    </div>
  );
}
