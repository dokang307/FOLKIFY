import { useState } from "react";
import { Search, Download, Eye, Lock, FileText, X, Calendar } from "lucide-react";
import { sheetMusicLibrary, sheetGenres, sheetLevels } from "../data/instruments";
import { useRequirePremium, useSubscription } from "../subscription";
import folkifyLogo from "../../assets/logofolkify.png";

export function SheetMusic() {
  const [search, setSearch] = useState("");
  const [activeGenre, setActiveGenre] = useState("Tất cả");
  const [activeLevel, setActiveLevel] = useState("Tất cả");
  const [previewSheet, setPreviewSheet] = useState<typeof sheetMusicLibrary[0] | null>(null);
  const { isPremium } = useSubscription();
  const requirePremium = useRequirePremium();

  const filtered = sheetMusicLibrary.filter((s) => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) || s.composer.toLowerCase().includes(search.toLowerCase());
    const matchGenre = activeGenre === "Tất cả" || s.genre === activeGenre;
    const matchLevel = activeLevel === "Tất cả" || s.level === activeLevel;
    return matchSearch && matchGenre && matchLevel;
  });

  const freeCount = sheetMusicLibrary.filter((s) => !s.isPremium).length;
  const premiumCount = sheetMusicLibrary.filter((s) => s.isPremium).length;

  const handleOpenPreview = (sheet: (typeof sheetMusicLibrary)[number]) => {
    if (sheet.isPremium && !requirePremium(`sheet "${sheet.title}"`)) return;
    setPreviewSheet(sheet);
  };

  const handleUnlockPremium = (sheetTitle: string) => {
    requirePremium(`sheet "${sheetTitle}"`);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#F7FAF8]">
      {/* Header */}
      <div className="header-green-full bg-[#1A3A2B] px-5 pt-12 pb-6 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
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
            <FileText size={20} className="text-[#95D5B2]" />
            <h1 className="text-white" style={{ fontWeight: 700, fontSize: 20 }}>Sheet nhạc</h1>
          </div>
          <p className="text-[#95D5B2] text-sm mt-1">{freeCount} miễn phí · {premiumCount} premium</p>

          <div className="mt-4 flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-3">
            <Search size={16} className="text-[#95D5B2] flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm bài nhạc, tác giả..."
              className="bg-transparent text-white placeholder-[#52B788] text-sm outline-none flex-1"
            />
          </div>
        </div>
      </div>

      {/* Genre filter */}
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {sheetGenres.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGenre(g)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs transition-all ${
                activeGenre === g ? "bg-[#1A3A2B] text-white" : "bg-gray-100 text-gray-600"
              }`}
              style={{ fontWeight: activeGenre === g ? 600 : 400 }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Level filter */}
      <div className="bg-white px-4 py-2 pb-3 border-b border-gray-100">
        <div className="flex gap-2">
          {sheetLevels.map((lv) => (
            <button
              key={lv}
              onClick={() => setActiveLevel(lv)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs transition-all border ${
                activeLevel === lv
                  ? "bg-[#2D6A4F] text-white border-[#2D6A4F]"
                  : "bg-white text-gray-500 border-gray-200"
              }`}
              style={{ fontWeight: activeLevel === lv ? 600 : 400 }}
            >
              {lv}
            </button>
          ))}
        </div>
      </div>

      {/* Sheet list */}
      <div className="flex-1 px-4 py-4">
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <FileText size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Không tìm thấy sheet nhạc</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {filtered.map((sheet) => {
            const hasSheetAccess = !sheet.isPremium || isPremium;

            return (
            <div key={sheet.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              {/* Preview thumb */}
              <div className="relative h-40 overflow-hidden bg-gray-50">
                <img
                  src={sheet.previewUrl}
                  alt={sheet.title}
                  className="w-full h-full object-contain"
                />
                {sheet.isPremium && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-400 rounded-full px-2 py-0.5">
                    <Lock size={9} className="text-white" />
                    <span className="text-white text-[9px]" style={{ fontWeight: 700 }}>Premium</span>
                  </div>
                )}
                {/* Genre badge */}
                <div className="absolute bottom-2 left-2">
                  <span className="text-[9px] bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">{sheet.genre}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-3">
                <p className="text-gray-800 text-xs leading-tight" style={{ fontWeight: 700 }}>{sheet.title}</p>
                <p className="text-gray-400 text-[10px] mt-0.5">{sheet.composer}</p>

                <div className="flex items-center gap-1.5 mt-2">
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                      sheet.level === "Dễ"
                        ? "bg-green-100 text-green-700"
                        : sheet.level === "Trung bình"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {sheet.level}
                  </span>
                  <span className="text-gray-400 text-[10px]">{sheet.pages} trang</span>
                </div>

                <div className="flex gap-1.5 mt-2.5">
                  <button
                    onClick={() => handleOpenPreview(sheet)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[#E8F5EE] rounded-lg"
                  >
                    <Eye size={11} className="text-[#2D6A4F]" />
                    <span className="text-[#2D6A4F] text-[10px]" style={{ fontWeight: 600 }}>Xem</span>
                  </button>
                  {!hasSheetAccess ? (
                    <button
                      onClick={() => handleUnlockPremium(sheet.title)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-amber-50 rounded-lg border border-amber-200"
                    >
                      <Lock size={11} className="text-amber-600" />
                      <span className="text-amber-600 text-[10px]" style={{ fontWeight: 600 }}>Mở khóa</span>
                    </button>
                  ) : (
                    <button className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[#1A3A2B] rounded-lg">
                      <Download size={11} className="text-white" />
                      <span className="text-white text-[10px]" style={{ fontWeight: 600 }}>Tải về</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {/* Update info */}
        <div className="mt-4 bg-gradient-to-r from-[#1A3A2B] to-[#2D6A4F] rounded-2xl p-4">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-[#95D5B2]" />
            <p className="text-[#95D5B2] text-xs" style={{ fontWeight: 700 }}>Cập nhật định kỳ</p>
          </div>
          <p className="text-[#52B788] text-xs mt-1">Thư viện sheet nhạc được bổ sung hàng tuần với các bản nhạc dân tộc và hiện đại.</p>
        </div>
      </div>

      {/* Sheet Preview Modal */}
      {previewSheet && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end"
          onClick={() => setPreviewSheet(null)}
        >
          <div
            className="w-full max-w-sm mx-auto bg-white rounded-t-3xl overflow-hidden max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div>
                <p className="text-gray-800 text-sm" style={{ fontWeight: 700 }}>{previewSheet.title}</p>
                <p className="text-gray-400 text-xs">{previewSheet.composer}</p>
              </div>
              <button
                onClick={() => setPreviewSheet(null)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X size={16} className="text-gray-600" />
              </button>
            </div>

            {/* Preview */}
            <div className="relative mx-4 mt-4 mb-2 rounded-2xl overflow-hidden bg-gray-50 aspect-[3/4]">
              <img
                src={previewSheet.previewUrl}
                alt={previewSheet.title}
                className="w-full h-full object-contain"
              />
              {previewSheet.isPremium && !isPremium && (
                <div className="absolute inset-0 bg-amber-900/30 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="text-center">
                    <Lock size={28} className="text-amber-400 mx-auto mb-2" />
                    <p className="text-white text-sm" style={{ fontWeight: 700 }}>Premium</p>
                    <p className="text-white/80 text-xs">Mở khóa để xem đầy đủ</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 px-4 py-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                previewSheet.level === "Dễ" ? "bg-green-100 text-green-700" :
                previewSheet.level === "Trung bình" ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-700"
              }`}>{previewSheet.level}</span>
              <span className="text-gray-500 text-[10px]">{previewSheet.pages} trang</span>
              <span className="text-gray-400 text-[10px]">·</span>
              <span className="text-gray-500 text-[10px]">{previewSheet.genre}</span>
            </div>

            {/* Actions */}
            <div
              className="flex gap-3 px-4 pt-2"
              style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
            >
              {previewSheet.isPremium && !isPremium ? (
                <button
                  onClick={() => handleUnlockPremium(previewSheet.title)}
                  className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl flex items-center justify-center gap-2"
                >
                  <Lock size={16} />
                  <span style={{ fontWeight: 700 }}>Mở khóa Premium</span>
                </button>
              ) : (
                <button className="flex-1 py-3.5 bg-[#1A3A2B] text-white rounded-2xl flex items-center justify-center gap-2">
                  <Download size={16} />
                  <span style={{ fontWeight: 700 }}>Tải về miễn phí</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
