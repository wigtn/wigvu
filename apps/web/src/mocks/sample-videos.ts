import { VideoAnalysis, TranscriptSegment } from "@/types/analysis";

// Sample transcript segments for Rick Astley
const rickAstleyTranscript: TranscriptSegment[] = [
  { start: 0, end: 4, text: "We're no strangers to love", originalText: "We're no strangers to love", translatedText: "우리는 사랑에 낯선 사이가 아니야" },
  { start: 4, end: 8, text: "You know the rules and so do I", originalText: "You know the rules and so do I", translatedText: "넌 규칙을 알고 나도 알아" },
  { start: 8, end: 12, text: "A full commitment's what I'm thinking of", originalText: "A full commitment's what I'm thinking of", translatedText: "완전한 헌신이 내가 생각하는 것" },
  { start: 12, end: 16, text: "You wouldn't get this from any other guy", originalText: "You wouldn't get this from any other guy", translatedText: "다른 남자에게선 이런 걸 얻지 못할 거야" },
  { start: 16, end: 20, text: "I just wanna tell you how I'm feeling", originalText: "I just wanna tell you how I'm feeling", translatedText: "난 그저 내 기분을 말하고 싶어" },
  { start: 20, end: 24, text: "Gotta make you understand", originalText: "Gotta make you understand", translatedText: "널 이해시켜야 해" },
  { start: 24, end: 28, text: "Never gonna give you up", originalText: "Never gonna give you up", translatedText: "절대 널 포기하지 않을 거야" },
  { start: 28, end: 32, text: "Never gonna let you down", originalText: "Never gonna let you down", translatedText: "절대 널 실망시키지 않을 거야" },
  { start: 32, end: 36, text: "Never gonna run around and desert you", originalText: "Never gonna run around and desert you", translatedText: "절대 돌아다니며 널 버리지 않을 거야" },
  { start: 36, end: 40, text: "Never gonna make you cry", originalText: "Never gonna make you cry", translatedText: "절대 널 울리지 않을 거야" },
  { start: 40, end: 44, text: "Never gonna say goodbye", originalText: "Never gonna say goodbye", translatedText: "절대 작별인사 하지 않을 거야" },
  { start: 44, end: 48, text: "Never gonna tell a lie and hurt you", originalText: "Never gonna tell a lie and hurt you", translatedText: "절대 거짓말하고 널 아프게 하지 않을 거야" },
  { start: 48, end: 52, text: "We've known each other for so long", originalText: "We've known each other for so long", translatedText: "우리는 오랫동안 서로를 알아왔어" },
  { start: 52, end: 56, text: "Your heart's been aching but you're too shy to say it", originalText: "Your heart's been aching but you're too shy to say it", translatedText: "네 마음이 아팠지만 말하기엔 너무 수줍어" },
  { start: 56, end: 60, text: "Inside we both know what's been going on", originalText: "Inside we both know what's been going on", translatedText: "속으로 우린 둘 다 무슨 일인지 알아" },
];

// Sample transcript for tech video
const techVideoTranscript: TranscriptSegment[] = [
  { start: 0, end: 5, text: "Welcome to today's tutorial", originalText: "Welcome to today's tutorial", translatedText: "오늘 튜토리얼에 오신 것을 환영합니다" },
  { start: 5, end: 10, text: "We're going to build something amazing", originalText: "We're going to build something amazing", translatedText: "오늘 놀라운 것을 만들어 볼 거예요" },
  { start: 10, end: 15, text: "First, let's set up our development environment", originalText: "First, let's set up our development environment", translatedText: "먼저 개발 환경을 설정해봅시다" },
  { start: 15, end: 20, text: "Make sure you have Node.js installed", originalText: "Make sure you have Node.js installed", translatedText: "Node.js가 설치되어 있는지 확인하세요" },
  { start: 20, end: 25, text: "Now let's create a new project", originalText: "Now let's create a new project", translatedText: "이제 새 프로젝트를 만들어봅시다" },
  { start: 25, end: 30, text: "Run npm init in your terminal", originalText: "Run npm init in your terminal", translatedText: "터미널에서 npm init을 실행하세요" },
  { start: 30, end: 35, text: "This will create a package.json file", originalText: "This will create a package.json file", translatedText: "이렇게 하면 package.json 파일이 생성됩니다" },
  { start: 35, end: 40, text: "Next, we'll install our dependencies", originalText: "Next, we'll install our dependencies", translatedText: "다음으로 의존성을 설치합니다" },
  { start: 40, end: 45, text: "Let me show you the project structure", originalText: "Let me show you the project structure", translatedText: "프로젝트 구조를 보여드릴게요" },
  { start: 45, end: 50, text: "This is really important for scalability", originalText: "This is really important for scalability", translatedText: "확장성을 위해 정말 중요합니다" },
  { start: 50, end: 55, text: "Now let's write our first component", originalText: "Now let's write our first component", translatedText: "이제 첫 번째 컴포넌트를 작성해봅시다" },
  { start: 55, end: 60, text: "Pay attention to the naming conventions", originalText: "Pay attention to the naming conventions", translatedText: "네이밍 컨벤션에 주의하세요" },
];

// Sample video analyses for demo purposes
export const sampleVideos: VideoAnalysis[] = [
  {
    id: "sample-1",
    videoId: "dQw4w9WgXcQ",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    title: "Rick Astley - Never Gonna Give You Up (Official Music Video)",
    channelName: "Rick Astley",
    channelId: "UCuAXFkgsw1L7xaCfnd5JJOw",
    publishedAt: "2009-10-25T00:00:00Z",
    duration: 213,
    viewCount: 1500000000,
    likeCount: 16000000,
    thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    summary:
      "The iconic 1987 music video that became an internet phenomenon.\nFeatures Rick Astley's signature dance moves and powerful vocals.\nA timeless classic that transcends generations.",
    watchScore: 9,
    watchScoreReason:
      "Cultural landmark with over 1.5 billion views. Essential internet history.",
    keywords: ["Music", "80s", "Pop", "Classic", "Meme", "Internet Culture"],
    highlights: [
      {
        timestamp: 0,
        title: "인트로",
        description: "전설의 시작, 그 유명한 오프닝",
      },
      {
        timestamp: 24,
        title: "첫 번째 코러스",
        description: "Never gonna give you up!",
      },
      {
        timestamp: 48,
        title: "2절 시작",
        description: "감정이 고조되는 구간",
      },
      {
        timestamp: 103,
        title: "댄스 브레이크",
        description: "상징적인 댄스 무브 시퀀스",
      },
    ],
    language: "en",
    transcriptSource: "youtube",
    transcriptSegments: rickAstleyTranscript,
    isKorean: false,
    analyzedAt: new Date().toISOString(),
  },
  {
    id: "sample-2",
    videoId: "jNQXAC9IVRw",
    url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    title: "Me at the zoo",
    channelName: "jawed",
    channelId: "UC4QobU6STFB0P71PMvOGN5A",
    publishedAt: "2005-04-23T00:00:00Z",
    duration: 19,
    viewCount: 300000000,
    likeCount: 13000000,
    thumbnailUrl: "https://i.ytimg.com/vi/jNQXAC9IVRw/maxresdefault.jpg",
    summary:
      "The first video ever uploaded to YouTube on April 23, 2005.\nYouTube co-founder Jawed Karim at the San Diego Zoo.\nA piece of internet history in just 19 seconds.",
    watchScore: 8,
    watchScoreReason:
      "Historical significance as YouTube's first video. Short but meaningful.",
    keywords: ["History", "YouTube", "First Video", "Zoo", "2005", "Internet"],
    highlights: [
      {
        timestamp: 0,
        title: "역사의 시작",
        description: "YouTube가 시작된 곳",
      },
      {
        timestamp: 10,
        title: "코끼리",
        description: "코끼리의 멋진 점",
      },
    ],
    language: "en",
    transcriptSource: "youtube",
    transcriptSegments: [
      { start: 0, end: 5, text: "All right, so here we are in front of the elephants", originalText: "All right, so here we are in front of the elephants", translatedText: "자, 우리는 지금 코끼리들 앞에 있습니다" },
      { start: 5, end: 10, text: "The cool thing about these guys is that", originalText: "The cool thing about these guys is that", translatedText: "이 녀석들의 멋진 점은" },
      { start: 10, end: 15, text: "They have really really really long trunks", originalText: "They have really really really long trunks", translatedText: "정말 정말 정말 긴 코를 가지고 있다는 거예요" },
      { start: 15, end: 19, text: "And that's cool", originalText: "And that's cool", translatedText: "그리고 그게 멋져요" },
    ],
    isKorean: false,
    analyzedAt: new Date().toISOString(),
  },
  {
    id: "sample-3",
    videoId: "9bZkp7q19f0",
    url: "https://www.youtube.com/watch?v=9bZkp7q19f0",
    title: "PSY - GANGNAM STYLE(강남스타일) M/V",
    channelName: "officialpsy",
    channelId: "UCrDkAvwZum-UTjHmzDI2iIw",
    publishedAt: "2012-07-15T00:00:00Z",
    duration: 253,
    viewCount: 5000000000,
    likeCount: 25000000,
    thumbnailUrl: "https://i.ytimg.com/vi/9bZkp7q19f0/maxresdefault.jpg",
    summary:
      "The viral K-pop sensation that broke YouTube records in 2012.\nPSY's signature horse-riding dance became a global phenomenon.\nFirst video to reach 1 billion views on YouTube.",
    watchScore: 9,
    watchScoreReason:
      "Record-breaking cultural phenomenon. Entertaining and historically significant.",
    keywords: ["K-pop", "Dance", "Viral", "Korea", "Music", "2012"],
    highlights: [
      {
        timestamp: 0,
        title: "오프닝",
        description: "강남구 장면",
      },
      {
        timestamp: 60,
        title: "코러스",
        description: "오빤 강남스타일",
      },
      {
        timestamp: 120,
        title: "엘리베이터 씬",
        description: "상징적인 엘리베이터 댄스",
      },
      {
        timestamp: 180,
        title: "말춤",
        description: "유명한 말타기 춤",
      },
    ],
    language: "ko",
    transcriptSource: "youtube",
    transcriptSegments: [
      { start: 0, end: 4, text: "오빤 강남스타일", originalText: "오빤 강남스타일", translatedText: "오빤 강남스타일" },
      { start: 4, end: 8, text: "강남스타일", originalText: "강남스타일", translatedText: "강남스타일" },
      { start: 8, end: 12, text: "낮에는 따사로운 인간적인 여자", originalText: "낮에는 따사로운 인간적인 여자", translatedText: "낮에는 따사로운 인간적인 여자" },
      { start: 12, end: 16, text: "커피 한잔의 여유를 아는 품격 있는 여자", originalText: "커피 한잔의 여유를 아는 품격 있는 여자", translatedText: "커피 한잔의 여유를 아는 품격 있는 여자" },
      { start: 16, end: 20, text: "밤이 오면 심장이 뜨거워지는 여자", originalText: "밤이 오면 심장이 뜨거워지는 여자", translatedText: "밤이 오면 심장이 뜨거워지는 여자" },
      { start: 20, end: 24, text: "그런 반전 있는 여자", originalText: "그런 반전 있는 여자", translatedText: "그런 반전 있는 여자" },
    ],
    isKorean: true,
    analyzedAt: new Date().toISOString(),
  },
  {
    id: "sample-4",
    videoId: "kJQP7kiw5Fk",
    url: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
    title: "Luis Fonsi - Despacito ft. Daddy Yankee",
    channelName: "Luis Fonsi",
    channelId: "UCLp8RBhQHu9wSsq62j_Md6A",
    publishedAt: "2017-01-12T00:00:00Z",
    duration: 282,
    viewCount: 8300000000,
    likeCount: 52000000,
    thumbnailUrl: "https://i.ytimg.com/vi/kJQP7kiw5Fk/maxresdefault.jpg",
    summary:
      "The most-viewed video on YouTube for years with over 8 billion views.\nLatin pop masterpiece featuring Luis Fonsi and Daddy Yankee.\nCatchy reggaeton beat that dominated global charts in 2017.",
    watchScore: 8,
    watchScoreReason:
      "Record-breaking hit with infectious melody. Great for music lovers.",
    keywords: ["Latin", "Reggaeton", "Spanish", "Music", "Dance", "Puerto Rico"],
    highlights: [
      {
        timestamp: 0,
        title: "인트로",
        description: "오프닝 기타 리프",
      },
      {
        timestamp: 45,
        title: "Despacito",
        description: "메인 코러스 시작",
      },
      {
        timestamp: 120,
        title: "Daddy Yankee",
        description: "Daddy Yankee의 벌스",
      },
    ],
    language: "es",
    transcriptSource: "youtube",
    transcriptSegments: [
      { start: 0, end: 5, text: "Sí, sabes que ya llevo un rato mirándote", originalText: "Sí, sabes que ya llevo un rato mirándote", translatedText: "그래, 알잖아 한동안 널 바라봤다는 거" },
      { start: 5, end: 10, text: "Tengo que bailar contigo hoy", originalText: "Tengo que bailar contigo hoy", translatedText: "오늘 너와 춤을 춰야 해" },
      { start: 10, end: 15, text: "Vi que tu mirada ya estaba llamándome", originalText: "Vi que tu mirada ya estaba llamándome", translatedText: "네 눈빛이 날 부르고 있었어" },
      { start: 15, end: 20, text: "Muéstrame el camino que yo voy", originalText: "Muéstrame el camino que yo voy", translatedText: "내가 갈 길을 보여줘" },
      { start: 20, end: 25, text: "Despacito", originalText: "Despacito", translatedText: "천천히" },
      { start: 25, end: 30, text: "Quiero respirar tu cuello despacito", originalText: "Quiero respirar tu cuello despacito", translatedText: "천천히 네 목을 느끼고 싶어" },
    ],
    isKorean: false,
    analyzedAt: new Date().toISOString(),
  },
  {
    id: "sample-5",
    videoId: "fJ9rUzIMcZQ",
    url: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
    title: "Queen – Bohemian Rhapsody (Official Video Remastered)",
    channelName: "Queen Official",
    channelId: "UCiMhD4jzUqG-IgPzUmmytRQ",
    publishedAt: "2008-08-01T00:00:00Z",
    duration: 367,
    viewCount: 1800000000,
    likeCount: 19000000,
    thumbnailUrl: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/maxresdefault.jpg",
    summary:
      "Queen's legendary 1975 masterpiece, remastered in HD.\nA six-minute operatic rock epic that defied all conventions.\nWidely considered one of the greatest songs ever recorded.",
    watchScore: 10,
    watchScoreReason:
      "Musical masterpiece. Essential viewing for any music enthusiast.",
    keywords: ["Rock", "Queen", "Classic", "Opera", "Freddie Mercury", "1975"],
    highlights: [
      {
        timestamp: 0,
        title: "Is this real life?",
        description: "상징적인 피아노 인트로와 발라드 섹션",
      },
      {
        timestamp: 49,
        title: "Mama, just killed a man",
        description: "감정적인 발라드가 계속됩니다",
      },
      {
        timestamp: 180,
        title: "오페라 섹션",
        description: "Galileo! Galileo!",
      },
      {
        timestamp: 270,
        title: "하드 록",
        description: "So you think you can stone me",
      },
    ],
    language: "en",
    transcriptSource: "youtube",
    transcriptSegments: [
      { start: 0, end: 5, text: "Is this the real life? Is this just fantasy?", originalText: "Is this the real life? Is this just fantasy?", translatedText: "이게 현실인가? 그냥 환상인가?" },
      { start: 5, end: 10, text: "Caught in a landslide, no escape from reality", originalText: "Caught in a landslide, no escape from reality", translatedText: "산사태에 갇혀, 현실에서 벗어날 수 없어" },
      { start: 10, end: 15, text: "Open your eyes, look up to the skies and see", originalText: "Open your eyes, look up to the skies and see", translatedText: "눈을 떠, 하늘을 올려다보고 봐" },
      { start: 15, end: 20, text: "I'm just a poor boy, I need no sympathy", originalText: "I'm just a poor boy, I need no sympathy", translatedText: "난 그저 가난한 소년, 동정은 필요 없어" },
      { start: 20, end: 25, text: "Because I'm easy come, easy go, little high, little low", originalText: "Because I'm easy come, easy go, little high, little low", translatedText: "왜냐면 난 쉽게 왔다 쉽게 가니까, 약간 높았다 약간 낮았다" },
      { start: 25, end: 30, text: "Any way the wind blows doesn't really matter to me, to me", originalText: "Any way the wind blows doesn't really matter to me, to me", translatedText: "바람이 어디로 불든 나에겐 상관없어" },
    ],
    isKorean: false,
    analyzedAt: new Date().toISOString(),
  },
  {
    id: "sample-6",
    videoId: "tech-demo",
    url: "https://www.youtube.com/watch?v=tech-demo",
    title: "Build a Full Stack App in 30 Minutes - React & Node.js Tutorial",
    channelName: "TechChannel",
    channelId: "tech-channel-id",
    publishedAt: "2024-01-15T00:00:00Z",
    duration: 1800,
    viewCount: 250000,
    likeCount: 12000,
    thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    summary:
      "A comprehensive tutorial on building modern web applications.\nCovers React, Node.js, and database integration.\nPerfect for developers looking to level up their skills.",
    watchScore: 8,
    watchScoreReason:
      "Well-structured tutorial with practical examples. Great for intermediate developers.",
    keywords: ["React", "Node.js", "Tutorial", "Web Dev", "Full Stack", "Programming"],
    highlights: [
      {
        timestamp: 0,
        title: "소개",
        description: "프로젝트 개요 설명",
      },
      {
        timestamp: 120,
        title: "환경 설정",
        description: "개발 환경 구축",
      },
      {
        timestamp: 300,
        title: "프론트엔드",
        description: "React 컴포넌트 작성",
      },
      {
        timestamp: 600,
        title: "백엔드",
        description: "Node.js API 구현",
      },
      {
        timestamp: 900,
        title: "데이터베이스",
        description: "MongoDB 연동",
      },
      {
        timestamp: 1200,
        title: "배포",
        description: "Vercel로 배포하기",
      },
    ],
    language: "en",
    transcriptSource: "youtube",
    transcriptSegments: techVideoTranscript,
    isKorean: false,
    analyzedAt: new Date().toISOString(),
  },
];

// Get a random sample video
export function getRandomSampleVideo(): VideoAnalysis {
  const randomIndex = Math.floor(Math.random() * sampleVideos.length);
  return sampleVideos[randomIndex];
}
