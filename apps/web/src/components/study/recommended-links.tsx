"use client";

import { useRouter } from "next/navigation";

const RECOMMENDED_ARTICLES = [
  {
    title: "겨울철 한파 대비 행동요령",
    source: "KBS",
    url: "https://news.kbs.co.kr/news/pc/view/view.do?ncd=7861234",
  },
  {
    title: "한국의 커피 문화, 세계 3위 소비국의 비밀",
    source: "브런치",
    url: "https://brunch.co.kr/@travelwriter/42",
  },
  {
    title: "서울 지하철 이용 완전 가이드",
    source: "Visit Seoul",
    url: "https://korean.visitseoul.net/attractions",
  },
  {
    title: "한국어 존댓말, 왜 중요할까",
    source: "한겨레",
    url: "https://www.hani.co.kr/arti/culture/culture_general/1234567.html",
  },
  {
    title: "K-드라마로 배우는 일상 한국어 표현",
    source: "에세이",
    url: "https://brunch.co.kr/@koreanlearning/15",
  },
];

export function RecommendedLinks() {
  const router = useRouter();

  const handleClick = (url: string) => {
    const encoded = encodeURIComponent(url);
    router.push(`/study?url=${encoded}`);
  };

  return (
    <div className="text-left mt-8">
      <p className="text-xs font-medium text-[var(--foreground-secondary)] mb-3">
        추천 글
      </p>
      <ul className="space-y-2">
        {RECOMMENDED_ARTICLES.map((article, i) => (
          <li key={i}>
            <button
              onClick={() => handleClick(article.url)}
              className="text-sm text-[var(--accent)] hover:underline text-left"
            >
              · {article.title}
              <span className="text-[var(--foreground-secondary)] ml-1.5">
                — {article.source}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
