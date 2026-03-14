import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import dotenv from "dotenv";
import { randomUUID } from "node:crypto";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("machigoe.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    simple_title TEXT NOT NULL,
    summary TEXT NOT NULL,
    category TEXT NOT NULL,
    deadline TEXT NOT NULL,
    points TEXT NOT NULL, -- JSON string
    image_url TEXT,
    summary_pdf_url TEXT,
    full_pdf_url TEXT,
    visual_summary TEXT, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    vote TEXT NOT NULL,
    comment TEXT,
    opinion_draft TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/cases", (req, res) => {
    const cases = db.prepare("SELECT * FROM cases ORDER BY created_at DESC").all();
    res.json(cases.map(c => ({
      ...c,
      points: JSON.parse(c.points as string),
      visual_summary: c.visual_summary ? JSON.parse(c.visual_summary as string) : null
    })));
  });

  app.post("/api/feedback", (req, res) => {
    const { case_id, user_id, vote, comment, opinion_draft } = req.body;
    const id = randomUUID();
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 30); // 30 days TTL

    db.prepare(`
      INSERT INTO feedback (id, case_id, user_id, vote, comment, opinion_draft, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, case_id, user_id, vote, comment, opinion_draft, expires_at.toISOString());

    res.json({ success: true, id });
  });

  // Seed data
  db.prepare("DELETE FROM cases").run(); // Refresh seed data
  const seedCases = [
    {
      id: "1",
      title: "東京都における中学校の部活動改革に関する推進計画（案）",
      simple_title: "中学校の部活動を地域で支える仕組みづくり",
      summary: "生徒のスポーツ・文化活動の機会確保と教員の働き方改革を両立させるための計画。地域クラブ活動への移行やガイドラインの策定が柱となっています。",
      category: "教育・部活動",
      deadline: "2026-03-03",
      points: JSON.stringify([
        {
          text: "地域クラブ活動への移行推進",
          merit: "専門的な指導を受けられる機会が増え、生徒の選択肢が広がる。",
          demerit: "地域によって活動内容や費用に差が出る可能性（地域格差）がある。"
        },
        {
          text: "教員の働き方改革と負担軽減",
          merit: "教員が授業準備や生徒指導に集中でき、過重労働が解消される。",
          demerit: "学校と地域クラブの連携業務など、新たな事務負担が発生する場合がある。"
        },
        {
          text: "生徒の多様な活動機会の確保",
          merit: "学校単位では難しかった多種多様なスポーツや文化活動が可能になる。",
          demerit: "移動距離の増加や、家庭の経済的負担が増える懸念がある。"
        }
      ]),
      image_url: "https://picsum.photos/seed/junior-high-school-sports/800/600",
      summary_pdf_url: "https://www.metro.tokyo.lg.jp/documents/d/tosei/20260202_34_04",
      full_pdf_url: "https://www.metro.tokyo.lg.jp/documents/d/tosei/20260202_34_05",
      visual_summary: JSON.stringify({
        problem: {
          title: "【これまでの部活動：現状と限界】",
          items: ["教員の過重負担（休日返上の指導）", "少子化による学校単位の活動困難", "専門的な指導の不足", "活動時間の制限と質の確保"]
        },
        solution: {
          title: "【地域移行という「新しいルール」】",
          quadrants: ["生徒中心の活動", "持続可能な運営", "地域との連携強化", "専門性の確保"]
        },
        roles: {
          left: {
            title: "学校の役割",
            items: ["活動場所の提供・管理", "生徒の安全・健康管理", "地域との連絡調整"]
          },
          right: {
            title: "地域の役割",
            items: ["専門的な技術指導", "大会・イベントの運営", "多様な種目の提供"]
          }
        },
        outcome: {
          title: "【アウトカム：より質の高い「行政サービス」】",
          items: ["生徒の選択肢向上", "教員の負担軽減", "地域コミュニティ活性", "迅速・正確な運営"]
        }
      })
    },
    {
      id: "2",
      title: "（仮称）子供・若者体験活動施設 区部基本計画（案）",
      simple_title: "子供や若者が色々な体験ができる新しい施設づくり",
      summary: "多様性への理解促進と自立に向けた体験ができる施設の整備計画。具体的な事業内容や施設要件、事業手法を定めています。",
      category: "教育・福祉",
      deadline: "2026-02-13",
      points: JSON.stringify([
        {
          text: "多様な体験プログラムの提供",
          merit: "学校や家庭では得られない貴重な社会体験や異年齢交流ができる。",
          demerit: "プログラムの質を維持するための専門スタッフの確保が課題となる。"
        },
        {
          text: "自立支援に向けた施設要件",
          merit: "困難を抱える若者が安心して過ごせる居場所となり、自立のきっかけになる。",
          demerit: "プライバシー保護と安全管理のバランスをどう取るかが難しい。"
        },
        {
          text: "区部における具体的な整備計画",
          merit: "アクセスの良い場所に拠点ができ、多くの若者が利用しやすくなる。",
          demerit: "建設コストや維持管理費など、長期的な財政負担が伴う。"
        }
      ]),
      image_url: "https://picsum.photos/seed/youth-activity-center/800/600",
      summary_pdf_url: "https://www.metro.tokyo.lg.jp/documents/d/tosei/20260115_11_01a",
      full_pdf_url: "https://www.metro.tokyo.lg.jp/documents/d/tosei/20260115_11_02a",
      visual_summary: JSON.stringify({
        problem: {
          title: "【若者の居場所：現状と課題】",
          items: ["自由に集まれる場所の不足", "体験機会の格差（経済・環境）", "地域社会からの孤立感", "夜間の安全な居場所の欠如"]
        },
        solution: {
          title: "【体験施設という「成長の場」】",
          quadrants: ["若者主体の運営", "多様な体験機会", "安全なサードプレイス", "地域共生・多世代交流"]
        },
        roles: {
          left: {
            title: "施設の役割",
            items: ["機材・場所の提供", "専門スタッフの伴走支援", "安全な環境の維持"]
          },
          right: {
            title: "若者の役割",
            items: ["イベントの自主企画", "ルールの自分たちでの策定", "コミュニティの形成"]
          }
        },
        outcome: {
          title: "【アウトカム：若者が輝く「未来」】",
          items: ["自己実現の機会向上", "新たな繋がりの創出", "地域の活力向上", "多様な才能の開花"]
        }
      })
    }
  ];

  const insert = db.prepare(`
    INSERT INTO cases (id, title, simple_title, summary, category, deadline, points, image_url, summary_pdf_url, full_pdf_url, visual_summary)
    VALUES (@id, @title, @simple_title, @summary, @category, @deadline, @points, @image_url, @summary_pdf_url, @full_pdf_url, @visual_summary)
  `);
  seedCases.forEach(c => insert.run(c));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
