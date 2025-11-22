import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Background from './components/Background';
import MessageBubble from './components/MessageBubble';
import InputArea from './components/InputArea';
import { Message, Sender, Attachment, AppStep, OfferData, UserProfile } from './types';
import { generateAssistantResponse } from './services/geminiService';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Sparkles, Briefcase, User, BarChart3, Globe } from 'lucide-react';

const TRANSLATIONS = {
  en: {
    title: "Choiceless",
    subtitle: "AI Career Agent",
    stepResume: "Resume",
    stepOffers: "Offers",
    stepAnalysis: "Analysis",
    placeholderResume: "Paste your resume text or upload PDF/Image...",
    placeholderOffers: "Paste offer details (Salary, Role, Company) or upload offer letter...",
    placeholderAnalysis: "Ask questions about the ranking or specific companies...",
    placeholderDefault: "Type a message...",
    disclaimer: "Choiceless can make mistakes. Please verify important career information.",
    welcomeMessage: "**Welcome to Choiceless.** \n\nI am your AI Career Strategist. To help you choose the best offer, I first need to understand your background.\n\n**Please upload your Resume/CV** or briefly describe your experience and what you are looking for in your next role."
  },
  zh: {
    title: "Choiceless",
    subtitle: "AI 职业助手",
    stepResume: "简历",
    stepOffers: "Offer",
    stepAnalysis: "分析",
    placeholderResume: "粘贴简历文本或上传 PDF/图片...",
    placeholderOffers: "粘贴 Offer 详情（薪资、职位、公司）或上传 Offer 录用信...",
    placeholderAnalysis: "询问关于排名或特定公司的问题...",
    placeholderDefault: "输入消息...",
    disclaimer: "Choiceless 可能会犯错。请核实重要的职业信息。",
    welcomeMessage: "**欢迎使用 Choiceless。** \n\n我是您的 AI 职业策略顾问。为了帮您做出最佳选择，我首先需要了解您的背景。\n\n**请上传您的简历/CV**，或者简要描述您的工作经验以及您对下一份工作的期望。"
  }
};

function MainApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<AppStep>(AppStep.WELCOME);
  const [language, setLanguage] = useState<'en' | 'zh'>('en');
  
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
    // Only fire once on mount
    if (!initialized.current) {
      addMessage(Sender.AI, TRANSLATIONS.en.welcomeMessage); // Default to EN on load
      setStep(AppStep.PROFILE_COLLECTION);
      initialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle Language
  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'zh' : 'en';
    setLanguage(nextLang);

    // Update the first message (Welcome Message) to reflect the new language
    setMessages(prevMessages => {
      if (prevMessages.length > 0 && prevMessages[0].sender === Sender.AI) {
        const newMessages = [...prevMessages];
        newMessages[0] = {
          ...newMessages[0],
          text: TRANSLATIONS[nextLang].welcomeMessage
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
        // Store Profile Data
        setUserProfile(prev => ({
            description: prev.description + "\n" + text,
            files: [...prev.files, ...attachments]
        }));

        // Transition to Offer Collection only if we have "some" data. 
        // The AI will also enforce this in its response text, but we update UI state here.
        if (attachments.length > 0 || text.length > 20) {
           currentStep = AppStep.OFFER_COLLECTION;
           setStep(AppStep.OFFER_COLLECTION);
        }
    } else if (step === AppStep.OFFER_COLLECTION) {
        // Heuristic: If user says they are done, move to Analysis
        const lowerText = text.toLowerCase();
        // Simple multilingual check for 'done'
        const doneKeywords = ["done", "finish", "analyze", "no more", "完成", "结束", "分析", "没了"];
        if (doneKeywords.some(k => lowerText.includes(k))) {
            currentStep = AppStep.ANALYSIS;
            setStep(AppStep.ANALYSIS);
        } else {
            // Otherwise, treat as a new offer
            const newOffer: OfferData = {
                id: uuidv4(),
                description: text,
                files: attachments
            };
            setOffers(prev => [...prev, newOffer]);
        }
    }

    // 3. Prepare History for Gemini
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

    // 4. Call Gemini
    try {
        // Pass the current language to the service so it uses the correct System Instruction
        const response = await generateAssistantResponse(historyForApi, text, attachments, language);
        addMessage(Sender.AI, response.text, [], response.groundingMetadata);
    } catch (error) {
        addMessage(Sender.AI, language === 'zh' ? "处理您的请求时遇到问题。请重试。" : "I'm having trouble processing that. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  // Helper to render step indicator
  const StepIndicator = ({ active, label, count, icon: Icon }: any) => (
    <div className={`flex items-center gap-2 transition-colors duration-300 ${active ? 'text-indigo-400 font-medium' : 'text-gray-500'}`}>
        <Icon size={16} />
        <span className="hidden sm:inline">{label}</span>
        {count !== undefined && <span className="text-xs bg-white/10 px-1.5 rounded-full">{count}</span>}
    </div>
  );

  // Dynamic Placeholder based on step
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
            
            <div className={`h-px w-8 ${step === AppStep.OFFER_COLLECTION || step === AppStep.ANALYSIS ? 'bg-indigo-500/50' : 'bg-white/10'}`}></div>
            
            <StepIndicator 
                active={step === AppStep.OFFER_COLLECTION} 
                label={t.stepOffers} 
                count={offers.length}
                icon={Briefcase} 
            />
            
            <div className={`h-px w-8 ${step === AppStep.ANALYSIS ? 'bg-indigo-500/50' : 'bg-white/10'}`}></div>
            
            <StepIndicator 
                active={step === AppStep.ANALYSIS} 
                label={t.stepAnalysis} 
                icon={BarChart3} 
            />
        </div>

        {/* Language Switcher */}
        <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 transition-colors focus:outline-none"
        >
            <Globe size={14} />
            <span className="font-medium">{language === 'en' ? 'EN' : '中'}</span>
        </button>
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

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 z-20 pb-6 pt-12 px-4 pointer-events-none">
         {/* Gradient fade for input area */}
         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-transparent z-0 pointer-events-none" />
         <div className="relative z-10 pointer-events-auto">
            <InputArea 
                onSend={handleUserSend} 
                disabled={isLoading} 
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