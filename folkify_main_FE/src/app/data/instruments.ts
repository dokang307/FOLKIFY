import beoDatMayTroiSheet from "../../assets/beodatmaytroi.jpg";
import daCoHoaiLangSheet from "../../assets/dacohoailang.jpg";
import luuThuyHanhVanSheet from "../../assets/luuthuyhanhvan.jpg";
import lyConSaoSheet from "../../assets/lyconsao.jpg";
import lyNguaOSheet from "../../assets/lynguao.jpg";
import tiengDanBauSheet from "../../assets/tiengdanbau.jpg";
import trongComSheet from "../../assets/trongcom.jpg";
import xuanVeTrenBanSheet from "../../assets/xuanvetrenban.jpg";

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  clipStatus?: "available" | "in_progress" | "coming_soon";
  clipProgress?: number;
  clipEta?: string;
  youtubeEmbedUrl?: string;
  completed?: boolean;
  description: string;
  steps: string[];
  tips: string[];
  videoThumb: string;
  xp: number;
}

export interface Instrument {
  id: string;
  name: string;
  englishName: string;
  region: string;
  category: string;
  emoji: string;
  color: string;
  bgGradient: string;
  image: string;
  shortDesc: string;
  description: string;
  origin: string;
  material: string;
  soundRange: string;
  difficulty: number;
  popularity: number;
  lessons: Lesson[];
  songs: { title: string; artist: string; duration: string }[];
  facts: string[];
}

export const instruments: Instrument[] = [
  {
    id: "dan-tranh",
    name: "Đàn Tranh",
    englishName: "Dan Tranh",
    region: "Toàn quốc",
    category: "Dây gảy",
    emoji: "🎵",
    color: "#B45309",
    bgGradient: "from-amber-600 to-amber-800",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/%C3%90%C3%A0n%20Tranh.jpg",
    shortDesc: "Đàn tranh 16 dây, âm thanh trong trẻo, thanh thoát",
    description:
      "Đàn tranh là nhạc cụ dây gảy truyền thống của Việt Nam, có 16 dây kim loại căng trên thân đàn hình thang dài. Tiếng đàn tranh trong trẻo, thanh thoát như tiếng suối chảy, thường được dùng trong nhạc thính phòng và biểu diễn dân tộc.",
    origin: "Có nguồn gốc từ thời Lý - Trần (thế kỷ XI-XIV)",
    material: "Gỗ ngô đồng, dây kim loại",
    soundRange: "C4 - C7",
    difficulty: 3,
    popularity: 5,
    lessons: [
      {
        id: "dt-1",
        title: "Làm quen với đàn tranh",
        duration: "15 phút",
        level: "Beginner",
        clipStatus: "available",
        youtubeEmbedUrl:
          "https://www.youtube.com/embed/PehCcuN10M0?list=PLPfXdEzIap5iEbYjcDI3vdgrM7nSML-3u&index=1",
        completed: true,
        description: "Tìm hiểu cấu tạo, cách giữ đàn và tư thế ngồi đúng.",
        videoThumb: "https://images.unsplash.com/photo-1769867303648-0a3ed8115440?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
        xp: 30,
        steps: [
          "Đặt đàn trên bàn hoặc giá đỡ, đầu nhỏ hướng về phía phải",
          "Ngồi thẳng lưng, hai tay đặt nhẹ lên dây đàn",
          "Tay phải dùng móng gảy dây, tay trái nhấn/nhún dây để luyến",
          "Gảy thử từng dây từ thấp đến cao để cảm nhận âm thanh",
        ],
        tips: [
          "Cắt móng tay tay trái ngắn, tay phải để móng dài hơn",
          "Giữ cổ tay tay phải thư giãn, không cứng",
        ],
      },
      {
        id: "dt-2",
        title: "Kỹ thuật gảy cơ bản",
        duration: "20 phút",
        level: "Beginner",
        clipStatus: "available",
        youtubeEmbedUrl:
          "https://www.youtube.com/embed/fA5EjCZcARA?list=PLPfXdEzIap5iEbYjcDI3vdgrM7nSML-3u&index=2",
        completed: true,
        description: "Học cách gảy đơn âm và chạy ngón cơ bản.",
        videoThumb: "https://images.unsplash.com/photo-1762006211376-b22a3134cc58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
        xp: 40,
        steps: [
          "Luyện gảy từng nốt riêng lẻ với lực đều",
          "Thực hành chạy ngón 5 nốt liên tiếp",
          "Kết hợp tay trái nhấn dây để tạo âm luyến",
          "Tập bài luyện ngón đơn giản 8 nhịp",
        ],
        tips: [
          "Không gảy quá mạnh gây âm thanh chói",
          "Giữ nhịp đều bằng cách đếm thầm",
        ],
      },
      {
        id: "dt-3",
        title: "Bài Lý Con Sáo",
        duration: "30 phút",
        level: "Beginner",
        clipStatus: "available",
        youtubeEmbedUrl:
          "https://www.youtube.com/embed/tNcKXRrw3LI?list=PLPfXdEzIap5iEbYjcDI3vdgrM7nSML-3u&index=3",
        completed: false,
        description: "Học bài dân ca nổi tiếng Lý Con Sáo trên đàn tranh.",
        videoThumb: "https://images.unsplash.com/photo-1673637082482-55952ee63ef4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
        xp: 60,
        steps: [
          "Nghe bản nhạc gốc nhiều lần để thuộc giai điệu",
          "Học từng đoạn 4 nhịp một",
          "Ghép các đoạn lại thành bài hoàn chỉnh",
          "Thêm kỹ thuật nhấn nhá, luyến láy",
        ],
        tips: [
          "Học thuộc giai điệu trước khi chơi nhạc cụ",
          "Luyện chậm trước, sau đó tăng dần tốc độ",
        ],
      },
      {
        id: "dt-4",
        title: "Kỹ thuật rung dây",
        duration: "25 phút",
        level: "Intermediate",
        clipStatus: "available",
        youtubeEmbedUrl:
          "https://www.youtube.com/embed/gJNvDxMxzis?list=PLPfXdEzIap5iEbYjcDI3vdgrM7nSML-3u&index=4",
        completed: false,
        description: "Kỹ thuật rung để tạo âm thanh mềm mại, cảm xúc.",
        videoThumb: "https://images.unsplash.com/photo-1763058389604-e407ce6bd702?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
        xp: 80,
        steps: [
          "Gảy dây và dùng tay trái rung nhẹ trên dây",
          "Điều chỉnh biên độ rung từ nhỏ đến lớn",
          "Kết hợp rung với nhấn dây",
          "Áp dụng vào bài nhạc chậm",
        ],
        tips: ["Rung đều và có kiểm soát", "Không rung quá nhanh gây âm run"],
      },
      {
        id: "dt-5",
        title: "Hòa tấu nhạc dân tộc",
        duration: "45 phút",
        level: "Advanced",
        clipStatus: "available",
        youtubeEmbedUrl:
          "https://www.youtube.com/embed/95iWs1d_Dj8?list=PLPfXdEzIap5iEbYjcDI3vdgrM7nSML-3u&index=5",
        completed: false,
        description: "Tham gia hòa tấu cùng các nhạc cụ dân tộc khác.",
        videoThumb: "https://images.unsplash.com/photo-1759156240671-c646dc7386f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
        xp: 120,
        steps: [
          "Luyện nghe và theo dõi nhịp chung",
          "Giữ đúng vai trò giai điệu/đệm",
          "Phối hợp với đàn nhị, sáo trúc",
          "Biểu diễn bài hòa tấu hoàn chỉnh",
        ],
        tips: [
          "Lắng nghe các nhạc cụ khác nhiều hơn chính mình",
          "Giữ âm lượng vừa phải khi hòa tấu",
        ],
      },
    ],
    songs: [
      { title: "Lý Con Sáo", artist: "Dân ca Nam Bộ", duration: "3:24" },
      { title: "Xuân về trên bản", artist: "Hoàng Việt", duration: "4:10" },
      { title: "Dạ cổ hoài lang", artist: "Cao Văn Lầu", duration: "5:30" },
    ],
    facts: [
      "Đàn tranh còn được gọi là 'thập lục' vì có 16 dây",
      "Âm thanh đàn tranh tượng trưng cho sự thanh tao, tinh tế",
      "Đây là nhạc cụ phổ biến trong nhạc tài tử Nam Bộ",
    ],
  },
  {
    id: "sao-truc",
    name: "Sáo Trúc",
    englishName: "Sao Truc",
    region: "Toàn quốc",
    category: "Hơi",
    emoji: "🎋",
    color: "#15803D",
    bgGradient: "from-green-600 to-emerald-800",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Th%E1%BB%95i%20s%C3%A1o.jpg",
    shortDesc: "Sáo làm từ ống trúc, âm thanh trong sáng và gần gũi thiên nhiên",
    description:
      "Sáo trúc là nhạc cụ hơi truyền thống, được làm từ ống trúc già tự nhiên. Tiếng sáo mang âm điệu trong sáng, gần gũi thiên nhiên, thường gắn với hình ảnh đồng quê Việt Nam.",
    origin: "Có từ hàng nghìn năm trước Công nguyên",
    material: "Trúc già (loài tre đặc biệt)",
    soundRange: "D4 - D7",
    difficulty: 2,
    popularity: 5,
    lessons: [
      {
        id: "st-1",
        title: "Cách cầm sáo và thổi hơi",
        duration: "10 phút",
        level: "Beginner",
        completed: true,
        description: "Học tư thế cầm sáo và kỹ thuật thổi hơi cơ bản.",
        videoThumb: "https://images.unsplash.com/photo-1672578249566-3f4b6d564aa2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
        xp: 25,
        steps: [
          "Đặt lỗ thổi lên môi dưới, nghiêng nhẹ 45 độ",
          "Thổi hơi nhẹ nhàng, không phồng má",
          "Luyện tạo âm thanh ổn định trên một nốt",
          "Tập đổi hơi đều đặn",
        ],
        tips: ["Môi hơi chun lại như thổi nến", "Thở bằng bụng, không thở ngực"],
      },
      {
        id: "st-2",
        title: "7 nốt cơ bản",
        duration: "20 phút",
        level: "Beginner",
        completed: true,
        description: "Làm quen 7 nốt cơ bản trên sáo trúc.",
        videoThumb: "https://images.unsplash.com/photo-1762006211376-b22a3134cc58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
        xp: 40,
        steps: [
          "Học bấm lỗ cho từng nốt: Đồ, Rê, Mi, Fa, Sol, La, Si",
          "Thổi từng nốt riêng lẻ để nhận biết âm thanh",
          "Luyện chuyển nốt mượt mà",
          "Tập thang âm lên và xuống",
        ],
        tips: ["Bấm lỗ kín hoàn toàn để tránh âm rè", "Luyện chậm từng nốt một"],
      },
      {
        id: "st-3",
        title: "Bài Trống Cơm",
        duration: "25 phút",
        level: "Intermediate",
        completed: false,
        description: "Học bài dân ca Trống Cơm vui tươi trên sáo trúc.",
        videoThumb: "https://images.unsplash.com/photo-1673637082482-55952ee63ef4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
        xp: 70,
        steps: [
          "Nghe giai điệu bài Trống Cơm",
          "Học từng câu nhạc 4 nhịp",
          "Thực hành kỹ thuật luyến nốt",
          "Chơi hoàn chỉnh với nhịp đều",
        ],
        tips: ["Bài này có nhịp vui, giữ nhịp đều", "Chú ý các nốt luyến"],
      },
      {
        id: "st-4",
        title: "Kỹ thuật láy",
        duration: "30 phút",
        level: "Advanced",
        completed: false,
        description: "Kỹ thuật láy đặc trưng của sáo trúc dân tộc.",
        videoThumb: "https://images.unsplash.com/photo-1763058389604-e407ce6bd702?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
        xp: 100,
        steps: [
          "Học 3 kiểu láy cơ bản: láy đơn, láy đôi, láy vòng",
          "Luyện từng kiểu riêng lẻ chậm rãi",
          "Áp dụng vào các đoạn nhạc phù hợp",
          "Hoàn thiện bài có láy nâng cao",
        ],
        tips: ["Láy cần ngón tay linh hoạt, luyện tập từng ngày"],
      },
    ],
    songs: [
      { title: "Trống Cơm", artist: "Dân ca Quan họ", duration: "2:45" },
      { title: "Bèo dạt mây trôi", artist: "Dân ca Bắc Bộ", duration: "3:15" },
    ],
    facts: [
      "Sáo trúc gắn liền với hình ảnh chú bé chăn trâu thổi sáo",
      "Âm thanh sáo có khả năng trị liệu tâm lý",
      "Có nhiều loại sáo khác nhau theo vùng miền",
    ],
  },
  {
    id: "dan-bau",
    name: "Đàn Bầu",
    englishName: "Dan Bau",
    region: "Toàn quốc",
    category: "Dây gảy",
    emoji: "🎶",
    color: "#7C3AED",
    bgGradient: "from-violet-600 to-purple-800",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Vietnamese%20musical%20instrument%20Dan%20bau%202.jpg",
    shortDesc: "Đàn một dây độc đáo, tiếng vang ngân nga như giọng người",
    description:
      "Đàn bầu là nhạc cụ dây gảy độc đáo nhất thế giới với chỉ một dây. Âm thanh của đàn bầu được tạo ra bằng cách gảy dây và uốn cần đàn, tạo ra những âm thanh ngân nga, dìu dặt như giọng người thổn thức.",
    origin: "Nhạc cụ thuần Việt, khoảng thế kỷ VIII",
    material: "Gỗ, dây kim loại, bầu nậm",
    soundRange: "C2 - C6",
    difficulty: 4,
    popularity: 4,
    lessons: [
      {
        id: "db-1",
        title: "Nguyên lý hoạt động",
        duration: "15 phút",
        level: "Beginner",
        completed: true,
        description: "Hiểu cách đàn bầu tạo ra âm thanh đặc biệt.",
        videoThumb: "https://images.unsplash.com/photo-1762006211376-b22a3134cc58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
        xp: 30,
        steps: [
          "Tìm hiểu cấu tạo: thân đàn, cần đàn, bầu cộng hưởng",
          "Gảy dây không uốn cần để nghe âm cơ bản",
          "Uốn cần nhẹ để nghe sự thay đổi cao độ",
          "Luyện điều chỉnh cao độ bằng cần đàn",
        ],
        tips: [
          "Cần đàn rất nhạy cảm, điều chỉnh từ từ",
          "Giữ ngón gảy nhẹ nhàng để âm trong",
        ],
      },
      {
        id: "db-2",
        title: "Kỹ thuật harmonics",
        duration: "30 phút",
        level: "Intermediate",
        completed: false,
        description: "Kỹ thuật đặc trưng tạo âm hồi thanh của đàn bầu.",
        videoThumb: "https://images.unsplash.com/photo-1673637082482-55952ee63ef4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
        xp: 80,
        steps: [
          "Đặt ngón cái chạm nhẹ vào điểm 1/2 dây",
          "Gảy dây đồng thời nhấc ngón lên nhanh",
          "Thực hành các điểm harmonics khác nhau",
          "Kết hợp với uốn cần",
        ],
        tips: [
          "Chạm vào điểm đúng, không chạm quá sâu",
          "Kỹ thuật này cần thời gian luyện tập lâu",
        ],
      },
      {
        id: "db-3",
        title: "Biểu diễn bài Ru con",
        duration: "40 phút",
        level: "Advanced",
        completed: false,
        description: "Chơi hoàn chỉnh bài Ru con với đầy đủ cảm xúc.",
        videoThumb: "https://images.unsplash.com/photo-1763058389604-e407ce6bd702?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
        xp: 110,
        steps: [
          "Ôn lại tất cả kỹ thuật đã học",
          "Học sheet nhạc bài Ru con",
          "Luyện tập từng đoạn với tốc độ chậm",
          "Biểu diễn trọn vẹn với cảm xúc",
        ],
        tips: ["Tập trung vào cảm xúc, không chỉ kỹ thuật"],
      },
    ],
    songs: [
      { title: "Ru con", artist: "Dân ca Nam Bộ", duration: "4:20" },
      { title: "Tiếng đàn bầu", artist: "Nguyễn Đình Phúc", duration: "3:45" },
    ],
    facts: [
      "Đàn bầu là nhạc cụ độc nhất vô nhị trên thế giới",
      "Người ta ví tiếng đàn bầu như giọng ca da diết của quê hương",
      "Chỉ người Việt Nam mới có loại đàn này",
    ],
  },
  {
    id: "dan-nguyet",
    name: "Đàn Nguyệt",
    englishName: "Dan Nguyet",
    region: "Miền Bắc",
    category: "Dây gảy",
    emoji: "🌙",
    color: "#0369A1",
    bgGradient: "from-blue-600 to-sky-800",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Dan%20Nguyet%20%28Vietnamese%20moon%20lute%29.jpg",
    shortDesc: "Đàn 2 dây với hộp cộng hưởng hình mặt trăng đặc trưng",
    description:
      "Đàn nguyệt (đàn kìm) có hộp cộng hưởng hình tròn như mặt trăng, với 2 dây tơ hoặc nylon. Đây là nhạc cụ chủ đạo trong hát chầu văn và âm nhạc dân gian Bắc Bộ.",
    origin: "Xuất hiện từ thời Lý (thế kỷ XI)",
    material: "Gỗ gụ, dây tơ/nylon",
    soundRange: "G3 - G6",
    difficulty: 3,
    popularity: 4,
    lessons: [
      {
        id: "dn-1",
        title: "Giới thiệu đàn nguyệt",
        duration: "15 phút",
        level: "Beginner",
        completed: true,
        description: "Làm quen với cấu tạo và cách giữ đàn nguyệt.",
        videoThumb: "https://images.unsplash.com/photo-1763058389604-e407ce6bd702?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
        xp: 30,
        steps: [
          "Đặt đàn trên đùi trái, cần đàn hướng lên",
          "Tay phải cầm que gảy hoặc ngón tay",
          "Gảy thử 2 dây để cảm nhận âm thanh",
          "Luyện gảy dây đều và rõ",
        ],
        tips: ["Giữ đàn chắc nhưng thoải mái", "Không kẹp đàn quá chặt"],
      },
      {
        id: "dn-2",
        title: "Các thế bấm cơ bản",
        duration: "25 phút",
        level: "Intermediate",
        completed: false,
        description: "Học cách bấm nốt trên cần đàn nguyệt.",
        videoThumb: "https://images.unsplash.com/photo-1762006211376-b22a3134cc58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
        xp: 70,
        steps: [
          "Nhận biết 5 phím đàn cơ bản",
          "Luyện bấm từng phím kết hợp gảy dây",
          "Tập chuyển phím mượt mà",
          "Chơi thang âm cơ bản",
        ],
        tips: ["Bấm sát phím để âm rõ", "Thư giãn ngón tay, không cứng"],
      },
    ],
    songs: [
      { title: "Cờ người", artist: "Nhạc chầu văn", duration: "5:10" },
      { title: "Lý ngựa ô", artist: "Dân ca Bắc Bộ", duration: "3:30" },
    ],
    facts: [
      "Đàn nguyệt còn gọi là 'đàn kìm' ở miền Nam",
      "Gắn với nghi lễ hầu đồng và hát văn",
      "Hộp đàn hình tròn tượng trưng cho mặt trăng",
    ],
  },
  {
    id: "dan-nhi",
    name: "Đàn Nhị",
    englishName: "Dan Nhi",
    region: "Toàn quốc",
    category: "Dây kéo",
    emoji: "🎻",
    color: "#DC2626",
    bgGradient: "from-red-600 to-rose-800",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Ngh%E1%BB%87%20s%C4%A9%20%C4%91%C3%A0n%20nh%E1%BB%8B.jpg",
    shortDesc: "Đàn 2 dây kéo cung, âm thanh da diết, sâu lắng",
    description:
      "Đàn nhị là nhạc cụ dây kéo có 2 dây, dùng cung vĩ bằng lông đuôi ngựa. Âm thanh đàn nhị da diết, sâu lắng, thường dùng để đệm cho hát chèo, cải lương và các thể loại dân ca.",
    origin: "Du nhập và bản địa hóa từ thế kỷ XIII",
    material: "Gỗ, da rắn, lông đuôi ngựa (cung vĩ)",
    soundRange: "D4 - A6",
    difficulty: 4,
    popularity: 4,
    lessons: [
      {
        id: "dn2-1",
        title: "Cách cầm cung vĩ",
        duration: "20 phút",
        level: "Beginner",
        completed: false,
        description: "Kỹ thuật cầm cung và kéo vĩ cơ bản.",
        videoThumb: "https://images.unsplash.com/photo-1673637082482-55952ee63ef4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
        xp: 35,
        steps: [
          "Cầm cung nhẹ nhàng bằng 3 ngón tay",
          "Kéo cung thẳng, vuông góc với dây",
          "Luyện kéo đều và liên tục",
          "Tập đổi hướng cung mượt mà",
        ],
        tips: ["Không bóp cung quá chặt", "Kéo cung bằng cánh tay, không chỉ cổ tay"],
      },
      {
        id: "dn2-2",
        title: "Các nốt cơ bản trên dây",
        duration: "30 phút",
        level: "Intermediate",
        completed: false,
        description: "Học các vị trí nốt nhạc trên dây đàn nhị.",
        videoThumb: "https://images.unsplash.com/photo-1762951046421-a8a6a26c5ced?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
        xp: 80,
        steps: [
          "Học 5 vị trí ngón tay cơ bản",
          "Kéo vĩ kết hợp bấm ngón",
          "Luyện thang âm cả hai dây",
          "Tập bài nhạc đơn giản",
        ],
        tips: ["Âm thanh đàn nhị rất nhạy, điều chỉnh lực kéo vừa phải"],
      },
    ],
    songs: [
      { title: "Hành vân", artist: "Nhạc lễ Nam Bộ", duration: "4:45" },
      { title: "Chinh phụ ngâm", artist: "Nhạc cổ điển VN", duration: "6:20" },
    ],
    facts: [
      "Đàn nhị còn được gọi là 'hồ cầm'",
      "Âm thanh đàn nhị thường gợi nỗi buồn, da diết",
      "Hộp cộng hưởng bọc da rắn tạo âm sắc đặc trưng",
    ],
  },
  {
    id: "dan-ty-ba",
    name: "Đàn Tỳ Bà",
    englishName: "Dan Ty Ba",
    region: "Miền Bắc",
    category: "Dây gảy",
    emoji: "🎼",
    color: "#9A3412",
    bgGradient: "from-orange-700 to-red-900",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Pipa%20player.JPG",
    shortDesc: "Đàn 4 dây hình quả lê, âm thanh sang trọng và biểu cảm",
    description:
      "Đàn tỳ bà là nhạc cụ dây gảy có lịch sử lâu đời, thường xuất hiện trong nhạc cung đình và dàn nhạc dân tộc. Âm sắc của đàn tỳ bà trong sáng, linh hoạt, thể hiện tốt cả giai điệu trữ tình lẫn tiết tấu nhanh.",
    origin: "Phát triển mạnh ở Việt Nam từ thời Lê - Nguyễn",
    material: "Gỗ cứng, dây nylon hoặc dây kim loại",
    soundRange: "A2 - A5",
    difficulty: 4,
    popularity: 3,
    lessons: [
      {
        id: "tb-1",
        title: "Làm quen với đàn tỳ bà",
        duration: "20 phút",
        level: "Beginner",
        completed: true,
        description: "Học tư thế ôm đàn và kỹ thuật gảy cơ bản.",
        videoThumb: "https://images.unsplash.com/photo-1691319845092-919e48f2e213?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
        xp: 35,
        steps: [
          "Ngồi thẳng lưng, đặt đàn nghiêng nhẹ trước ngực",
          "Giữ tay phải thả lỏng, tập gảy từng dây từ thấp đến cao",
          "Tay trái đặt ngón đúng vị trí trên phím",
          "Luyện mẫu gảy 4 nốt chậm và đều",
        ],
        tips: [
          "Không ôm đàn quá chặt để tránh mỏi vai",
          "Giữ nhịp bằng metronome tốc độ chậm",
        ],
      },
      {
        id: "tb-2",
        title: "Kỹ thuật phi và vê dây",
        duration: "30 phút",
        level: "Intermediate",
        completed: false,
        description: "Luyện hai kỹ thuật đặc trưng tạo độ mềm và độ dày âm.",
        videoThumb: "https://images.unsplash.com/photo-1763058389604-e407ce6bd702?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
        xp: 85,
        steps: [
          "Thực hành phi lên, phi xuống trên từng dây",
          "Tập vê nhanh bằng ngón trỏ và ngón giữa",
          "Kết hợp phi và vê trong đoạn nhạc 8 ô nhịp",
          "Tăng dần tốc độ khi đã giữ được âm rõ",
        ],
        tips: [
          "Luyện chậm để tay phải đều lực",
          "Ưu tiên âm sạch trước khi tăng tốc",
        ],
      },
    ],
    songs: [
      { title: "Lưu Thủy", artist: "Nhạc cổ truyền", duration: "4:05" },
      { title: "Kim Tiền", artist: "Dân nhạc Huế", duration: "3:35" },
    ],
    facts: [
      "Đàn tỳ bà có hình dáng gần giống quả lê",
      "Nhạc cụ này thường có 4 dây và nhiều phím cao",
      "Tỳ bà xuất hiện trong cả dàn nhạc cung đình và dân gian",
    ],
  },
];

export const categories = [
  { id: "all", label: "Tất cả" },
  { id: "Dây gảy", label: "Dây gảy" },
  { id: "Hơi", label: "Hơi" },
  { id: "Dây kéo", label: "Dây kéo" },
  { id: "Gõ", label: "Gõ" },
];

// ────────────────────────���───────────────────
// Sheet Music Library
// ────────────────────────────────────────────
export interface SheetMusic {
  id: string;
  title: string;
  composer: string;
  genre: string;
  level: "Dễ" | "Trung bình" | "Khó";
  isPremium: boolean;
  previewUrl: string;
  pages: number;
  instrument: string;
}

export const sheetMusicLibrary: SheetMusic[] = [
  {
    id: "sm-1",
    title: "Lý Con Sáo",
    composer: "Dân ca Nam Bộ",
    genre: "Dân ca",
    level: "Dễ",
    isPremium: false,
    previewUrl: lyConSaoSheet,
    pages: 2,
    instrument: "Đàn Tranh",
  },
  {
    id: "sm-2",
    title: "Dạ Cổ Hoài Lang",
    composer: "Cao Văn Lầu",
    genre: "Vọng cổ",
    level: "Trung bình",
    isPremium: false,
    previewUrl: daCoHoaiLangSheet,
    pages: 4,
    instrument: "Đàn Tranh",
  },
  {
    id: "sm-3",
    title: "Bèo Dạt Mây Trôi",
    composer: "Dân ca Bắc Bộ",
    genre: "Dân ca",
    level: "Dễ",
    isPremium: false,
    previewUrl: beoDatMayTroiSheet,
    pages: 2,
    instrument: "Sáo Trúc",
  },
  {
    id: "sm-4",
    title: "Tiếng Đàn Bầu",
    composer: "Nguyễn Đình Phúc",
    genre: "Nhạc mới",
    level: "Trung bình",
    isPremium: true,
    previewUrl: tiengDanBauSheet,
    pages: 3,
    instrument: "Đàn Bầu",
  },
  {
    id: "sm-5",
    title: "Thủy Hành Vân",
    composer: "Nhạc lễ Nam Bộ",
    genre: "Nhạc lễ",
    level: "Khó",
    isPremium: true,
    previewUrl: luuThuyHanhVanSheet,
    pages: 6,
    instrument: "Đàn Nhị",
  },
  {
    id: "sm-6",
    title: "Trống Cơm",
    composer: "Dân ca Quan họ",
    genre: "Dân ca",
    level: "Dễ",
    isPremium: false,
    previewUrl: trongComSheet,
    pages: 2,
    instrument: "Sáo Trúc",
  },
  {
    id: "sm-7",
    title: "Xuân Về Trên Bản",
    composer: "Hoàng Việt",
    genre: "Nhạc mới",
    level: "Trung bình",
    isPremium: true,
    previewUrl: xuanVeTrenBanSheet,
    pages: 4,
    instrument: "Đàn Tranh",
  },
  {
    id: "sm-8",
    title: "Lý Ngựa Ô",
    composer: "Dân ca Bắc Bộ",
    genre: "Dân ca",
    level: "Dễ",
    isPremium: false,
    previewUrl: lyNguaOSheet,
    pages: 2,
    instrument: "Đàn Nguyệt",
  },
];

export const sheetGenres = ["Tất cả", "Dân ca", "Vọng cổ", "Nhạc mới", "Nhạc lễ"];
export const sheetLevels = ["Tất cả", "Dễ", "Trung bình", "Khó"];
