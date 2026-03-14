import type { VercelRequest, VercelResponse } from '@vercel/node';

const cases = [
  {
    id: "1",
    title: "東京都における中学校の部活動改革に関する推進計画（案）",
    simple_title: "中学校の部活動を地域で支える仕組みづくり",
    summary: "生徒のスポーツ・文化活動の機会確保と教員の働き方改革を両立させるための計画。地域クラブ活動への移行やガイドラインの策定が柱となっています。",
    category: "教育・部活動",
    deadline: "2026-03-03",
    points: [
      { text: "地域クラブ活動への移行推進", merit: "専門的な指導を受けられる機会が増え、生徒の選択肢が広がる。", demerit: "地域によって活動内容や費用に差が出る可能性（地域格差）がある。" },
      { text: "教員の働き方改革と負担軽減", merit: "教員が授業準備や生徒指導に集中でき、過重労働が解消される。", demerit: "学校と地域クラブの連携業務など、新たな事務負担が発生する場合がある。" },
      { text: "生徒の多様な活動機会の確保", merit: "学校単位では難しかった多種多様なスポーツや文化活動が可能になる。", demerit: "移動距離の増加や、家庭の経済的負担が増える懸念がある。" }
    ],
    image_url: "https://picsum.photos/seed/junior-high-school-sports/800/600",
    summary_pdf_url: "https://www.metro.tokyo.lg.jp/documents/d/tosei/20260202_34_04",
    full_pdf_url: "https://www.metro.tokyo.lg.jp/documents/d/tosei/20260202_34_05"
  },
  {
    id: "2",
    title: "（仮称）子供・若者体験活動施設 区部基本計画（案）",
    simple_title: "子供や若者が色々な体験ができる新しい施設づくり",
    summary: "多様性への理解促進と自立に向けた体験ができる施設の整備計画。具体的な事業内容や施設要件、事業手法を定めています。",
    category: "教育・福祉",
    deadline: "2026-02-13",
    points: [
      { text: "多様な体験プログラムの提供", merit: "学校や家庭では得られない貴重な社会体験や異年齢交流ができる。", demerit: "プログラムの質を維持するための専門スタッフの確保が課題となる。" },
      { text: "自立支援に向けた施設要件", merit: "困難を抱える若者が安心して過ごせる居場所となり、自立のきっかけになる。", demerit: "プライバシー保護と安全管理のバランスをどう取るかが難しい。" },
      { text: "区部における具体的な整備計画", merit: "アクセスの良い場所に拠点ができ、多くの若者が利用しやすくなる。", demerit: "建設コストや維持管理費など、長期的な財政負担が伴う。" }
    ],
    image_url: "https://picsum.photos/seed/youth-activity-center/800/600",
    summary_pdf_url: "https://www.metro.tokyo.lg.jp/documents/d/tosei/20260115_11_01a",
    full_pdf_url: "https://www.metro.tokyo.lg.jp/documents/d/tosei/20260115_11_02a"
  }
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(cases);
}
