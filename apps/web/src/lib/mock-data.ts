import { VideoAnalysis } from "@/types/analysis";

/**
 * 더미 데이터 1 - Steve Jobs Stanford 연설 (유명한 졸업 연설)
 * 실제 자막과 타임스탬프가 맞도록 설정
 */
export const mockVideoAnalysis: VideoAnalysis = {
  id: "mock-001",
  videoId: "UF8uR6Z6KLc", // Steve Jobs Stanford Commencement Speech
  url: "https://www.youtube.com/watch?v=UF8uR6Z6KLc",
  title: "Steve Jobs' 2005 Stanford Commencement Address",
  channelName: "Stanford",
  channelId: "UC-EnprmCZ3OXyAoG7vjVNCA",
  publishedAt: "2008-03-07T00:00:00Z",
  duration: 905, // 약 15분
  viewCount: 45000000,
  likeCount: 850000,
  thumbnailUrl: "https://img.youtube.com/vi/UF8uR6Z6KLc/maxresdefault.jpg",
  summary: "스티브 잡스의 2005년 스탠포드 대학 졸업 연설입니다. 세 가지 이야기를 통해 인생의 교훈을 전합니다: 점들을 연결하기, 사랑과 상실, 그리고 죽음에 대하여. 'Stay Hungry, Stay Foolish'라는 명언으로 유명합니다.",
  watchScore: 10,
  watchScoreReason: "인생에서 가장 영감을 주는 연설 중 하나",
  keywords: ["스티브잡스", "스탠포드", "졸업연설", "애플", "인생조언"],
  highlights: [
    { timestamp: 0, title: "소개", description: "세 가지 이야기를 하겠다고 소개" },
    { timestamp: 65, title: "첫 번째 이야기", description: "점들을 연결하기 - 대학 중퇴 이야기" },
    { timestamp: 300, title: "두 번째 이야기", description: "사랑과 상실 - 애플에서 해고된 이야기" },
    { timestamp: 540, title: "세 번째 이야기", description: "죽음에 대하여" },
    { timestamp: 840, title: "Stay Hungry, Stay Foolish", description: "마무리 명언" },
  ],
  language: "en",
  transcriptSource: "youtube",
  detectedLanguage: { code: "en", probability: 0.99 },
  isKorean: false,
  transcriptSegments: [
    // 0:00 - 0:30
    { start: 0, end: 7, text: "I am honored to be with you today at your commencement from one of the finest universities in the world.", originalText: "I am honored to be with you today at your commencement from one of the finest universities in the world.", translatedText: "오늘 세계 최고의 대학 중 하나인 이곳 졸업식에 함께 하게 되어 영광입니다." },
    { start: 7, end: 12, text: "I never graduated from college.", originalText: "I never graduated from college.", translatedText: "저는 대학을 졸업한 적이 없습니다." },
    { start: 12, end: 18, text: "Truth be told, this is the closest I've ever gotten to a college graduation.", originalText: "Truth be told, this is the closest I've ever gotten to a college graduation.", translatedText: "사실, 이것이 제가 대학 졸업식에 가장 가까이 와본 경험입니다." },
    { start: 18, end: 24, text: "Today I want to tell you three stories from my life.", originalText: "Today I want to tell you three stories from my life.", translatedText: "오늘 저는 제 인생에서 세 가지 이야기를 들려드리고 싶습니다." },
    { start: 24, end: 28, text: "That's it. No big deal. Just three stories.", originalText: "That's it. No big deal. Just three stories.", translatedText: "그게 전부입니다. 별거 아니에요. 그냥 세 가지 이야기입니다." },

    // 0:30 - 1:00
    { start: 28, end: 34, text: "The first story is about connecting the dots.", originalText: "The first story is about connecting the dots.", translatedText: "첫 번째 이야기는 점들을 연결하는 것에 관한 것입니다." },
    { start: 34, end: 42, text: "I dropped out of Reed College after the first 6 months, but then stayed around as a drop-in for another 18 months or so before I really quit.", originalText: "I dropped out of Reed College after the first 6 months, but then stayed around as a drop-in for another 18 months or so before I really quit.", translatedText: "저는 리드 대학을 6개월 만에 자퇴했지만, 완전히 떠나기 전까지 18개월 정도 청강생으로 남아있었습니다." },
    { start: 42, end: 46, text: "So why did I drop out?", originalText: "So why did I drop out?", translatedText: "그래서 왜 자퇴했을까요?" },
    { start: 46, end: 54, text: "It started before I was born.", originalText: "It started before I was born.", translatedText: "그 이야기는 제가 태어나기 전부터 시작됩니다." },
    { start: 54, end: 62, text: "My biological mother was a young, unwed college graduate student, and she decided to put me up for adoption.", originalText: "My biological mother was a young, unwed college graduate student, and she decided to put me up for adoption.", translatedText: "제 생모는 젊고 미혼인 대학원생이었고, 저를 입양 보내기로 결정했습니다." },

    // 1:00 - 1:30
    { start: 62, end: 72, text: "She felt very strongly that I should be adopted by college graduates, so everything was all set for me to be adopted at birth by a lawyer and his wife.", originalText: "She felt very strongly that I should be adopted by college graduates, so everything was all set for me to be adopted at birth by a lawyer and his wife.", translatedText: "그녀는 제가 대졸자에게 입양되어야 한다고 강하게 느꼈고, 저는 태어나자마자 변호사 부부에게 입양될 예정이었습니다." },
    { start: 72, end: 80, text: "Except that when I popped out they decided at the last minute that they really wanted a girl.", originalText: "Except that when I popped out they decided at the last minute that they really wanted a girl.", translatedText: "그런데 제가 태어났을 때, 그들은 마지막 순간에 여자아이를 원한다고 결정했습니다." },
    { start: 80, end: 90, text: "So my parents, who were on a waiting list, got a call in the middle of the night asking: \"We have an unexpected baby boy; do you want him?\"", originalText: "So my parents, who were on a waiting list, got a call in the middle of the night asking: \"We have an unexpected baby boy; do you want him?\"", translatedText: "그래서 대기 명단에 있던 제 양부모님은 한밤중에 전화를 받았습니다: \"예상치 못한 남자아이가 있는데, 원하시나요?\"" },

    // 1:30 - 2:00
    { start: 90, end: 94, text: "They said: \"Of course.\"", originalText: "They said: \"Of course.\"", translatedText: "그들은 말했습니다: \"물론이죠.\"" },
    { start: 94, end: 104, text: "My biological mother later found out that my mother had never graduated from college and that my father had never graduated from high school.", originalText: "My biological mother later found out that my mother had never graduated from college and that my father had never graduated from high school.", translatedText: "제 생모는 나중에 양어머니가 대학을 졸업하지 않았고 양아버지는 고등학교도 졸업하지 않았다는 것을 알게 되었습니다." },
    { start: 104, end: 110, text: "She refused to sign the final adoption papers.", originalText: "She refused to sign the final adoption papers.", translatedText: "그녀는 최종 입양 서류에 서명하기를 거부했습니다." },
    { start: 110, end: 120, text: "She only relented a few months later when my parents promised that I would someday go to college.", originalText: "She only relented a few months later when my parents promised that I would someday go to college.", translatedText: "양부모님이 언젠가 저를 대학에 보내겠다고 약속한 후에야 몇 달 후에 동의했습니다." },

    // 2:00 - 2:30
    { start: 120, end: 126, text: "And 17 years later I did go to college.", originalText: "And 17 years later I did go to college.", translatedText: "그리고 17년 후, 저는 대학에 갔습니다." },
    { start: 126, end: 136, text: "But I naively chose a college that was almost as expensive as Stanford, and all of my working-class parents' savings were being spent on my college tuition.", originalText: "But I naively chose a college that was almost as expensive as Stanford, and all of my working-class parents' savings were being spent on my college tuition.", translatedText: "하지만 저는 순진하게도 스탠포드만큼이나 비싼 대학을 선택했고, 노동자 계층인 양부모님의 모든 저축이 제 등록금으로 쓰이고 있었습니다." },
    { start: 136, end: 142, text: "After six months, I couldn't see the value in it.", originalText: "After six months, I couldn't see the value in it.", translatedText: "6개월 후, 저는 그것의 가치를 느낄 수 없었습니다." },
    { start: 142, end: 150, text: "I had no idea what I wanted to do with my life and no idea how college was going to help me figure it out.", originalText: "I had no idea what I wanted to do with my life and no idea how college was going to help me figure it out.", translatedText: "제 인생에서 무엇을 하고 싶은지 몰랐고, 대학이 그것을 알아내는 데 어떻게 도움이 될지 몰랐습니다." },

    // 2:30 - 3:00
    { start: 150, end: 158, text: "And here I was spending all of the money my parents had saved their entire life.", originalText: "And here I was spending all of the money my parents had saved their entire life.", translatedText: "그런데 저는 부모님이 평생 모은 돈을 다 쓰고 있었습니다." },
    { start: 158, end: 164, text: "So I decided to drop out and trust that it would all work out OK.", originalText: "So I decided to drop out and trust that it would all work out OK.", translatedText: "그래서 저는 자퇴하기로 결정했고, 모든 것이 잘 될 거라고 믿었습니다." },
    { start: 164, end: 170, text: "It was pretty scary at the time, but looking back it was one of the best decisions I ever made.", originalText: "It was pretty scary at the time, but looking back it was one of the best decisions I ever made.", translatedText: "당시에는 꽤 무서웠지만, 돌이켜보면 제가 한 최고의 결정 중 하나였습니다." },
    { start: 170, end: 180, text: "The minute I dropped out I could stop taking the required classes that didn't interest me, and begin dropping in on the ones that looked interesting.", originalText: "The minute I dropped out I could stop taking the required classes that didn't interest me, and begin dropping in on the ones that looked interesting.", translatedText: "자퇴하는 순간, 관심 없는 필수 과목 수강을 그만두고 흥미로워 보이는 수업을 청강하기 시작할 수 있었습니다." },
  ],
  analyzedAt: new Date().toISOString(),
};

/**
 * 더미 데이터 2 - Me at the zoo (유튜브 최초 영상, 18초)
 */
export const mockVideoAnalysisShort: VideoAnalysis = {
  id: "mock-002",
  videoId: "jNQXAC9IVRw", // Me at the zoo - 최초의 YouTube 영상
  url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  title: "Me at the zoo",
  channelName: "jawed",
  channelId: "UC4QobU6STFB0P71PMvOGN5A",
  publishedAt: "2005-04-23T00:00:00Z",
  duration: 19,
  viewCount: 320000000,
  likeCount: 14000000,
  thumbnailUrl: "https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg",
  summary: "YouTube 최초의 영상입니다. 공동창업자 자웨드 카림이 샌디에이고 동물원에서 코끼리 앞에서 촬영한 18초짜리 영상으로, 인터넷 역사의 한 페이지를 장식했습니다.",
  watchScore: 8,
  watchScoreReason: "인터넷 역사상 가장 중요한 영상 중 하나",
  keywords: ["YouTube", "최초영상", "역사", "자웨드카림", "동물원"],
  highlights: [
    { timestamp: 0, title: "동물원 소개", description: "코끼리들이 있는 곳" },
    { timestamp: 10, title: "코끼리 설명", description: "코끼리의 긴 코에 대한 언급" },
  ],
  language: "en",
  transcriptSource: "youtube",
  detectedLanguage: { code: "en", probability: 0.95 },
  isKorean: false,
  transcriptSegments: [
    { start: 0, end: 5, text: "All right, so here we are in front of the elephants", originalText: "All right, so here we are in front of the elephants", translatedText: "자, 여기 코끼리들 앞에 있습니다" },
    { start: 5, end: 9, text: "and the cool thing about these guys is that", originalText: "and the cool thing about these guys is that", translatedText: "이 녀석들의 멋진 점은" },
    { start: 9, end: 14, text: "they have really, really, really long trunks", originalText: "they have really, really, really long trunks", translatedText: "정말, 정말, 정말 긴 코를 가지고 있다는 거예요" },
    { start: 14, end: 16, text: "and that's cool", originalText: "and that's cool", translatedText: "그게 멋지죠" },
    { start: 16, end: 19, text: "And that's pretty much all there is to say", originalText: "And that's pretty much all there is to say", translatedText: "그리고 그게 할 말의 전부예요" },
  ],
  analyzedAt: new Date().toISOString(),
};

/**
 * 더미 데이터 3 - Charlie bit my finger (유명한 바이럴 영상)
 */
export const mockVideoAnalysis3: VideoAnalysis = {
  id: "mock-003",
  videoId: "0EqSXDwTq6U", // Baby Shark Dance
  url: "https://www.youtube.com/watch?v=0EqSXDwTq6U",
  title: "Baby Shark Dance | Sing and Dance! | @Baby Shark Official",
  channelName: "Baby Shark Official",
  channelId: "UC1X42vgvF2k8MiPJCdWZY_A",
  publishedAt: "2016-06-17T00:00:00Z",
  duration: 136,
  viewCount: 14000000000,
  likeCount: 45000000,
  thumbnailUrl: "https://img.youtube.com/vi/0EqSXDwTq6U/maxresdefault.jpg",
  summary: "전 세계적으로 가장 많이 본 유튜브 영상입니다. 중독성 있는 멜로디와 간단한 율동으로 어린이들에게 큰 인기를 끌고 있습니다.",
  watchScore: 7,
  watchScoreReason: "어린이 교육 콘텐츠로 세계 최다 조회수 기록",
  keywords: ["베이비샤크", "동요", "어린이", "댄스", "핑크퐁"],
  highlights: [
    { timestamp: 0, title: "인트로", description: "Baby Shark 시작" },
    { timestamp: 30, title: "Mommy Shark", description: "엄마 상어 등장" },
    { timestamp: 60, title: "Daddy Shark", description: "아빠 상어 등장" },
  ],
  language: "en",
  transcriptSource: "youtube",
  detectedLanguage: { code: "en", probability: 0.90 },
  isKorean: false,
  transcriptSegments: [
    { start: 0, end: 4, text: "Baby shark, doo doo doo doo doo doo", originalText: "Baby shark, doo doo doo doo doo doo", translatedText: "아기 상어, 뚜루루뚜루" },
    { start: 4, end: 8, text: "Baby shark, doo doo doo doo doo doo", originalText: "Baby shark, doo doo doo doo doo doo", translatedText: "아기 상어, 뚜루루뚜루" },
    { start: 8, end: 12, text: "Baby shark, doo doo doo doo doo doo", originalText: "Baby shark, doo doo doo doo doo doo", translatedText: "아기 상어, 뚜루루뚜루" },
    { start: 12, end: 16, text: "Baby shark!", originalText: "Baby shark!", translatedText: "아기 상어!" },
    { start: 16, end: 20, text: "Mommy shark, doo doo doo doo doo doo", originalText: "Mommy shark, doo doo doo doo doo doo", translatedText: "엄마 상어, 뚜루루뚜루" },
    { start: 20, end: 24, text: "Mommy shark, doo doo doo doo doo doo", originalText: "Mommy shark, doo doo doo doo doo doo", translatedText: "엄마 상어, 뚜루루뚜루" },
    { start: 24, end: 28, text: "Mommy shark, doo doo doo doo doo doo", originalText: "Mommy shark, doo doo doo doo doo doo", translatedText: "엄마 상어, 뚜루루뚜루" },
    { start: 28, end: 32, text: "Mommy shark!", originalText: "Mommy shark!", translatedText: "엄마 상어!" },
    { start: 32, end: 36, text: "Daddy shark, doo doo doo doo doo doo", originalText: "Daddy shark, doo doo doo doo doo doo", translatedText: "아빠 상어, 뚜루루뚜루" },
    { start: 36, end: 40, text: "Daddy shark, doo doo doo doo doo doo", originalText: "Daddy shark, doo doo doo doo doo doo", translatedText: "아빠 상어, 뚜루루뚜루" },
    { start: 40, end: 44, text: "Daddy shark, doo doo doo doo doo doo", originalText: "Daddy shark, doo doo doo doo doo doo", translatedText: "아빠 상어, 뚜루루뚜루" },
    { start: 44, end: 48, text: "Daddy shark!", originalText: "Daddy shark!", translatedText: "아빠 상어!" },
  ],
  analyzedAt: new Date().toISOString(),
};
