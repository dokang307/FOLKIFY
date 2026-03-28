import { useState } from "react";
import { useNavigate } from "react-router";
import { Search, ChevronRight, Star, Lock, Play, Music2, Clock3 } from "lucide-react";
import { instruments, categories } from "../data/instruments";
import { getCompletedLessonsCount, isLessonCompleted } from "../data/lessonProgress";
import folkifyLogo from "../../assets/logofolkify.png";

const levelTabs = ["Tất cả", "Beginner", "Intermediate", "Advanced"];
const clipStatusLabel = {
  available: "Đã có clip",
  in_progress: "Clip đang hoàn thiện",
  coming_soon: "Clip sắp có",
} as const;

export function Learn() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeLevel, setActiveLevel] = useState("Tất cả");
  const [search, setSearch] = useState("");

  const filtered = instruments.filter((inst) => {
    const matchCat = activeCategory === "all" || inst.category === activeCategory;
    const matchSearch =
      inst.name.toLowerCase().includes(search.toLowerCase()) ||
      inst.englishName.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="flex flex-col min-h-full bg-[#F7FAF8]">
      {/* Header */}
      <div className="header-green-full bg-[#1A3A2B] px-5 pt-12 pb-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
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

          <div className="flex items-center gap-2">
            <Music2 size={20} className="text-[#95D5B2]" />
            <h1 className="text-white" style={{ fontWeight: 700, fontSize: 20 }}>Học nhạc cụ</h1>
          </div>
          <p className="text-[#95D5B2] text-sm mt-1">{instruments.length} nhạc cụ · Video + Lộ trình</p>

          {/* Search */}
          <div className="mt-4 flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-3">
            <Search size={16} className="text-[#95D5B2] flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm nhạc cụ..."
              className="bg-transparent text-white placeholder-[#52B788] text-sm outline-none flex-1"
            />
          </div>
        </div>
      </div>

      {/* Level tabs */}
      <div className="bg-white px-4 pt-3 pb-2 border-b border-gray-100">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {levelTabs.map((lv) => (
            <button
              key={lv}
              onClick={() => setActiveLevel(lv)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs transition-all ${
                activeLevel === lv
                  ? "bg-[#1A3A2B] text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
              style={{ fontWeight: activeLevel === lv ? 600 : 400 }}
            >
              {lv}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs transition-all border ${
                activeCategory === cat.id
                  ? "bg-[#2D6A4F] text-white border-[#2D6A4F]"
                  : "bg-white text-gray-500 border-gray-200"
              }`}
              style={{ fontWeight: activeCategory === cat.id ? 600 : 400 }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Instrument Cards */}
      <div className="flex-1 px-4 py-4 space-y-4">
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Music2 size={44} className="text-gray-300 mx-auto" />
            <p className="text-gray-500 mt-3">Không tìm thấy nhạc cụ</p>
          </div>
        )}
        {filtered.map((inst) => {
          const completedCount = getCompletedLessonsCount(inst);
          const pct = Math.round((completedCount / inst.lessons.length) * 100);

          const beginnerCount = inst.lessons.filter((l) => l.level === "Beginner").length;
          const intermediateCount = inst.lessons.filter((l) => l.level === "Intermediate").length;
          const advancedCount = inst.lessons.filter((l) => l.level === "Advanced").length;

          const visibleLessons = activeLevel === "Tất cả"
            ? inst.lessons
            : inst.lessons.filter((l) => l.level === activeLevel);

          if (activeLevel !== "Tất cả" && visibleLessons.length === 0) return null;

          return (
            <div key={inst.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              {/* Instrument Header */}
              <div
                className={`relative h-32 cursor-pointer active:opacity-95 transition-opacity`}
                onClick={() => navigate(`/learn/${inst.id}`)}
              >
                <img src={inst.image} alt={inst.name} className="w-full h-full object-cover object-[50%_22%]" />
                <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent`} />
                <div className={`absolute inset-0 bg-gradient-to-br ${inst.bgGradient} opacity-30`} />
                <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Music2 size={18} className="text-white" />
                      <h3 className="text-white" style={{ fontWeight: 700, fontSize: 16 }}>{inst.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {inst.category}
                      </span>
                      <span className="text-gray-300 text-[10px]">{inst.lessons.length} video</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-xs" style={{ fontWeight: 600 }}>{pct}%</p>
                    <p className="text-gray-300 text-[10px]">hoàn thành</p>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-gray-100">
                <div
                  className={`h-full bg-gradient-to-r ${inst.bgGradient}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Level pills */}
              <div className="px-4 pt-3 pb-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  {beginnerCount > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      {beginnerCount} Beginner
                    </span>
                  )}
                  {intermediateCount > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                      {intermediateCount} Intermediate
                    </span>
                  )}
                  {advancedCount > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                      {advancedCount} Advanced
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-auto">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={10}
                      className={i < inst.difficulty ? "text-amber-400" : "text-gray-200"}
                      fill={i < inst.difficulty ? "#FBBF24" : "#E5E7EB"}
                    />
                  ))}
                </div>
              </div>

              {/* Lesson list preview */}
              <div className="px-4 pb-4 space-y-2">
                {(activeLevel === "Tất cả" ? inst.lessons.slice(0, 3) : visibleLessons.slice(0, 3)).map((lesson, idx) => {
                  const allLessons = inst.lessons;
                  const globalIdx = allLessons.indexOf(lesson);
                  const completedSoFar = getCompletedLessonsCount(inst);
                  const isLocked = globalIdx > completedSoFar;
                  const lessonCompleted = isLessonCompleted(inst.id, lesson);
                  const clipStatus = lesson.clipStatus ?? "in_progress";
                  const isClipReady = clipStatus === "available";

                  return (
                    <div
                      key={lesson.id}
                      onClick={() => !isLocked && navigate(`/learn/${inst.id}/lesson/${lesson.id}`)}
                      className={`flex items-center gap-3 rounded-xl p-2.5 transition-all ${
                        isLocked ? "opacity-40" : "cursor-pointer hover:bg-gray-50 active:bg-gray-50"
                      }`}
                    >
                      {/* Thumb */}
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 relative">
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
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          {isLocked ? (
                            <Lock size={12} className="text-white" />
                          ) : !isClipReady ? (
                            <Clock3 size={12} className="text-amber-200" />
                          ) : lessonCompleted ? (
                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                              <span className="text-white text-[10px]">✓</span>
                            </div>
                          ) : (
                            <Play size={10} fill="white" className="text-white ml-0.5" />
                          )}
                        </div>
                        {!isLocked && !isClipReady && (
                          <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                            <span className="text-[8px] text-white px-1.5 py-0.5 rounded-full bg-black/50">
                              Chưa xem được
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-700 text-xs truncate" style={{ fontWeight: lessonCompleted ? 400 : 600 }}>
                          {lesson.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                            lesson.level === "Beginner" ? "bg-green-50 text-green-600" :
                            lesson.level === "Intermediate" ? "bg-yellow-50 text-yellow-600" :
                            "bg-red-50 text-red-600"
                          }`}>{lesson.level}</span>
                          <span className="text-gray-400 text-[10px]">{lesson.duration}</span>
                        </div>
                        {!isClipReady && (
                          <p className="text-[10px] text-amber-600 mt-0.5">{clipStatusLabel[clipStatus]}</p>
                        )}
                      </div>
                      <span className="text-[#2D6A4F] text-[10px] flex-shrink-0" style={{ fontWeight: 600 }}>+{lesson.xp} XP</span>
                    </div>
                  );
                })}

                {inst.lessons.length > 3 && (
                  <button
                    onClick={() => navigate(`/learn/${inst.id}`)}
                    className="w-full text-[#2D6A4F] text-xs py-2 flex items-center justify-center gap-1"
                    style={{ fontWeight: 600 }}
                  >
                    Xem tất cả {inst.lessons.length} bài <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Info banner */}
        <div className="bg-[#1A3A2B] rounded-2xl p-4">
          <p className="text-[#95D5B2] text-xs" style={{ fontWeight: 700 }}>Folkify — Học nhạc dân tộc</p>
          <p className="text-[#52B788] text-xs mt-1 leading-relaxed">
            Lộ trình học từ Beginner → Advanced, kết hợp video bài giảng và sheet nhạc tương ứng.
          </p>
        </div>
      </div>
    </div>
  );
}
