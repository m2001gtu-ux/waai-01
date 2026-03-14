export interface CasePoint {
  text: string;
  merit: string;
  demerit: string;
}

export interface VisualSummary {
  problem: {
    title: string;
    items: string[];
  };
  solution: {
    title: string;
    quadrants: string[];
  };
  roles: {
    left: { title: string; items: string[] };
    right: { title: string; items: string[] };
  };
  outcome: {
    title: string;
    items: string[];
  };
}

export interface Case {
  id: string;
  title: string;
  simple_title: string;
  summary: string;
  category: string;
  deadline: string;
  points: CasePoint[];
  image_url?: string;
  summary_pdf_url?: string;
  full_pdf_url?: string;
  visual_summary?: VisualSummary;
}

export interface Feedback {
  id: string;
  case_id: string;
  user_id: string;
  vote: 'agree' | 'disagree' | 'neutral';
  comment?: string;
  opinion_draft?: string;
  created_at: string;
}

export type Language = 'ja' | 'en' | 'zh' | 'ko' | 'easy_ja';

export const TRANSLATIONS = {
  ja: {
    title: "まち声ラボ",
    subtitle: "みんなの「声」で、もっと素敵な街へ。",
    active_cases: "いま募集中のテーマ",
    deadline: "いつまで？",
    view_details: "中身をのぞいてみる",
    vote: "お話ししてみる",
    agree: "いいね！",
    disagree: "ちょっと心配かも",
    neutral: "もっと教えて！",
    chat_placeholder: "あなたの正直な気持ちを教えてね...",
    generate_draft: "意見書の下書きをつくる",
    submit_opinion: "声を届ける（シミュレーション）",
    back: "もどる",
    points: "ここがポイント！",
    summary: "AIがざっくり解説",
    visual_overview: "図解でサクッと理解",
    view_summary_pdf: "短い資料を見る",
    view_full_pdf: "詳しい資料を見る",
    goal: "やりたいこと",
    target: "だれのため？",
    period: "いつまで？",
    background_title: "1. なぜやるの？（いまの様子）",
    direction_title: "2. これからどうする？",
    policies_title: "3. 具体的にやることリスト",
    schedule_title: "4. これからの予定"
  },
  en: {
    title: "Machigoe Lab",
    subtitle: "Your voice changes the city.",
    active_cases: "Active Cases",
    deadline: "Deadline",
    view_details: "View Details",
    vote: "Vote & Chat",
    agree: "Agree",
    disagree: "Disagree",
    neutral: "Want to know more",
    chat_placeholder: "Tell us what you think...",
    generate_draft: "Generate Draft",
    submit_opinion: "Submit to Gov (Sim)",
    back: "Back",
    points: "Key Points",
    summary: "AI Summary",
    visual_overview: "Visual Overview",
    view_summary_pdf: "Summary (PDF)",
    view_full_pdf: "Full Document (PDF)",
    goal: "Goal",
    target: "Target",
    period: "Period",
    background_title: "1. Background & Context",
    direction_title: "2. Basic Direction",
    policies_title: "3. Specific Policy Package",
    schedule_title: "4. Future Schedule"
  },
  easy_ja: {
    title: "まち声ラボ",
    subtitle: "まちの こと、 AIと いっしょに かんがえよう",
    active_cases: "いま やっている こと",
    deadline: "いつまで",
    view_details: "くわしく みる",
    vote: "おはなし する",
    agree: "いいと おもう",
    disagree: "よくないと おもう",
    neutral: "もっと しりたい",
    chat_placeholder: "おもっている こと、 おしえて ください...",
    generate_draft: "てがみを つくる",
    submit_opinion: "おくって みる",
    back: "もどる",
    points: "だいじな ところ",
    summary: "AIの まとめ",
    visual_overview: "えで みる まとめ",
    view_summary_pdf: "みじかい かみ（PDF）",
    view_full_pdf: "ぜんぶ かいてある かみ（PDF）",
    goal: "やりたいこと",
    target: "だれのため",
    period: "いつまで",
    background_title: "1. いまの ようす",
    direction_title: "2. これから どうするか",
    policies_title: "3. やること まとめ",
    schedule_title: "4. これからの よてい"
  }
};
