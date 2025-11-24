import React from 'react';
import { BarChart3, Sparkles, Scroll } from 'lucide-react';
import { AnalysisMode } from '../types';

interface ModeSelectorProps {
  onSelect: (mode: AnalysisMode) => void;
  language: 'en' | 'zh' | 'ja' | 'es';
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelect, language }) => {
  
  const getText = (key: string, mode?: AnalysisMode) => {
    const texts: any = {
      header: {
        en: "Choose Your Analysis Dimension",
        zh: "选择您的决策维度",
        ja: "分析の次元を選択",
        es: "Elige tu Dimensión de Análisis"
      },
      subheader: {
        en: "JobChoice is ready. Select how you want the AI to interpret your future.",
        zh: "JobChoice 准备就绪。请选择您希望 AI 如何为您解读未来。",
        ja: "JobChoiceの準備が整いました。AIにあなたの未来をどのように解釈させたいか選択してください。",
        es: "JobChoice está listo. Selecciona cómo quieres que la IA interprete tu futuro."
      },
      standard: {
        title: {
          en: "Data-Driven Analysis",
          zh: "标准数据分析",
          ja: "データ駆動型分析",
          es: "Análisis Basado en Datos"
        },
        desc: {
          en: "Professional analysis based on market data, growth, and compensation.",
          zh: "基于市场数据、公司前景和薪资对比的专业分析。",
          ja: "市場データ、成長性、報酬に基づいた専門的な分析。",
          es: "Análisis profesional basado en datos de mercado, crecimiento y compensación."
        }
      },
      horoscope: {
        title: {
          en: "Zodiac & Horoscope",
          zh: "星盘运势分析",
          ja: "星座・ホロスコープ",
          es: "Zodiaco y Horóscopo"
        },
        desc: {
          en: "Align your career path with your star sign traits and cosmic energy.",
          zh: "结合星座性格特质与职业运势，寻找宇宙能量最契合的选择。",
          ja: "あなたのキャリアパスを星座の特性や宇宙のエネルギーと一致させます。",
          es: "Alinea tu trayectoria profesional con los rasgos de tu signo y la energía cósmica."
        }
      },
      bazi: {
        title: {
          en: "Bazi Fortune Telling",
          zh: "八字命理推演",
          ja: "四柱推命（八字）",
          es: "Adivinación Bazi"
        },
        desc: {
          en: "Traditional Chinese metaphysics using the Five Elements and destiny pillars.",
          zh: "运用中国传统周易八字，推算五行喜忌与流年事业运。",
          ja: "五行思想と運命の柱（四柱）を使用する伝統的な中国の形而上学。",
          es: "Metafísica china tradicional utilizando los Cinco Elementos y los pilares del destino."
        }
      }
    };

    if (mode) {
        return texts[mode][key][language];
    }
    return texts[key][language];
  };

  const modes = [
    {
      id: 'standard' as AnalysisMode,
      icon: BarChart3,
      color: "from-blue-500 to-indigo-600"
    },
    {
      id: 'horoscope' as AnalysisMode,
      icon: Sparkles,
      color: "from-purple-500 to-pink-600"
    },
    {
      id: 'bazi' as AnalysisMode,
      icon: Scroll,
      color: "from-amber-500 to-orange-600"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="max-w-4xl w-full bg-zinc-900/90 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl transform scale-100">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-2">
          {getText('header')}
        </h2>
        <p className="text-center text-gray-400 mb-8">
          {getText('subheader')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => onSelect(mode.id)}
              className="group relative flex flex-col items-center text-center p-6 rounded-2xl bg-black/40 border border-white/10 hover:border-white/30 transition-all duration-300 hover:-translate-y-1 hover:bg-white/5"
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${mode.color} mb-4 flex items-center justify-center shadow-lg group-hover:shadow-white/10 group-hover:scale-110 transition-transform duration-300`}>
                <mode.icon size={32} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                {getText('title', mode.id)}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {getText('desc', mode.id)}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModeSelector;