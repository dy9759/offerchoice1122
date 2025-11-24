import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Background from './components/Background';
import MessageBubble from './components/MessageBubble';
import InputArea from './components/InputArea';
import ModeSelector from './components/ModeSelector';
import { Message, Sender, Attachment, AppStep, OfferData, UserProfile, AnalysisMode } from './types';
import { generateAssistantResponse } from './services/geminiService';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Sparkles, Briefcase, User, BarChart3, Globe, ChevronDown } from 'lucide-react';

const TRANSLATIONS = {
  en: {
    title: "JobChoice",
    subtitle: "AI Career Agent",
    stepResume: "Resume",
    stepOffers: "Offers",
    stepMode: "Mode",
    stepAnalysis: "Analysis",
    placeholderResume: "Paste your resume text or upload PDF/Image...",
    placeholderOffers: "Paste offer details (Salary, Role, Company) or upload offer letter...",
    placeholderAnalysis: "Ask questions about the ranking or specific companies...",
    placeholderDefault: "Type a message...",
    disclaimer: "JobChoice can make mistakes. Please verify important career information.",
    welcomeMessage: "**Welcome to JobChoice.** \n\nI am your AI Career Strategist. To help you choose the best offer, I first need to understand your background.\n\n**Please upload your Resume/CV** or briefly describe your experience and what you are looking for in your next role.",
    modePrompt: "I have received your information. Please choose how you would like me to analyze these opportunities:"
  },
  zh: {
    title: "JobChoice",
    subtitle: "AI 职业助手",
    stepResume: "简历",
    stepOffers: "Offer",
    stepMode: "模式",
    stepAnalysis: "分析",
    placeholderResume: "粘贴简历文本或上传 PDF/图片...",
    placeholderOffers: "粘贴 Offer 详情（薪资、职位、公司）或上传 Offer 录用信...",
    placeholderAnalysis: "询问关于排名或特定公司的问题...",
    placeholderDefault: "输入消息...",
    disclaimer: "JobChoice 可能会犯错。请核实重要的职业信息。",
    welcomeMessage: "**欢迎使用 JobChoice。** \n\n我是您的 AI 职业策略顾问。为了帮您做出最佳选择，我首先需要了解您的背景。\n\n**请上传您的简历/CV**，或者简要描述您的工作经验以及您对下一份工作的期望。",
    modePrompt: "我已经收到了您的信息。请选择您希望我以何种方式为您分析这些机会："
  },
  ja: {
    title: "JobChoice",
    subtitle: "AI キャリアエージェント",
    stepResume: "履歴書",
    stepOffers: "オファー",
    stepMode: "モード",
    stepAnalysis: "分析",
    placeholderResume: "履歴書のテキストを貼り付けるか、PDF/画像をアップロード...",
    placeholderOffers: "オファーの詳細（給与、役割、会社）を貼り付けるか、オファーレターをアップロード...",
    placeholderAnalysis: "ランキングや特定の企業について質問する...",
    placeholderDefault: "メッセージを入力...",
    disclaimer: "JobChoiceは間違いを犯す可能性があります。重要なキャリア情報は確認してください。",
    welcomeMessage: "**JobChoiceへようこそ。** \n\n私はあなたのAIキャリア戦略家です。最適なオファーを選ぶお手伝いをするために、まずあなたの経歴を理解する必要があります。\n\n**履歴書/職務経歴書をアップロード**するか、経験と次の役割に求めていることを簡単に説明してください。",
    modePrompt: "情報を受け取りました。これらの機会をどのように分析しますか？"
  },
  es: {
    title: "JobChoice",
    subtitle: "Agente de Carrera IA",
    stepResume: "Currículum",
    stepOffers: "Ofertas",
    stepMode: "Modo",
    stepAnalysis: "Análisis",
    placeholderResume: "Pega el texto de tu CV o sube un PDF/Imagen...",
    placeholderOffers: "Pega detalles de la oferta (Salario, Rol, Empresa) o sube la carta...",
    placeholderAnalysis: "Haz preguntas sobre el ranking o empresas específicas...",
    placeholderDefault: "Escribe un mensaje...",
    disclaimer: "JobChoice puede cometer errores. Por favor verifica la información importante.",
    welcomeMessage: "**Bienvenido a JobChoice.** \n\nSoy tu Estratega de Carrera IA. Para ayudarte a elegir la mejor oferta, primero necesito entender tu experiencia.\n\n**Por favor sube tu CV/Hoja de Vida** o describe brevemente tu experiencia y qué buscas en tu próximo rol.",
    modePrompt: "He recibido tu información. Por favor elige cómo te gustaría que analice estas oportunidades:"
  }
};

type Language = 'en' | 'zh' | 'ja' | 'es';

function MainApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<AppStep>(AppStep.WELCOME);
  const [language, setLanguage] = useState<Language>('en');
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('standard');
  
  // Data Storage
  const [offers, setOffers] = useState<OfferData[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({ description: '', files: [] });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  const t = TRANSLATIONS[language];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial Greeting
  useEffect(() => {
    if (!initialized.current) {
      addMessage(Sender.AI, TRANSLATIONS.en.welcomeMessage);
      setStep(AppStep.PROFILE_COLLECTION);
      initialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Language Change Handler
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as Language;
    setLanguage(newLang);

    setMessages(prevMessages => {
      if (prevMessages.length > 0 && prevMessages[0].sender === Sender.AI) {
        const newMessages = [...prevMessages];
        newMessages[0] = {
          ...newMessages[0],
          text: TRANSLATIONS[newLang].welcomeMessage
        };
        return newMessages;
      }
      return prevMessages;
    });
  };

  const addMessage = (sender: Sender, text: string, attachments?: Attachment[], groundingMetadata?: any) => {
    setMessages(prev => [...prev, {
      id: uuidv4(),
      sender,
      text,
      attachments,
      groundingMetadata
    }]);
  };

  const handleUserSend = async (text: string, attachments: Attachment[]) => {
    // 1. Add User Message
    addMessage(Sender.USER, text, attachments);
    setIsLoading(true);

    let currentStep = step;

    // 2. Update Internal State based on Step
    if (step === AppStep.PROFILE_COLLECTION) {
        setUserProfile(prev => ({
            description: prev.description + "\n" + text,
            files: [...prev.files, ...attachments]
        }));

        if (attachments.length > 0 || text.length > 20) {
           currentStep = AppStep.OFFER_COLLECTION;
           setStep(AppStep.OFFER_COLLECTION);
        }
    } else if (step === AppStep.OFFER_COLLECTION) {
        const lowerText = text.toLowerCase();
        const doneKeywords = ["done", "finish", "analyze", "no more", "完成", "结束", "分析", "没了", "完了", "おしまい", "terminado", "listo"];
        
        if (doneKeywords.some(k => lowerText.includes(k))) {
            // Trigger Mode Selection instead of immediate API call for analysis
            setStep(AppStep.MODE_SELECTION);
            addMessage(Sender.AI, t.modePrompt);
            setIsLoading(false);
            return; // Stop here, wait for mode selection
        } else {
            const newOffer: OfferData = {
                id: uuidv4(),
                description: text,
                files: attachments
            };
            setOffers(prev => [...prev, newOffer]);
        }
    }

    // 3. Prepare History & Call Gemini
    // Note: If we just entered MODE_SELECTION, we returned early above.
    // This block runs for Profile, Offer (adding), and Analysis steps.
    
    const historyForApi = messages.map(m => ({
        role: m.sender === Sender.AI ? 'model' as const : 'user' as const,
        parts: m.attachments && m.attachments.length > 0 
          ? [
              { text: m.text }, 
              ...m.attachments.map(att => ({ 
                 inlineData: att.type === 'image' 
                   ? { mimeType: att.mimeType, data: att.content.split(',')[1] } 
                   : undefined,
                 text: att.type !== 'image' ? att.content : undefined 
              })).filter(p => p.inlineData || p.text)
            ]
          : [{ text: m.text }]
    }));

    try {
        const response = await generateAssistantResponse(historyForApi, text, attachments, language, analysisMode);
        addMessage(Sender.AI, response.text, [], response.groundingMetadata);
    } catch (error) {
        let errorMsg = "I'm having trouble processing that. Please try again.";
        if (language === 'zh') errorMsg = "处理您的请求时遇到问题。请重试。";
        if (language === 'ja') errorMsg = "リクエストの処理中に問題が発生しました。もう一度お試しください。";
        if (language === 'es') errorMsg = "Tengo problemas para procesar eso. Por favor inténtalo de nuevo.";
        addMessage(Sender.AI, errorMsg);
    } finally {
        setIsLoading(false);
    }
  };

  // Handle Mode Selection
  const handleModeSelect = async (mode: AnalysisMode) => {
    setAnalysisMode(mode);
    setStep(AppStep.ANALYSIS);
    setIsLoading(true);

    // We send a hidden "system-like" user prompt to trigger the AI's analysis in the chosen mode
    // This isn't shown in the UI as a bubble, but is sent to the API context
    let promptText = "";
    if (language === 'zh') {
        promptText = `[系统] 用户选择了模式：${mode}。请开始分析。如果该模式需要额外信息（如生日），请立刻询问。`;
    } else if (language === 'ja') {
        promptText = `[システム] ユーザーがモードを選択しました：${mode}。分析を開始してください。このモードに追加情報（誕生日など）が必要な場合は、すぐに尋ねてください。`;
    } else if (language === 'es') {
        promptText = `[Sistema] El usuario seleccionó el modo: ${mode}. Por favor procede con el análisis. Si se necesitan datos de nacimiento, pídelos inmediatamente.`;
    } else {
        promptText = `[System] User selected mode: ${mode}. Please proceed with analysis. If birth data is needed, ask for it immediately.`;
    }

    const historyForApi = messages.map(m => ({
        role: m.sender === Sender.AI ? 'model' as const : 'user' as const,
        parts: [{ text: m.text }] // Simplified for history reconstruction
    }));

    try {
        const response = await generateAssistantResponse(historyForApi, promptText, [], language, mode);
        addMessage(Sender.AI, response.text, [], response.groundingMetadata);
    } catch (error) {
        let errorMsg = "Failed to start analysis mode.";
        if (language === 'zh') errorMsg = "启动分析模式失败。";
        if (language === 'ja') errorMsg = "分析モードの開始に失敗しました。";
        if (language === 'es') errorMsg = "Error al iniciar el modo de análisis.";
        addMessage(Sender.AI, errorMsg);
    } finally {
        setIsLoading(false);
    }
  };

  const StepIndicator = ({ active, label, count, icon: Icon }: any) => (
    <div className={`flex items-center gap-2 transition-colors duration-300 ${active ? 'text-indigo-400 font-medium' : 'text-gray-500'}`}>
        <Icon size={16} />
        <span className="hidden sm:inline">{label}</span>
        {count !== undefined && <span className="text-xs bg-white/10 px-1.5 rounded-full">{count}</span>}
    </div>
  );

  const getPlaceholder = () => {
    switch(step) {
      case AppStep.PROFILE_COLLECTION: return t.placeholderResume;
      case AppStep.OFFER_COLLECTION: return t.placeholderOffers;
      case AppStep.ANALYSIS: return t.placeholderAnalysis;
      default: return t.placeholderDefault;
    }
  };

  return (
    <div className="relative w-full h-screen flex flex-col">
      <Background />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-20 bg-black/20 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <Sparkles className="text-white" size={20} />
          </div>
          <div>
             <h1 className="text-xl font-bold tracking-tight text-white leading-none">{t.title}</h1>
             <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mt-1">{t.subtitle}</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="hidden md:flex items-center gap-6 text-sm">
            <StepIndicator 
                active={step === AppStep.PROFILE_COLLECTION} 
                label={t.stepResume} 
                icon={User} 
            />
            <div className={`h-px w-8 ${step !== AppStep.PROFILE_COLLECTION ? 'bg-indigo-500/50' : 'bg-white/10'}`}></div>
            <StepIndicator 
                active={step === AppStep.OFFER_COLLECTION} 
                label={t.stepOffers} 
                count={offers.length}
                icon={Briefcase} 
            />
            <div className={`h-px w-8 ${step === AppStep.MODE_SELECTION || step === AppStep.ANALYSIS ? 'bg-indigo-500/50' : 'bg-white/10'}`}></div>
            <StepIndicator 
                active={step === AppStep.ANALYSIS || step === AppStep.MODE_SELECTION} 
                label={t.stepAnalysis} 
                icon={BarChart3} 
            />
        </div>

        {/* Language Switcher Dropdown */}
        <div className="relative group">
            <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            <select
              value={language}
              onChange={handleLanguageChange}
              className="appearance-none pl-9 pr-8 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer w-full md:w-auto"
            >
              <option value="en" className="bg-zinc-900 text-gray-300">English</option>
              <option value="zh" className="bg-zinc-900 text-gray-300">中文</option>
              <option value="ja" className="bg-zinc-900 text-gray-300">日本語</option>
              <option value="es" className="bg-zinc-900 text-gray-300">Español</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover:text-gray-300 transition-colors" size={12} />
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 pt-24 pb-36 overflow-y-auto z-10 px-4 md:px-0 w-full max-w-4xl mx-auto scrollbar-hide">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && (
           <MessageBubble message={{ id: 'loading', sender: Sender.AI, text: '', isThinking: true }} />
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Mode Selection Overlay */}
      {step === AppStep.MODE_SELECTION && (
          <ModeSelector onSelect={handleModeSelect} language={language} />
      )}

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 z-20 pb-6 pt-12 px-4 pointer-events-none">
         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-transparent z-0 pointer-events-none" />
         <div className="relative z-10 pointer-events-auto">
            <InputArea 
                onSend={handleUserSend} 
                disabled={isLoading || step === AppStep.MODE_SELECTION} 
                placeholder={getPlaceholder()} 
                disclaimerText={t.disclaimer}
            />
         </div>
      </div>
    </div>
  );
}

export default function App() {
    return (
        <HashRouter>
            <Routes>
                <Route path="/" element={<MainApp />} />
            </Routes>
        </HashRouter>
    );
}