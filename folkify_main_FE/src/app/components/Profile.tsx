import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Settings,
  ChevronRight,
  Star,
  Flame,
  Trophy,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  Edit2,
  CheckCircle,
  Zap,
  Crown,
  Clock3,
} from "lucide-react";
import { instruments } from "../data/instruments";
import { useSubscription } from "../subscription";
import folkifyLogo from "../../assets/logofolkify.png";
import { getCurrentUser, logout } from "../auth";

const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const studyData = [25, 45, 0, 60, 30, 45, 20];
const maxStudy = Math.max(...studyData);

export function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const { plan } = useSubscription();
  const userName = getCurrentUser()?.name ?? "Học viên";
  const planLabel = plan === "free" ? "Free" : plan === "basic" ? "Basic" : "Pro";

  const completedLessons = instruments.reduce(
    (acc, i) => acc + i.lessons.filter((l) => l.completed).length,
    0,
  );
  const totalXp = instruments.reduce(
    (acc, i) =>
      acc + i.lessons.filter((l) => l.completed).reduce((s, l) => s + l.xp, 0),
    0,
  );
  const totalMinutes = studyData.reduce((a, b) => a + b, 0);
  const streakDays = 7;

  const badges = [
    {
      icon: Star,
      name: "Nhạc sĩ mới",
      desc: "Hoàn thành bài học đầu tiên",
      earned: true,
    },
    {
      icon: Flame,
      name: "Kiên trì",
      desc: "Học 7 ngày liên tiếp",
      earned: true,
    },
    {
      icon: Trophy,
      name: "Thành thạo",
      desc: "Hoàn thành 10 bài học",
      earned: false,
    },
    {
      icon: Crown,
      name: "Đa năng",
      desc: "Học 3 nhạc cụ khác nhau",
      earned: false,
    },
    {
      icon: Zap,
      name: "Xuất sắc",
      desc: "Đạt 100% một bài học",
      earned: true,
    },
    {
      icon: CheckCircle,
      name: "Biểu diễn",
      desc: "Hoàn thành 5 bài hòa tấu",
      earned: false,
    },
  ];

  const menuItems = [
    {
      section: "Tài khoản",
      items: [
        { icon: Bell, label: "Thông báo nhắc nhở", action: () => {} },
        { icon: Shield, label: "Quyền riêng tư", action: () => {} },
        { icon: Settings, label: "Cài đặt chung", action: () => {} },
      ],
    },
    {
      section: "Hỗ trợ",
      items: [
        { icon: HelpCircle, label: "Trung tâm hỗ trợ", action: () => {} },
        { icon: Star, label: "Đánh giá ứng dụng", action: () => {} },
        {
          icon: LogOut,
          label: "Đăng xuất",
          action: () => {
            logout();
            navigate("/login");
          },
          danger: true,
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col min-h-full bg-[#F7FAF8]">
      {/* Header */}
      <div className="header-green-full bg-[#1A3A2B] px-5 pt-12 pb-8 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute bottom-0 -left-6 w-24 h-24 rounded-full bg-white/5" />

        {/* Folkify brand */}
        <div className="flex items-center gap-1.5 mb-5 -mt-2">
          <img
            src={folkifyLogo}
            alt="Folkify"
            className="w-10 h-10 rounded-xl"
          />
          <span className="text-white text-xl" style={{ fontWeight: 700 }}>
            Folkify
          </span>
        </div>

        <div className="relative flex flex-col items-center">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#52B788] to-[#2D6A4F] flex items-center justify-center shadow-xl border-2 border-[#95D5B2]/30">
              <Star size={30} className="text-[#E8F5EE]" />
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Edit2 size={12} className="text-[#1A3A2B]" />
            </button>
          </div>
          <h1 className="text-white text-xl" style={{ fontWeight: 700 }}>
            {userName}
          </h1>
          <p className="text-[#52B788] text-sm mt-0.5">Học viên · 30 ngày</p>

          {/* Stats Row */}
          <div className="flex gap-3 mt-5 w-full">
            {[
              { label: "Bài học", value: completedLessons, icon: Clock3 },
              { label: "Streak", value: streakDays, icon: Flame },
              { label: "XP", value: totalXp, icon: Zap },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex-1 bg-white/10 rounded-2xl p-3 text-center"
              >
                <div className="flex justify-center mb-1">
                  <stat.icon size={18} className="text-[#95D5B2]" />
                </div>
                <p className="text-white text-lg" style={{ fontWeight: 700 }}>
                  {stat.value}
                </p>
                <p className="text-[#52B788] text-[10px]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-4">
        <div className="flex">
          {["Tổng quan", "Huy hiệu", "Cài đặt"].map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`flex-1 py-3 text-sm transition-all relative ${
                activeTab === i ? "text-[#1A3A2B]" : "text-gray-400"
              }`}
              style={{ fontWeight: activeTab === i ? 700 : 400 }}
            >
              {tab}
              {activeTab === i && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-[#2D6A4F] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-5">
        <button
          onClick={() =>
            navigate("/premium", {
              state: {
                from: "/profile",
                feature: "quản lý gói subscription",
              },
            })
          }
          className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 active:scale-[0.99] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Crown size={18} className="text-amber-500" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[#1A3A2B] text-sm" style={{ fontWeight: 700 }}>
              Subscription
            </p>
              <p className="text-gray-500 text-xs mt-0.5">
                Gói hiện tại:{" "}
                <span style={{ fontWeight: 700 }}>{planLabel}</span>
              </p>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </button>

        {/* Overview Tab */}
        {activeTab === 0 && (
          <>
            {/* Weekly Chart */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p
                className="text-[#1A3A2B] text-sm mb-4"
                style={{ fontWeight: 700 }}
              >
                Hoạt động tuần này
              </p>
              <div className="flex items-end gap-2 h-24">
                {weekDays.map((day, i) => {
                  const height =
                    studyData[i] === 0 ? 4 : (studyData[i] / maxStudy) * 80;
                  const isToday = i === 4;
                  return (
                    <div
                      key={day}
                      className="flex-1 flex flex-col items-center gap-1.5"
                    >
                      <div
                        className={`w-full rounded-lg transition-all ${
                          studyData[i] === 0
                            ? "bg-gray-100"
                            : isToday
                              ? "bg-gradient-to-t from-[#1A3A2B] to-[#52B788]"
                              : "bg-gradient-to-t from-[#2D6A4F] to-[#95D5B2]"
                        }`}
                        style={{ height: `${height}px` }}
                      />
                      <span
                        className={`text-[10px] ${isToday ? "text-[#2D6A4F]" : "text-gray-400"}`}
                        style={{ fontWeight: isToday ? 700 : 400 }}
                      >
                        {day}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-gray-500 text-xs mt-3 text-center">
                Tổng:{" "}
                <span className="text-[#2D6A4F]" style={{ fontWeight: 700 }}>
                  {totalMinutes} phút
                </span>{" "}
                trong tuần
              </p>
            </div>

            {/* Progress by instrument */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p
                className="text-[#1A3A2B] text-sm mb-4"
                style={{ fontWeight: 700 }}
              >
                Tiến độ theo nhạc cụ
              </p>
              <div className="space-y-3">
                {instruments.map((inst) => {
                  const done = inst.lessons.filter((l) => l.completed).length;
                  const pct = Math.round((done / inst.lessons.length) * 100);
                  const instXp = inst.lessons
                    .filter((l) => l.completed)
                    .reduce((s, l) => s + l.xp, 0);
                  return (
                    <div key={inst.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-gray-700 text-xs"
                            style={{ fontWeight: 600 }}
                          >
                            {inst.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {instXp > 0 && (
                            <div className="flex items-center gap-0.5">
                              <Zap size={10} className="text-yellow-500" />
                              <span
                                className="text-yellow-600 text-[10px]"
                                style={{ fontWeight: 600 }}
                              >
                                {instXp} XP
                              </span>
                            </div>
                          )}
                          <span className="text-gray-400 text-[10px]">
                            {done}/{inst.lessons.length}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#2D6A4F] to-[#52B788] rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Streak */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Flame size={20} className="text-orange-500" />
                </div>
                <div>
                  <p
                    className="text-orange-800 text-sm"
                    style={{ fontWeight: 700 }}
                  >
                    {streakDays} ngày liên tiếp!
                  </p>
                  <p className="text-orange-600 text-xs">
                    Hãy giữ vững phong độ
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: 14 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-6 rounded-md ${i < streakDays ? "bg-orange-400" : "bg-orange-100"}`}
                  />
                ))}
              </div>
              <p className="text-orange-500 text-[11px] mt-2">
                14 ngày gần nhất
              </p>
            </div>
          </>
        )}

        {/* Badges Tab */}
        {activeTab === 1 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {badges.map((badge, i) => (
                <div
                  key={i}
                  className={`bg-white rounded-2xl p-4 shadow-sm border flex flex-col items-center gap-2 text-center ${
                    badge.earned
                      ? "border-[#52B788]/40"
                      : "border-gray-100 opacity-50"
                  }`}
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center ${
                      badge.earned ? "bg-[#E8F5EE]" : "bg-gray-100"
                    }`}
                  >
                    <badge.icon
                      size={28}
                      className={badge.earned ? "text-[#2D6A4F]" : "text-gray-400"}
                    />
                  </div>
                  <div>
                    <p
                      className="text-[#1A3A2B] text-xs"
                      style={{ fontWeight: 700 }}
                    >
                      {badge.name}
                    </p>
                    <p className="text-gray-400 text-[10px] mt-0.5 leading-relaxed">
                      {badge.desc}
                    </p>
                  </div>
                  {badge.earned && (
                    <div className="flex items-center gap-1 text-[#2D6A4F]">
                      <CheckCircle size={12} />
                      <span className="text-[10px]">Đã đạt</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-[#E8F5EE] rounded-2xl p-4 border border-[#52B788]/30 text-center">
              <p className="text-[#1A3A2B] text-sm" style={{ fontWeight: 700 }}>
                {badges.filter((b) => b.earned).length}/{badges.length} huy hiệu
              </p>
              <p className="text-[#2D6A4F] text-xs mt-1">
                Tiếp tục học để mở khóa thêm huy hiệu!
              </p>
            </div>
          </>
        )}

        {/* Settings Tab */}
        {activeTab === 2 && (
          <>
            {menuItems.map((section) => (
              <div key={section.section}>
                <p
                  className="text-gray-400 text-xs mb-2 px-1 uppercase"
                  style={{ fontWeight: 600, letterSpacing: "0.05em" }}
                >
                  {section.section}
                </p>
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                  {section.items.map((item, i) => (
                    <button
                      key={i}
                      onClick={item.action}
                      className={`w-full flex items-center gap-3 p-4 transition-colors active:bg-gray-50 ${
                        i < section.items.length - 1
                          ? "border-b border-gray-50"
                          : ""
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          (item as any).danger ? "bg-red-50" : "bg-[#E8F5EE]"
                        }`}
                      >
                        <item.icon
                          size={16}
                          className={
                            (item as any).danger
                              ? "text-red-500"
                              : "text-[#2D6A4F]"
                          }
                        />
                      </div>
                      <p
                        className={`flex-1 text-sm text-left ${
                          (item as any).danger
                            ? "text-red-500"
                            : "text-gray-700"
                        }`}
                        style={{ fontWeight: 500 }}
                      >
                        {item.label}
                      </p>
                      <ChevronRight size={16} className="text-gray-300" />
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <img
                  src={folkifyLogo}
                  alt="Folkify"
                  className="w-8 h-8 rounded-lg"
                />
                <span
                  className="text-gray-400 text-sm"
                  style={{ fontWeight: 600 }}
                >
                  Folkify v1.0.0
                </span>
              </div>
              <p className="text-gray-300 text-xs">
                Bảo tồn văn hóa âm nhạc truyền thống Việt Nam
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
