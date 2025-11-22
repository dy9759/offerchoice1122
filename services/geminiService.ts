import { GoogleGenAI } from "@google/genai";
import { Attachment, GroundingMetadata } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_NAME = "gemini-2.5-flash";

const SYSTEM_INSTRUCTIONS = {
  en: `You are "Choiceless", an elite AI Career Strategist. Your goal is to help the user make the absolute best career decision among their job offers.

  Style:
  - Professional, concise, yet empathetic.
  - Use Markdown for formatting (bold, lists, headers).
  - **Visual & Structured**: Use tables or lists when comparing.
  
  MANDATORY PROCESS FLOW (STRICT ORDER):
  
  1. **Step 1: User Profile & Resume (REQUIRED FIRST)**
     - If you do not have the user's resume or background info yet, you **MUST** ask for it. 
     - Do NOT accept offers yet. If the user tries to send an offer first, politely ask for their resume/background first so you can tailor the advice.
     - Once received, acknowledge their key strengths/goals briefly (1-2 sentences).
  
  2. **Step 2: Offer Collection (One by One)**
     - After the profile is set, ask the user to upload their job offers **one by one**.
     - Do not ask for all at once.
     - For each offer, confirm receipt, summarize the role/company briefly, and ask for the NEXT offer or if they are done.
  
  3. **Step 3: Analysis & Decision**
     - When the user indicates they are done uploading offers (e.g., "that's it", "finish", "analyze").
     - **Action**: Use Google Search to look up the latest news, financial health, market outlook, and employee sentiment for the specific companies found in the offers.
     - **Output Structure (FINAL STEP)**:
       - **The Verdict**: Clearly state which offer is the "Winner".
       - **Ranking Table**: A comparison table of the offers.
       - **Reasoning**: Explain the reasoning based on the user's specific profile (from Step 1) and the external market data (Search).
       - **Risk Analysis**: What are the red flags?
  
  **Grounding Rule**: Always use Google Search to verify company stability and growth prospects before giving a final recommendation.`,

  zh: `你是 "Choiceless" (无选之选)，一位精英级 AI 职业策略师。你的目标是帮助用户在众多工作机会中做出绝对最佳的职业决策。

  风格：
  - 专业、简练，但富有同理心。
  - 使用 Markdown 格式（加粗、列表、标题）。
  - **视觉化与结构化**：在比较时使用表格或列表。
  
  强制流程 (严格顺序)：
  
  1. **第一步：用户画像与简历 (必须首先进行)**
     - 如果你还没有用户的简历或背景信息，你**必须**先索要。
     - 暂时不要接收 Offer 信息。如果用户试图先发送 Offer，请礼貌地要求先提供简历/背景，以便你量身定制建议。
     - 收到后，简要确认其核心优势/目标（1-2句话）。
  
  2. **第二步：Offer 收集 (逐个进行)**
     - 确立用户画像后，请用户**逐个**上传他们的工作 Offer。
     - 不要一次性询问所有 Offer。
     - 对于每个 Offer，确认收到，简要总结职位/公司，然后询问是否有**下一个** Offer，或者是否已完成。
  
  3. **第三步：分析与决策**
     - 当用户表示 Offer 已全部上传（例如：“没了”、“完成”、“分析吧”）。
     - **行动**：使用 Google Search 搜索 Offer 中涉及的具体公司的最新新闻、财务健康状况、市场前景和员工评价。
     - **输出结构 (最终步骤)**：
       - **最终裁决 (The Verdict)**：明确指出哪个 Offer 是“赢家”。
       - **排名表**：Offer 的对比表格。
       - **推理依据**：基于用户的具体画像（来自第一步）和外部市场数据（搜索结果）解释理由。
       - **风险分析**：有哪些潜在的红灯警示？
  
  **搜索原则**：在给出最终建议之前，必须始终使用 Google Search 验证公司的稳定性和增长前景。`
};

/**
 * Generates a response based on the current conversation context and gathered data.
 * This function is designed to handle the specific flow of Choiceless.
 */
export const generateAssistantResponse = async (
  history: { role: 'user' | 'model', parts: { text?: string, inlineData?: { mimeType: string, data: string } }[] }[],
  currentInput: string,
  attachments: Attachment[] = [],
  language: 'en' | 'zh' = 'en'
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  
  // Prepare content parts
  const parts: any[] = [];
  
  // Add text input
  if (currentInput) {
    parts.push({ text: currentInput });
  }

  // Add attachments (images)
  attachments.forEach(att => {
    if (att.type === 'image') {
      // Strip base64 header if present
      const base64Data = att.content.split(',')[1] || att.content;
      parts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: base64Data
        }
      });
    } else {
      parts.push({ text: `[Attached File Content: ${att.name}]\n${att.content}` });
    }
  });

  // Select the appropriate system instruction based on language
  const systemInstruction = SYSTEM_INSTRUCTIONS[language];

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        ...history, // Previous context
        { role: 'user', parts }
      ],
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }], // Enable search for grounding
      }
    });

    const candidate = response.candidates?.[0];
    const text = candidate?.content?.parts?.map(p => p.text).join('') || (language === 'zh' ? "无法生成回复，请重试。" : "I couldn't generate a response. Please try again.");
    
    // Extract grounding metadata if available
    const groundingMetadata = candidate?.groundingMetadata;

    return { text, groundingMetadata };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: language === 'zh' ? "连接 AI 服务时出错。请检查您的网络或 API 密钥。" : "I encountered an error connecting to the AI service. Please check your connection or API key." };
  }
};
