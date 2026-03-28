import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  Volume2,
  Timer,
  Mic,
  MicOff,
  Activity,
  Target,
  Gauge,
  Drum,
  Music2,
  Brain,
  Bot,
  ArrowUp,
  ArrowDown,
  BookOpen,
  Lightbulb,
  Disc3,
} from "lucide-react";
import { instruments } from "../data/instruments";
import { useSubscription } from "../subscription";
import folkifyLogo from "../../assets/logofolkify.png";

const rhythmPatterns = [
  {
    id: 1,
    name: "Nhịp 4/4 cơ bản",
    bpm: 60,
    pattern: [1, 0, 1, 0, 1, 0, 1, 0],
    accent: [0, 4],
    level: "Beginner",
    color: "from-green-400 to-emerald-600",
    description: "Nhịp cơ bản 4/4 để luyện giữ nhịp đều",
  },
  {
    id: 2,
    name: "Nhịp chèo",
    bpm: 80,
    pattern: [1, 1, 0, 1, 1, 0, 1, 0],
    accent: [0, 3],
    level: "Intermediate",
    color: "from-amber-400 to-orange-600",
    description: "Nhịp điệu đặc trưng của hát chèo Bắc Bộ",
  },
  {
    id: 3,
    name: "Nhịp cải lương",
    bpm: 100,
    pattern: [1, 0, 1, 1, 0, 1, 0, 1],
    accent: [0, 2, 5],
    level: "Advanced",
    color: "from-violet-500 to-purple-700",
    description: "Nhịp điệu của đờn ca tài tử và cải lương Nam Bộ",
  },
];

const notes = ["Đô", "Rê", "Mi", "Fa", "Sol", "La", "Si", "Đô'"];
const noteColors = [
  "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-400",
  "bg-teal-400", "bg-blue-400", "bg-indigo-400", "bg-red-300",
];
const scaleMidis = [60, 62, 64, 65, 67, 69, 71, 72];

const aiTargets = [
  { label: "Đô4", midi: 60 },
  { label: "Rê4", midi: 62 },
  { label: "Mi4", midi: 64 },
  { label: "Fa4", midi: 65 },
  { label: "Sol4", midi: 67 },
  { label: "La4", midi: 69 },
  { label: "Si4", midi: 71 },
];

const aiSequences = [
  { id: "asc", name: "Gam đi lên", pattern: [0, 1, 2, 3, 4, 5, 6, 0] },
  { id: "folk", name: "Ngũ cung", pattern: [0, 1, 2, 4, 5, 4, 2, 1] },
  { id: "cad", name: "Kết câu", pattern: [4, 3, 2, 1, 0, 1, 2, 0] },
];

const westernNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function midiToFrequency(midi: number) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function Practice() {
  const navigate = useNavigate();
  const { plan } = useSubscription();
  const isProPlan = plan === "pro";
  const [activeSection, setActiveSection] = useState<"rhythm" | "scale" | "quiz" | "ai">("rhythm");
  const [selectedPattern, setSelectedPattern] = useState(rhythmPatterns[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [bpm, setBpm] = useState(60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const beatIndexRef = useRef(0);

  const [quizNote, setQuizNote] = useState(Math.floor(Math.random() * 8));
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizTotal, setQuizTotal] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [pressedNote, setPressedNote] = useState<number | null>(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [sequenceStep, setSequenceStep] = useState(0);
  const [detectedNote, setDetectedNote] = useState("--");
  const [detectedHz, setDetectedHz] = useState<number | null>(null);
  const [centsOff, setCentsOff] = useState<number | null>(null);
  const [isInTune, setIsInTune] = useState(false);
  const [aiAccuracy, setAiAccuracy] = useState(0);
  const [signalLevel, setSignalLevel] = useState(0);
  const mockIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mockTickRef = useRef(0);
  const sequenceStepRef = useRef(0);
  const sampleCountRef = useRef(0);
  const inTuneCountRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playMetronomeClick = (isAccent: boolean) => {
    const context = getAudioContext();
    if (!context) return;

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = "square";
    oscillator.frequency.value = isAccent ? 1650 : 1200;

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(isAccent ? 0.22 : 0.14, now + 0.004);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.065);
  };

  const triggerMetronomeBeat = (beatIndex: number) => {
    setCurrentBeat(beatIndex);
    if (selectedPattern.pattern[beatIndex] !== 1) return;
    playMetronomeClick(selectedPattern.accent.includes(beatIndex));
  };

  useEffect(() => {
    if (isPlaying) {
      beatIndexRef.current = 0;
      triggerMetronomeBeat(0);
      intervalRef.current = setInterval(() => {
        const nextBeat = (beatIndexRef.current + 1) % selectedPattern.pattern.length;
        beatIndexRef.current = nextBeat;
        triggerMetronomeBeat(nextBeat);
      }, (60 / bpm / 2) * 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setCurrentBeat(-1);
      beatIndexRef.current = 0;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, bpm, selectedPattern]);

  const stopAiDetection = () => {
    if (mockIntervalRef.current) {
      clearInterval(mockIntervalRef.current);
      mockIntervalRef.current = null;
    }
    setAiEnabled(false);
    setDetectedNote("--");
    setDetectedHz(null);
    setCentsOff(null);
    setIsInTune(false);
    setSignalLevel(0);
    sequenceStepRef.current = 0;
    setSequenceStep(0);
  };

  const startAiDetection = () => {
    sampleCountRef.current = 0;
    inTuneCountRef.current = 0;
    mockTickRef.current = 0;
    sequenceStepRef.current = 0;
    setSequenceStep(0);
    setAiAccuracy(0);
    setAiEnabled(true);

    const sequence = aiSequences[sequenceIndex];
    mockIntervalRef.current = setInterval(() => {
      mockTickRef.current += 1;
      if (mockTickRef.current % 4 === 0) {
        const nextStep = (sequenceStepRef.current + 1) % sequence.pattern.length;
        sequenceStepRef.current = nextStep;
        setSequenceStep(nextStep);
      }

      const target = aiTargets[sequence.pattern[sequenceStepRef.current]];

      const wave = Math.sin(mockTickRef.current / 2) * 18;
      const noise = (Math.random() - 0.5) * 12;
      const drift = mockTickRef.current % 10 === 0 ? (Math.random() > 0.5 ? 22 : -22) : 0;
      const cents = Math.round(Math.max(-50, Math.min(50, wave + noise + drift)));

      const semitoneOffset = cents > 35 ? 1 : cents < -35 ? -1 : 0;
      const mockMidi = target.midi + semitoneOffset;
      const noteName = westernNotes[((mockMidi % 12) + 12) % 12];
      const octave = Math.floor(mockMidi / 12) - 1;
      const hz = midiToFrequency(mockMidi) * Math.pow(2, cents / 1200);
      const inTune = Math.abs(cents) <= 30;

      sampleCountRef.current += 1;
      if (inTune) inTuneCountRef.current += 1;

      setDetectedNote(`${noteName}${octave}`);
      setDetectedHz(hz);
      setCentsOff(cents);
      setIsInTune(inTune);
      setSignalLevel(Math.floor(45 + Math.random() * 50));
      setAiAccuracy(
        Math.round((inTuneCountRef.current / Math.max(sampleCountRef.current, 1)) * 100),
      );
    }, 260);
  };

  useEffect(() => {
    if (activeSection !== "ai" && aiEnabled) stopAiDetection();
  }, [activeSection, aiEnabled]);

  useEffect(() => {
    if (!isProPlan && activeSection === "ai") {
      setActiveSection("rhythm");
      stopAiDetection();
    }
  }, [isProPlan, activeSection]);

  useEffect(() => {
    if (aiEnabled) {
      stopAiDetection();
    } else {
      sequenceStepRef.current = 0;
      setSequenceStep(0);
    }
  }, [sequenceIndex]);

  useEffect(() => {
    return () => stopAiDetection();
  }, []);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  const getAudioContext = () => {
    if (audioContextRef.current) return audioContextRef.current;
    const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    audioContextRef.current = new AudioCtx();
    return audioContextRef.current;
  };

  const playScaleNote = (noteIndex: number) => {
    const context = getAudioContext();
    if (!context) return;

    if (context.state === "suspended") {
      void context.resume();
    }

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = midiToFrequency(scaleMidis[noteIndex] ?? 60);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.48);
  };

  const handleQuizAnswer = (index: number) => {
    setQuizAnswer(index);
    setQuizTotal((t) => t + 1);
    setShowResult(true);
    if (index === quizNote % 4) setQuizScore((s) => s + 1);
    setTimeout(() => {
      setShowResult(false);
      setQuizAnswer(null);
      setQuizNote(Math.floor(Math.random() * 8));
    }, 1500);
  };

  const handleNotePress = (i: number) => {
    setPressedNote(i);
    playScaleNote(i);
    setTimeout(() => setPressedNote(null), 300);
  };

  const toggleMetronome = () => {
    if (!isPlaying) {
      const context = getAudioContext();
      if (context?.state === "suspended") {
        void context.resume();
      }
    }
    setIsPlaying((prev) => !prev);
  };

  const activeSequence = aiSequences[sequenceIndex];
  const targetNote = aiTargets[activeSequence.pattern[sequenceStep]];
  const clampedCents = Math.max(-50, Math.min(50, centsOff ?? 0));
  const meterPosition = ((clampedCents + 50) / 100) * 100;
  const handleSectionChange = (section: "rhythm" | "scale" | "quiz" | "ai") => {
    if (section === "ai" && !isProPlan) {
      navigate("/premium", {
        state: {
          from: "/practice",
          feature: "AI Pitch",
          requiredPlan: "pro",
        },
      });
      return;
    }
    setActiveSection(section);
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
            <Drum size={20} className="text-[#95D5B2]" />
            <h1 className="text-white text-xl" style={{ fontWeight: 700 }}>Luyện tập</h1>
          </div>
          <p className="text-[#95D5B2] text-sm mt-1">Rèn kỹ năng âm nhạc mỗi ngày</p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="bg-white border-b border-gray-100 px-4 py-2">
        <div className="flex gap-2">
          {[
            { key: "rhythm", label: "Nhịp điệu", icon: Drum },
            { key: "scale", label: "Gam âm", icon: Music2 },
            { key: "quiz", label: "Đố vui", icon: Brain },
            { key: "ai", label: "AI Pitch", icon: Bot },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => handleSectionChange(s.key as "rhythm" | "scale" | "quiz" | "ai")}
              className={`flex-1 py-2 rounded-xl text-xs transition-all ${
                activeSection === s.key
                  ? "bg-[#1A3A2B] text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
              style={{ fontWeight: activeSection === s.key ? 600 : 400 }}
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <s.icon size={13} />
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-5">
        {/* Rhythm Section */}
        {activeSection === "rhythm" && (
          <>
            <div className="space-y-2.5">
              <p className="text-[#1A3A2B] text-sm" style={{ fontWeight: 700 }}>Chọn nhịp luyện tập</p>
              {rhythmPatterns.map((pat) => (
                <div
                  key={pat.id}
                  onClick={() => {
                    setSelectedPattern(pat);
                    setBpm(pat.bpm);
                    setIsPlaying(false);
                    beatIndexRef.current = 0;
                  }}
                  className={`bg-white rounded-2xl p-4 border-2 transition-all cursor-pointer active:scale-[0.98] ${
                    selectedPattern.id === pat.id ? "border-[#2D6A4F]" : "border-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-gray-800 text-sm" style={{ fontWeight: 600 }}>{pat.name}</p>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${
                            pat.level === "Beginner"
                              ? "bg-green-100 text-green-700"
                              : pat.level === "Intermediate"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {pat.level}
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs mt-0.5">{pat.description}</p>
                    </div>
                    <span className="text-gray-500 text-xs">{pat.bpm} BPM</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Metronome */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[#1A3A2B] text-sm" style={{ fontWeight: 700 }}>Máy đếm nhịp</p>
                <div className="flex items-center gap-2">
                  <Timer size={14} className="text-gray-400" />
                  <span className="text-gray-600 text-sm">{bpm} BPM</span>
                </div>
              </div>

              <div className="flex gap-2 justify-center mb-5">
                {selectedPattern.pattern.map((beat, i) => {
                  const isActive = currentBeat === i;
                  const isAccent = selectedPattern.accent.includes(i);
                  const isBeat = beat === 1;
                  return (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-75 ${
                        isActive && isBeat
                          ? isAccent ? "bg-[#1A3A2B] scale-110" : "bg-[#52B788] scale-105"
                          : isBeat ? "bg-gray-200"
                          : "bg-gray-50 border border-gray-100"
                      }`}
                    >
                      {isBeat && (
                        <div className={`w-3 h-3 rounded-full ${isActive ? "bg-white" : "bg-gray-400"}`} />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mb-5">
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>40 BPM</span>
                  <span>160 BPM</span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={160}
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-full h-2 rounded-full accent-[#2D6A4F]"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setIsPlaying(false); setCurrentBeat(-1); beatIndexRef.current = 0; }}
                  className="w-12 h-12 bg-[#E8F5EE] rounded-full flex items-center justify-center"
                >
                  <RotateCcw size={18} className="text-[#2D6A4F]" />
                </button>
                <button
                  onClick={toggleMetronome}
                  className="flex-1 h-12 bg-gradient-to-r from-[#1A3A2B] to-[#2D6A4F] rounded-full flex items-center justify-center gap-2 shadow-lg active:scale-[0.97] transition-transform"
                >
                  {isPlaying ? (
                    <Pause size={20} className="text-white" fill="white" />
                  ) : (
                    <Play size={20} className="text-white ml-0.5" fill="white" />
                  )}
                  <span className="text-white text-sm" style={{ fontWeight: 600 }}>
                    {isPlaying ? "Dừng" : "Bắt đầu"}
                  </span>
                </button>
                <button className="w-12 h-12 bg-[#E8F5EE] rounded-full flex items-center justify-center">
                  <Volume2 size={18} className="text-[#2D6A4F]" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Scale Section */}
        {activeSection === "scale" && (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-1.5 mb-1">
                <Music2 size={14} className="text-[#1A3A2B]" />
                <p className="text-[#1A3A2B] text-sm" style={{ fontWeight: 700 }}>
                  Bàn phím gam âm cơ bản
                </p>
              </div>
              <p className="text-gray-400 text-xs">Nhấn vào từng nốt để nghe âm thanh</p>
            </div>

            <div className="bg-[#1A3A2B] rounded-2xl p-4 shadow-lg">
              <p className="text-[#52B788] text-xs text-center mb-4">Gam Đô trưởng (C Major)</p>
              <div className="flex gap-1.5">
                {notes.map((note, i) => (
                  <button
                    key={i}
                    onPointerDown={() => handleNotePress(i)}
                    className={`flex-1 rounded-xl py-6 flex flex-col items-center gap-2 transition-all active:scale-95 ${
                      pressedNote === i ? `${noteColors[i]} scale-95 shadow-inner` : "bg-white shadow-md"
                    }`}
                    style={{ minWidth: 0 }}
                  >
                    <div className={`w-2 h-2 rounded-full ${noteColors[i]}`} />
                    <span
                      className={`text-[10px] ${pressedNote === i ? "text-white" : "text-gray-600"}`}
                      style={{ fontWeight: 600, writingMode: "vertical-rl" }}
                    >
                      {note}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[#1A3A2B] text-sm" style={{ fontWeight: 700 }}>Bài tập gam âm</p>
              {[
                { name: "Gam đi lên", desc: "Đô → Rê → Mi → Fa → Sol → La → Si → Đô'", icon: ArrowUp },
                { name: "Gam đi xuống", desc: "Đô' → Si → La → Sol → Fa → Mi → Rê → Đô", icon: ArrowDown },
                { name: "Gam ngũ cung", desc: "Đô → Rê → Mi → Sol → La (5 nốt dân tộc)", icon: Music2 },
              ].map((ex) => (
                <div key={ex.name} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#E8F5EE] rounded-xl flex items-center justify-center flex-shrink-0">
                    <ex.icon size={17} className="text-[#2D6A4F]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 text-sm" style={{ fontWeight: 600 }}>{ex.name}</p>
                    <p className="text-gray-400 text-[11px] mt-0.5">{ex.desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              ))}
            </div>

            <div className="bg-[#E8F5EE] rounded-2xl p-4 border border-[#52B788]/30">
              <div className="flex items-center gap-1.5">
                <BookOpen size={13} className="text-[#1A3A2B]" />
                <p className="text-[#1A3A2B] text-xs" style={{ fontWeight: 700 }}>Về gam ngũ cung</p>
              </div>
              <p className="text-[#2D6A4F] text-xs mt-1 leading-relaxed">
                Âm nhạc dân tộc Việt Nam chủ yếu dùng gam ngũ cung (5 nốt) thay vì gam 7 nốt của phương Tây, tạo nên âm điệu đặc trưng mang đậm màu sắc dân tộc.
              </p>
            </div>
          </>
        )}

        {/* AI Pitch Section */}
        {activeSection === "ai" && (
          <>
            <div className="rounded-3xl p-5 bg-gradient-to-br from-[#183528] via-[#1A3A2B] to-[#2D6A4F] text-white shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[#95D5B2] text-xs">AI Performance</p>
                  <p className="text-lg mt-1" style={{ fontWeight: 700 }}>
                    Đánh giá nốt nhạc realtime
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Activity size={18} className="text-[#95D5B2]" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="bg-white/10 rounded-2xl p-3 text-center">
                  <p className="text-[10px] text-[#95D5B2]">Nốt</p>
                  <p className="text-sm mt-1" style={{ fontWeight: 700 }}>{detectedNote}</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-3 text-center">
                  <p className="text-[10px] text-[#95D5B2]">Tần số</p>
                  <p className="text-sm mt-1" style={{ fontWeight: 700 }}>
                    {detectedHz ? `${detectedHz.toFixed(1)} Hz` : "--"}
                  </p>
                </div>
                <div className="bg-white/10 rounded-2xl p-3 text-center">
                  <p className="text-[10px] text-[#95D5B2]">Accuracy</p>
                  <p className="text-sm mt-1" style={{ fontWeight: 700 }}>{aiAccuracy}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 space-y-4">
              <div>
                <p className="text-[#1A3A2B] text-xs mb-2 flex items-center gap-1.5" style={{ fontWeight: 700 }}>
                  <Target size={12} />
                  Sequence mode
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {aiSequences.map((seq, i) => (
                    <button
                      key={seq.id}
                      onClick={() => setSequenceIndex(i)}
                      disabled={aiEnabled}
                      className={`rounded-xl py-2 text-xs border transition-all ${
                        sequenceIndex === i
                          ? "bg-[#1A3A2B] text-white border-[#1A3A2B]"
                          : "bg-[#F7FAF8] text-gray-700 border-gray-200"
                      } ${aiEnabled ? "opacity-60" : "active:scale-[0.98]"}`}
                      style={{ fontWeight: 600 }}
                    >
                      {seq.name}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">
                  {activeSequence.pattern.map((target, i) => (
                    <div
                      key={`${activeSequence.id}-${i}`}
                      className={`px-2.5 py-1 rounded-full text-[10px] whitespace-nowrap ${
                        i === sequenceStep
                          ? "bg-[#1A3A2B] text-white"
                          : i < sequenceStep
                          ? "bg-[#E8F5EE] text-[#2D6A4F]"
                          : "bg-gray-100 text-gray-500"
                      }`}
                      style={{ fontWeight: 700 }}
                    >
                      {aiTargets[target].label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 py-1">
                <button
                  onClick={() => (aiEnabled ? stopAiDetection() : startAiDetection())}
                  className={`w-32 h-32 rounded-full flex flex-col items-center justify-center gap-1.5 text-white shadow-xl transition-all active:scale-[0.98] ${
                    aiEnabled
                      ? "bg-gradient-to-br from-red-500 to-rose-600 ring-4 ring-red-100"
                      : "bg-gradient-to-br from-[#1A3A2B] to-[#2D6A4F]"
                  }`}
                  style={{ fontWeight: 700 }}
                >
                  {aiEnabled ? <MicOff size={24} /> : <Mic size={24} />}
                  <span className="text-sm">Ghi Âm</span>
                </button>
                <div className="w-24 h-10 rounded-full bg-[#E8F5EE] flex items-center justify-center gap-1.5">
                  <Gauge size={13} className="text-[#2D6A4F]" />
                  <span className="text-[11px] text-[#2D6A4F]" style={{ fontWeight: 700 }}>
                    {signalLevel}%
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-[#F7FAF8] border border-gray-100 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-600 text-xs">
                    Mục tiêu: {targetNote.label} · Bước {sequenceStep + 1}/{activeSequence.pattern.length}
                  </p>
                  <p
                    className={`text-xs ${isInTune ? "text-[#2D6A4F]" : "text-gray-500"}`}
                    style={{ fontWeight: 700 }}
                  >
                    {centsOff === null ? "--" : `${centsOff > 0 ? "+" : ""}${centsOff} cents`}
                  </p>
                </div>
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#1A3A2B]" />
                  <div
                    className={`absolute top-0 h-full w-4 rounded-full -translate-x-1/2 ${
                      isInTune ? "bg-[#2D6A4F]" : "bg-amber-500"
                    }`}
                    style={{ left: `${meterPosition}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-gray-400">-50</span>
                  <span className="text-[10px] text-gray-400">0</span>
                  <span className="text-[10px] text-gray-400">+50</span>
                </div>
              </div>

              <div
                className={`rounded-2xl px-3 py-2.5 text-xs ${
                  isInTune ? "bg-[#E8F5EE] text-[#2D6A4F]" : "bg-amber-50 text-amber-700"
                }`}
                style={{ fontWeight: 600 }}
              >
                {centsOff === null
                  ? "Nhấn Ghi Âm để bắt đầu."
                  : isInTune
                  ? "Đúng nốt ở bước hiện tại. Chuẩn bị chuyển sang nốt kế tiếp."
                  : centsOff > 0
                  ? "Nốt đang cao hơn nốt mục tiêu ở bước này. Hạ nhẹ cao độ."
                  : "Nốt đang thấp hơn nốt mục tiêu ở bước này. Nâng nhẹ cao độ."}
              </div>
            </div>
          </>
        )}

        {/* Quiz Section */}
        {activeSection === "quiz" && (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[#1A3A2B] text-sm" style={{ fontWeight: 700 }}>Điểm số</p>
                <p className="text-gray-400 text-xs">Đoán đúng nhạc cụ</p>
              </div>
              <div className="text-right">
                <p className="text-[#2D6A4F] text-2xl" style={{ fontWeight: 700 }}>{quizScore}</p>
                <p className="text-gray-400 text-xs">/ {quizTotal} câu</p>
              </div>
            </div>

            <div className="bg-[#1A3A2B] rounded-2xl p-6 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-4">
                <Target size={13} className="text-[#95D5B2]" />
                <p className="text-[#95D5B2] text-xs">Câu hỏi</p>
              </div>
              <div className="w-20 h-20 bg-white/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <Disc3 size={38} className="text-white" />
              </div>
              <p className="text-white text-base" style={{ fontWeight: 600 }}>
                Nhạc cụ nào có tiếng vang đặc trưng như thế này?
              </p>
              <p className="text-[#52B788] text-xs mt-2">
                Nốt: "{notes[quizNote]}" — nốt thứ {quizNote + 1}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {instruments.slice(0, 4).map((inst, i) => {
                const isCorrect = i === quizNote % 4;
                const isSelected = quizAnswer === i;
                return (
                  <button
                    key={inst.id}
                    onClick={() => !showResult && handleQuizAnswer(i)}
                    disabled={showResult}
                    className={`bg-white rounded-2xl p-4 flex flex-col items-center gap-2 border-2 transition-all active:scale-[0.97] shadow-sm ${
                      showResult
                        ? isCorrect ? "border-[#52B788] bg-[#E8F5EE]"
                          : isSelected ? "border-red-400 bg-red-50"
                          : "border-gray-100"
                        : "border-gray-100 active:border-[#2D6A4F]"
                    }`}
                  >
                    <Disc3 size={24} className="text-[#2D6A4F]" />
                    <p className="text-gray-700 text-xs text-center" style={{ fontWeight: 600 }}>{inst.name}</p>
                    {showResult && isCorrect && <span className="text-[#2D6A4F] text-xs">✓ Đúng!</span>}
                    {showResult && isSelected && !isCorrect && <span className="text-red-500 text-xs">✗ Sai</span>}
                  </button>
                );
              })}
            </div>

            <div className="bg-[#E8F5EE] rounded-2xl p-4 border border-[#52B788]/30">
              <div className="flex items-center gap-1.5">
                <Lightbulb size={13} className="text-[#1A3A2B]" />
                <p className="text-[#1A3A2B] text-xs" style={{ fontWeight: 700 }}>Bạn có biết?</p>
              </div>
              <p className="text-[#2D6A4F] text-xs mt-1 leading-relaxed">
                Âm nhạc dân tộc Việt Nam có hơn 50 loại nhạc cụ, mỗi vùng miền có những loại đặc trưng riêng.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
