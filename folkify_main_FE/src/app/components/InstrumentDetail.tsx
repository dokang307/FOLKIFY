import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Star,
  Play,
  CheckCircle,
  Lock,
  ChevronRight,
  Music,
  Info,
  MapPin,
  Layers,
  Zap,
  Clock3,
} from "lucide-react";
import { instruments } from "../data/instruments";
import { getCompletedLessonsCount, isLessonCompleted } from "../data/lessonProgress";
import folkifyLogo from "../../assets/logofolkify.png";

const tabs = ["Bài học", "Bài hát", "Thông tin"];
const clipStatusLabel = {
  available: "Đã có clip",
  in_progress: "Clip đang hoàn thiện",
  coming_soon: "Clip sắp có",
} as const;

export function InstrumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const instrument = instruments.find((i) => i.id === id);
  if (!instrument) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F7FAF8]">
        <div className="text-center">
          <p className="text-gray-500">Không tìm thấy nhạc cụ</p>
          <button onClick={() => navigate("/learn")} className="mt-3 text-[#2D6A4F] text-sm">
            ← Quay lại
          </button>
        </div>
      </div>
    );
  }

  const completedLessons = getCompletedLessonsCount(instrument);
  const progressPercent = Math.round((completedLessons / instrument.lessons.length) * 100);

  const beginnerLessons = instrument.lessons.filter((l) => l.level === "Beginner");
  const intermediateLessons = instrument.lessons.filter((l) => l.level === "Intermediate");
  const advancedLessons = instrument.lessons.filter((l) => l.level === "Advanced");

  return (
    <div className="flex flex-col min-h-full bg-[#F7FAF8]">
      {/* Hero */}
      <div className="relative h-56 overflow-hidden">
        <img src={instrument.image} alt={instrument.name} className="w-full h-full object-cover object-[50%_22%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A3A2B]/90 via-black/20 to-black/10" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-12 left-4 w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>

        <div className="absolute top-12 right-4 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm rounded-xl px-2.5 py-1.5">
          <img
            src={folkifyLogo}
            alt="Folkify"
            className="w-6 h-6 rounded-lg"
          />
          <span className="text-white text-sm" style={{ fontWeight: 700 }}>
            Folkify
          </span>
        </div>

        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs bg-[#2D6A4F]/70 text-[#95D5B2] px-2.5 py-1 rounded-full backdrop-blur-sm">
                {instrument.category}
              </span>
              <div className="flex items-center gap-2 mt-2">
                <Music size={18} className="text-[#95D5B2]" />
                <h1 className="text-white text-2xl" style={{ fontWeight: 700 }}>
                  {instrument.name}
                </h1>
              </div>
              <p className="text-[#52B788] text-xs">{instrument.englishName}</p>
              <div className="flex items-center gap-2 mt-1">
                <MapPin size={12} className="text-[#95D5B2]" />
                <span className="text-[#95D5B2] text-xs">{instrument.region}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white text-3xl">{instrument.emoji}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-600 text-sm">Tiến độ học</p>
          <p className="text-[#2D6A4F] text-sm" style={{ fontWeight: 600 }}>
            {completedLessons}/{instrument.lessons.length} bài
          </p>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#2D6A4F] to-[#52B788] rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {beginnerLessons.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              {beginnerLessons.length} Beginner
            </span>
          )}
          {intermediateLessons.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
              {intermediateLessons.length} Intermediate
            </span>
          )}
          {advancedLessons.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700">
              {advancedLessons.length} Advanced
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white px-4 pt-2 border-b border-gray-100">
        <div className="flex">
          {tabs.map((tab, i) => (
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

      {/* Tab Content */}
      <div className="flex-1 px-4 py-4 pb-[calc(14rem+env(safe-area-inset-bottom))]">
        {/* Lessons Tab */}
        {activeTab === 0 && (
          <div className="space-y-3">
            <p className="text-gray-500 text-xs mb-4">
              Hoàn thành các bài học theo thứ tự để nắm vững kỹ năng
            </p>
            {instrument.lessons.map((lesson, index) => {
              const isLocked = index > completedLessons;
              const isCompleted = isLessonCompleted(instrument.id, lesson);
              const isCurrent = index === completedLessons;
              const clipStatus = lesson.clipStatus ?? "in_progress";
              const isClipReady = clipStatus === "available";

              const levelStyle =
                lesson.level === "Beginner"
                  ? "bg-green-100 text-green-700"
                  : lesson.level === "Intermediate"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700";

              return (
                <div
                  key={lesson.id}
                  onClick={() =>
                    !isLocked && navigate(`/learn/${instrument.id}/lesson/${lesson.id}`)
                  }
                  className={`bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border transition-transform ${
                    isLocked
                      ? "opacity-50 border-gray-100"
                      : "border-gray-100 active:scale-[0.98] cursor-pointer"
                  } ${isCurrent ? "border-[#2D6A4F]/40 shadow-[0_0_0_2px_rgba(45,106,79,0.15)]" : ""}`}
                >
                  {/* Thumbnail + play */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 relative">
                    <img
                      src={lesson.videoThumb}
                      alt={lesson.title}
                      className={`w-full h-full object-cover ${isClipReady ? "" : "opacity-70"}`}
                    />
                    {!isClipReady && (
                      <span className="absolute top-0.5 left-0.5 rounded-full bg-amber-500 text-white px-1 py-0.5 text-[8px] leading-none">
                        Clip
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      {isLocked ? (
                        <Lock size={14} className="text-white" />
                      ) : !isClipReady ? (
                        <Clock3 size={14} className="text-amber-200" />
                      ) : isCompleted ? (
                        <div className="w-5 h-5 rounded-full bg-[#2D6A4F] flex items-center justify-center">
                          <CheckCircle size={12} className="text-white" />
                        </div>
                      ) : (
                        <Play size={12} fill="white" className="text-white ml-0.5" />
                      )}
                    </div>
                    {!isLocked && !isClipReady && (
                      <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                        <span className="text-[9px] text-white px-2 py-0.5 rounded-full bg-black/50">
                          Chưa xem được
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 text-sm truncate" style={{ fontWeight: 600 }}>
                      {lesson.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${levelStyle}`}>
                        {lesson.level}
                      </span>
                      <span className="text-gray-400 text-xs">{lesson.duration}</span>
                    </div>
                    {!isClipReady && (
                      <p className="text-[10px] text-amber-600 mt-0.5">{clipStatusLabel[clipStatus]}</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[#2D6A4F] text-xs" style={{ fontWeight: 700 }}>+{lesson.xp} XP</span>
                    {!isLocked && (
                      <ChevronRight size={14} className="text-gray-300" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Songs Tab */}
        {activeTab === 1 && (
          <div className="space-y-3">
            <p className="text-gray-500 text-xs mb-4">
              Các bài nhạc nổi tiếng thường chơi trên {instrument.name}
            </p>
            {instrument.songs.map((song, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-100"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${instrument.bgGradient} flex items-center justify-center flex-shrink-0`}>
                  <Music size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 text-sm" style={{ fontWeight: 600 }}>{song.title}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{song.artist}</p>
                </div>
                <span className="text-gray-400 text-xs flex-shrink-0">{song.duration}</span>
              </div>
            ))}
          </div>
        )}

        {/* Info Tab */}
        {activeTab === 2 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-[#1A3A2B] text-sm" style={{ fontWeight: 700 }}>Giới thiệu</p>
              <p className="text-gray-600 text-xs mt-2 leading-relaxed">{instrument.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Info, label: "Nguồn gốc", value: instrument.origin, bg: "bg-[#E8F5EE]", color: "text-[#2D6A4F]" },
                { icon: Layers, label: "Chất liệu", value: instrument.material, bg: "bg-amber-50", color: "text-amber-600" },
                { icon: Zap, label: "Âm vực", value: instrument.soundRange, bg: "bg-purple-50", color: "text-purple-600" },
                { icon: Star, label: "Độ khó", value: null, bg: "bg-red-50", color: "text-red-500" },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-7 h-7 ${item.bg} rounded-lg flex items-center justify-center`}>
                      <item.icon size={13} className={item.color} />
                    </div>
                    <p className="text-gray-700 text-xs" style={{ fontWeight: 600 }}>{item.label}</p>
                  </div>
                  {item.value ? (
                    <p className="text-gray-500 text-[11px] leading-relaxed">{item.value}</p>
                  ) : (
                    <div className="flex gap-0.5 mt-1">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <div
                          key={j}
                          className={`h-2 flex-1 rounded-sm ${
                            j < instrument.difficulty ? "bg-gradient-to-r from-[#2D6A4F] to-[#52B788]" : "bg-gray-100"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Fun Facts */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-[#1A3A2B] text-sm mb-3" style={{ fontWeight: 700 }}>
                🌿 Điều thú vị
              </p>
              <div className="space-y-3">
                {instrument.facts.map((fact, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#E8F5EE] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#2D6A4F] text-[10px]" style={{ fontWeight: 700 }}>{i + 1}</span>
                    </div>
                    <p className="text-gray-600 text-xs leading-relaxed">{fact}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CTA Button */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] w-full max-w-sm z-20 px-4 pb-4 pt-2 bg-gradient-to-t from-[#F7FAF8] to-transparent">
        <button
          onClick={() =>
            navigate(
              `/learn/${instrument.id}/lesson/${
                instrument.lessons[completedLessons]?.id || instrument.lessons[0].id
              }`
            )
          }
          className="w-full bg-gradient-to-r from-[#1A3A2B] to-[#2D6A4F] text-white py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform"
        >
          <Play size={18} fill="white" />
          <span style={{ fontWeight: 600 }}>
            {completedLessons === 0 ? "Bắt đầu học" : "Tiếp tục học"}
          </span>
        </button>
      </div>
    </div>
  );
}
