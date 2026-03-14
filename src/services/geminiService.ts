import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const analyzeCase = async (caseId: string, documentText: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `以下の行政資料を解析し、市民が理解しやすいように要約してください。
    
    資料内容:
    ${documentText}
    
    出力は以下のJSON形式でお願いします:
    {
      "summary": "3行程度の要約",
      "points": ["論点1", "論点2", "論点3"],
      "neutral_perspectives": [
        {"pro": "賛成側の視点", "con": "反対側の視点"}
      ],
      "image_prompt": "この案件を象徴するフラットデザインのピクトグラム生成用プロンプト（英語）"
    }`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          points: { type: Type.ARRAY, items: { type: Type.STRING } },
          neutral_perspectives: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                pro: { type: Type.STRING },
                con: { type: Type.STRING }
              }
            }
          },
          image_prompt: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const chatWithAI = async (message: string, history: any[], caseContext: string) => {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: `あなたは「まち声ラボ」のAIガイドです。市民が行政案件に対して自分の意見を形成するのを助けます。
      
      案件コンテキスト:
      ${caseContext}
      
      ガイドライン:
      1. 友達とカフェで話しているような、親しみやすくフランクなトーンで話してください（「〜だね」「〜かな？」など）。
      2. 一度の発言は短く、簡潔に（2〜3文程度）。長文は避けてください。
      3. 常に中立を保ち、特定の意見に誘導しないでください。
      4. ユーザーが感情的な場合は、その背景にある「事実」や「願い」を汲み取ってください。
      5. 最終的に、ユーザーの思いを「行政に届く論理的な意見書」の形式にまとめる手助けをしてください。
      6. 意見の対立がある場合は、さらっと「こういう見方もあるみたいだよ」と反対側の視点も提示してください。`,
    }
  });

  const response = await chat.sendMessage({ message });
  return response.text;
};

export const generateOpinionDraft = async (conversation: string, caseTitle: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `以下の対話内容から、行政に提出するための「パブリックコメント（意見書）」のドラフトを作成してください。
    
    案件名: ${caseTitle}
    対話内容:
    ${conversation}
    
    要件:
    - 論理的で丁寧な言葉遣い。
    - 結論、理由、具体的な提案の構成。
    - 箇条書きを活用して読みやすくする。`,
  });

  return response.text;
};
