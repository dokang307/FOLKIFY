import { useState } from "react";
import { useNavigate } from "react-router";
import { createPortal } from "react-dom";
import {
  Bell,
  ChevronRight,
  Play,
  Star,
  Flame,
  Target,
  Trophy,
  Clock,
  Zap,
  FileText,
} from "lucide-react";
import { instruments } from "../data/instruments";
import danTranhImg from "@/assets/dantranh.jpg";
import saoImg from "../../assets/sao.png";
import danBauImg from "../../assets/danbau.jpg";
import danNguyetImg from "../../assets/dannguyet.jpg";
import danNhiImg from "../../assets/dannhi.jpg";
import tyBaImg from "../../assets/tyba.jpg";
import folkifyLogo from "../../assets/logofolkify.png";
import { getCurrentUser } from "../auth";

const instrumentPhotos: Record<string, string> = {
  "dan-tranh": danTranhImg,
  "sao-truc": saoImg,
  "dan-bau": danBauImg,
  "dan-nguyet": danNguyetImg,
  "dan-nhi": danNhiImg,
  "dan-ty-ba": tyBaImg,
};

const featuredInstrument = instruments[0];

const recentLessons = [
  {
    instrumentId: "dan-tranh",
    lessonId: "dt-3",
    title: "Bài Lý Con Sáo",
    instrument: "Đàn Tranh",
    progress: 35,
    color: "from-amber-400 to-amber-600",
  },
  {
    instrumentId: "sao-truc",
    lessonId: "st-3",
    title: "Bài Trống Cơm",
    instrument: "Sáo Trúc",
    progress: 60,
    color: "from-emerald-400 to-green-600",
  },
];

const achievements = [
  {
    icon: Flame,
    label: "7 ngày liên tiếp",
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  {
    icon: Star,
    label: "Nhạc cụ đầu tiên",
    color: "text-yellow-500",
    bg: "bg-yellow-50",
  },
  {
    icon: Trophy,
    label: "Hoàn thành 5 bài",
    color: "text-[#2D6A4F]",
    bg: "bg-[#E8F5EE]",
  },
];

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  action: "lesson" | "practice" | "sheets";
  instrumentId?: string;
  lessonId?: string;
};

const mockNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Nhắc học hôm nay",
    message: "Bạn còn 15 phút luyện Sáo Trúc để giữ streak 7 ngày.",
    time: "5 phút trước",
    unread: true,
    action: "practice",
  },
  {
    id: "notif-2",
    title: "Bài học mới",
    message: "Đã mở khóa bài Lý Con Sáo cho Đàn Tranh.",
    time: "1 giờ trước",
    unread: true,
    action: "lesson",
    instrumentId: "dan-tranh",
    lessonId: "dt-3",
  },
  {
    id: "notif-3",
    title: "Sheet nhạc mới",
    message: "Thư viện vừa thêm 2 sheet dân ca mới.",
    time: "Hôm qua",
    unread: true,
    action: "sheets",
  },
  {
    id: "notif-4",
    title: "Mục tiêu tuần",
    message: "Bạn đã hoàn thành 4/5 buổi học tuần này.",
    time: "2 ngày trước",
    unread: false,
    action: "practice",
  },
];

export function Home() {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const userName = getCurrentUser()?.name ?? "Học viên";

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notification.id ? { ...item, unread: false } : item,
      ),
    );
    setShowNotifications(false);

    if (notification.action === "practice") {
      navigate("/practice");
      return;
    }

    if (notification.action === "sheets") {
      navigate("/sheets");
      return;
    }

    if (
      notification.action === "lesson" &&
      notification.instrumentId &&
      notification.lessonId
    ) {
      navigate(
        `/learn/${notification.instrumentId}/lesson/${notification.lessonId}`,
      );
      return;
    }

    navigate("/learn");
  };

  const totalLessons = instruments.reduce(
    (acc, i) => acc + i.lessons.length,
    0,
  );
  const completedLessons = instruments.reduce(
    (acc, i) => acc + i.lessons.filter((l) => l.completed).length,
    0,
  );
  const progressPercent = Math.round((completedLessons / totalLessons) * 100);
  const totalXp = instruments.reduce(
    (acc, i) =>
      acc + i.lessons.filter((l) => l.completed).reduce((s, l) => s + l.xp, 0),
    0,
  );

  const notificationOverlay =
    showNotifications &&
    createPortal(
      <div className="fixed inset-0 z-[70]">
        <button
          aria-label="Đóng thông báo"
          onClick={() => setShowNotifications(false)}
          className="absolute inset-0 bg-black/20"
        />
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-full max-w-sm px-4">
          <div className="bg-white rounded-2xl border border-[#D8F3DC] shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-[#1A3A2B] text-sm" style={{ fontWeight: 700 }}>
                Thông báo
              </p>
              <button
                onClick={markAllAsRead}
                className="text-[#2D6A4F] text-xs"
                style={{ fontWeight: 600 }}
              >
                Đánh dấu đã đọc
              </button>
            </div>

            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-gray-400">
                Chưa có thông báo mới
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                {notifications.map((notification, index) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full px-4 py-3 text-left transition-colors active:bg-gray-50 ${
                      index < notifications.length - 1
                        ? "border-b border-gray-100"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="pt-1">
                        <span
                          className={`block w-2 h-2 rounded-full ${
                            notification.unread ? "bg-[#52B788]" : "bg-gray-300"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-sm truncate ${
                              notification.unread
                                ? "text-[#1A3A2B]"
                                : "text-gray-600"
                            }`}
                            style={{ fontWeight: notification.unread ? 700 : 600 }}
                          >
                            {notification.title}
                          </p>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap">
                            {notification.time}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body,
    );

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="header-green-full bg-[#1A3A2B] px-5 pt-12 pb-8 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute top-8 -right-4 w-24 h-24 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/5" />

        <div className="relative">
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

          {/* Brand row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div>
                <p className="text-[#95D5B2] text-[11px] leading-none">
                  Chào mừng trở lại
                </p>
              </div>
            </div>
            <button
              className="relative w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/10"
              onClick={() => setShowNotifications((prev) => !prev)}
              aria-label="Mở thông báo"
            >
              <Bell size={17} className="text-[#95D5B2]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#52B788] rounded-full text-[9px] font-bold text-[#1A3A2B] flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* User greeting */}
          <div className="mb-4">
            <h1 className="text-white text-xl" style={{ fontWeight: 700 }}>
              {userName}
            </h1>
            <p className="text-[#52B788] text-sm mt-0.5">Học viên · Cấp độ 3</p>
          </div>

          {/* Progress Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[#95D5B2] text-xs mb-0.5">Tiến độ học tập</p>
                <p className="text-white text-lg" style={{ fontWeight: 700 }}>
                  {completedLessons}/{totalLessons} bài
                </p>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-[#95D5B2]">
                    <Flame size={13} className="text-orange-400" />
                    <span
                      className="text-sm text-white"
                      style={{ fontWeight: 700 }}
                    >
                      7
                    </span>
                  </div>
                  <p className="text-[#52B788] text-[10px]">streak</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1">
                    <Zap size={13} className="text-yellow-400" />
                    <span
                      className="text-sm text-white"
                      style={{ fontWeight: 700 }}
                    >
                      {totalXp}
                    </span>
                  </div>
                  <p className="text-[#52B788] text-[10px]">XP</p>
                </div>
              </div>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#52B788] to-[#95D5B2] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[#52B788] text-xs mt-1.5">
              {progressPercent}% hoàn thành
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-5 space-y-6">
        {/* Daily Challenge */}
        <div
          className="bg-gradient-to-r from-[#2D6A4F] to-[#1A3A2B] rounded-2xl p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform border border-[#52B788]/20"
          onClick={() => navigate("/practice")}
        >
          <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
            <Target size={22} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[#95D5B2] text-xs mb-0.5">Thử thách hôm nay</p>
            <p className="text-white text-sm" style={{ fontWeight: 600 }}>
              Luyện 15 phút Sáo Trúc
            </p>
          </div>
          <div className="flex items-center gap-1 bg-[#52B788]/30 rounded-lg px-2.5 py-1.5">
            <Play size={12} fill="white" className="text-white" />
            <span className="text-white text-xs" style={{ fontWeight: 600 }}>
              Bắt đầu
            </span>
          </div>
        </div>

        {/* Continue Learning */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-[#1A3A2B] text-base"
              style={{ fontWeight: 700 }}
            >
              Tiếp tục học
            </h2>
            <button
              onClick={() => navigate("/learn")}
              className="flex items-center gap-0.5 text-[#2D6A4F] text-xs"
              style={{ fontWeight: 600 }}
            >
              Xem tất cả <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {recentLessons.map((lesson, i) => (
              <div
                key={i}
                onClick={() =>
                  navigate(
                    `/learn/${lesson.instrumentId}/lesson/${lesson.lessonId}`,
                  )
                }
                className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-100 cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${lesson.color} flex items-center justify-center flex-shrink-0`}
                >
                  <Play size={16} fill="white" className="text-white ml-0.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-gray-800 text-sm truncate"
                    style={{ fontWeight: 600 }}
                  >
                    {lesson.title}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {lesson.instrument}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${lesson.color} rounded-full`}
                        style={{ width: `${lesson.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">
                      {lesson.progress}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Instrument */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-[#1A3A2B] text-base"
              style={{ fontWeight: 700 }}
            >
              Nhạc cụ nổi bật
            </h2>
          </div>
          <div
            onClick={() => navigate(`/learn/${featuredInstrument.id}`)}
            className="relative rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
            style={{ height: 180 }}
          >
            <img
              src={featuredInstrument.image}
              alt={featuredInstrument.name}
              className="w-full h-full object-cover object-[50%_22%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A3A2B]/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-xs bg-[#2D6A4F]/70 text-[#95D5B2] px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {featuredInstrument.category}
                  </span>
                  <h3
                    className="text-white text-lg mt-1"
                    style={{ fontWeight: 700 }}
                  >
                    {featuredInstrument.name}
                  </h3>
                  <p className="text-[#95D5B2] text-xs">
                    {featuredInstrument.lessons.length} bài học
                  </p>
                </div>
                <div className="w-10 h-10 bg-[#2D6A4F] rounded-full flex items-center justify-center">
                  <ChevronRight size={18} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Access Instruments */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-[#1A3A2B] text-base"
              style={{ fontWeight: 700 }}
            >
              Khám phá nhạc cụ
            </h2>
            <button
              onClick={() => navigate("/learn")}
              className="flex items-center gap-0.5 text-[#2D6A4F] text-xs"
              style={{ fontWeight: 600 }}
            >
              Xem tất cả <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {instruments.slice(0, 6).map((inst) => (
              <div
                key={inst.id}
                onClick={() => navigate(`/learn/${inst.id}`)}
                className="bg-white rounded-2xl overflow-hidden flex flex-col items-center cursor-pointer active:scale-[0.96] transition-transform border border-gray-100 shadow-sm"
              >
                <div className="w-full h-28 overflow-hidden">
                  <img
                    src={instrumentPhotos[inst.id] || ""}
                    alt={inst.name}
                    className="w-full h-full object-cover object-[50%_22%]"
                  />
                </div>
                <p
                  className="w-full bg-[#2D6A4F] text-white text-[11px] text-center py-2 px-1"
                  style={{ fontWeight: 600, lineHeight: 1.2 }}
                >
                  {inst.name}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Achievements */}
        <section>
          <h2
            className="text-[#1A3A2B] text-base mb-3"
            style={{ fontWeight: 700 }}
          >
            Thành tích
          </h2>
          <div className="flex gap-3">
            {achievements.map((ach, i) => (
              <div
                key={i}
                className="flex-1 bg-white rounded-2xl p-3 flex flex-col items-center gap-2 shadow-sm border border-gray-100"
              >
                <div
                  className={`w-10 h-10 ${ach.bg} rounded-xl flex items-center justify-center`}
                >
                  <ach.icon size={20} className={ach.color} />
                </div>
                <p
                  className="text-gray-700 text-[10px] text-center"
                  style={{ fontWeight: 500, lineHeight: 1.3 }}
                >
                  {ach.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Sheet Music Banner */}
        <div
          onClick={() => navigate("/sheets")}
          className="bg-gradient-to-r from-[#1A3A2B] to-[#2D6A4F] rounded-2xl p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform"
        >
          <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText size={22} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[#95D5B2] text-xs mb-0.5">Thư viện sheet nhạc</p>
            <p className="text-white text-sm" style={{ fontWeight: 600 }}>
              Khám phá 8+ bản nhạc dân tộc
            </p>
          </div>
          <ChevronRight size={16} className="text-[#52B788]" />
        </div>

        {/* Study Timer */}
        <div
          onClick={() => navigate("/practice")}
          className="bg-white rounded-2xl p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform border border-gray-100 shadow-sm"
        >
          <div className="w-12 h-12 bg-[#E8F5EE] rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock size={22} className="text-[#2D6A4F]" />
          </div>
          <div className="flex-1">
            <p className="text-gray-400 text-xs">Thời gian học hôm nay</p>
            <p className="text-[#1A3A2B] text-base" style={{ fontWeight: 700 }}>
              45 phút
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs">Mục tiêu</p>
            <p className="text-[#2D6A4F] text-sm" style={{ fontWeight: 600 }}>
              60 phút
            </p>
          </div>
        </div>
      </div>
      {notificationOverlay}
    </div>
  );
}
