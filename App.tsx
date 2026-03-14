import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Send, 
  ChevronRight, 
  Calendar, 
  Tag, 
  ArrowLeft, 
  CheckCircle2, 
  Globe,
  Info,
  ThumbsUp,
  ThumbsDown,
  Minus,
  FileText,
  ChevronDown,
  PlusCircle,
  MinusCircle,
  Target,
  Users,
  Clock,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  UserCheck,
  ClipboardList,
  DoorOpen,
  Bus,
  ShieldCheck,
  Palette,
  HeartHandshake,
  Coffee,
  UserPlus,
  Building2,
  Users2
} from 'lucide-react';
import { Case, Language, TRANSLATIONS } from './types';
import { chatWithAI, generateOpinionDraft } from './services/geminiService';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const IconRenderer = ({ name, className }: { name: string; className?: string }) => {
  const icons: Record<string, any> = {
    UserCheck, ClipboardList, DoorOpen, Bus, FileText, ShieldCheck,
    Palette, HeartHandshake, Coffee, UserPlus, Building2, Users2,
    Target, Users, Clock, CheckCircle2, AlertCircle, Lightbulb
  };
  const Icon = icons[name] || Info;
  return <Icon className={className} />;
};

export default function App() {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [lang, setLang] = useState<Language>('ja');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [opinionDraft, setOpinionDraft] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Vote, 2: Chat, 3: Draft
  const [interactionSubStep, setInteractionSubStep] = useState<'initial' | 'select_points' | 'chat'>('initial');
  const [currentVote, setCurrentVote] = useState<'agree' | 'disagree' | 'neutral' | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<{ pointIndex: number, type: 'merit' | 'demerit', text: string }[]>([]);
  const [selectedPointsForInteraction, setSelectedPointsForInteraction] = useState<number[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[lang as keyof typeof TRANSLATIONS] || TRANSLATIONS.ja;

  useEffect(() => {
    fetch('/api/cases')
      .then(res => res.json())
      .then(setCases);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleVote = (vote: 'agree' | 'disagree' | 'neutral') => {
    setCurrentVote(vote);
    setInteractionSubStep('select_points');
    setSelectedPointsForInteraction([]);
  };

  const handleStartChat = async () => {
    if (!selectedCase || !currentVote) return;

    const selectedPointTexts = selectedPointsForInteraction.map(idx => selectedCase.points[idx].text);
    let initialAiMessage = '';

    if (currentVote === 'agree' || currentVote === 'disagree') {
      const voteText = currentVote === 'agree' ? '賛成' : '反対';
      initialAiMessage = `${voteText}なんだね！教えてくれてありがとう。特に「${selectedPointTexts.join('」「')}」が気になったんだね。具体的にどんなところが良い（または心配）と思ったか、教えてもらえるかな？`;
    } else {
      initialAiMessage = `「${selectedPointTexts.join('」「')}」についてもっと知りたいんだね。了解！ざっくりまとめるとこんな感じだよ。\n\n${selectedPointsForInteraction.map(idx => {
        const p = selectedCase.points[idx];
        return `**${p.text}**:\n- 良い点: ${p.merit}\n- 気になる点: ${p.demerit}`;
      }).join('\n\n')}\n\nこれを聞いてみて、どう思ったかな？`;
    }

    setMessages([{ role: 'ai', text: initialAiMessage }]);
    setInteractionSubStep('chat');
    setStep(2);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedCase) return;

    const userMsg = inputValue;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputValue('');
    setIsTyping(true);

    try {
      const context = `
        案件要約: ${selectedCase.summary}
        論点: ${selectedCase.points.map(p => p.text).join(', ')}
        ユーザーが重視しているポイント:
        ${selectedReasons.map(r => `- ${r.text} (${r.type === 'merit' ? 'メリット' : 'デメリット'})`).join('\n')}
      `;
      const aiResponse = await chatWithAI(userMsg, messages, context);
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse || '申し訳ありません、エラーが発生しました。' }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGenerateDraft = async () => {
    if (!selectedCase) return;
    setIsTyping(true);
    try {
      const conversation = messages.map(m => `${m.role}: ${m.text}`).join('\n');
      const context = `
        重視しているポイント:
        ${selectedReasons.map(r => `- ${r.text} (${r.type === 'merit' ? 'メリット' : 'デメリット'})`).join('\n')}
        
        対話内容:
        ${conversation}
      `;
      const draft = await generateOpinionDraft(context, selectedCase.title);
      setOpinionDraft(draft || null);
      setStep(3);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleReason = (pointIndex: number, type: 'merit' | 'demerit', text: string) => {
    setSelectedReasons(prev => {
      const exists = prev.find(r => r.pointIndex === pointIndex && r.type === type);
      if (exists) {
        return prev.filter(r => !(r.pointIndex === pointIndex && r.type === type));
      }
      return [...prev, { pointIndex, type, text }];
    });
  };

  const isReasonSelected = (pointIndex: number, type: 'merit' | 'demerit') => {
    return selectedReasons.some(r => r.pointIndex === pointIndex && r.type === type);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
              ま
            </div>
            <h1 className="text-xl font-bold tracking-tight text-stone-900">{t.title}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-full">
              {(['ja', 'en', 'easy_ja'] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-full transition-all",
                    lang === l ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
                  )}
                >
                  {l === 'ja' ? '日本語' : l === 'en' ? 'EN' : 'やさしい'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <section className="mb-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-stone-900 mb-4 leading-tight">
              {t.subtitle}
            </h2>
            <p className="text-stone-600 leading-relaxed">
              街づくりのための「パブリックコメント」って、ちょっと難しそうですよね。
              まち声ラボでは、AIが難しい資料をわかりやすく解説して、あなたの「こうなったらいいな」を形にするお手伝いをします。
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cases.map((c) => (
            <motion.div
              key={c.id}
              layoutId={`card-${c.id}`}
              onClick={() => setSelectedCase(c)}
              className="group bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-xl hover:border-emerald-200 transition-all cursor-pointer flex flex-col"
            >
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={c.image_url} 
                  alt={c.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur shadow-sm rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    {c.category}
                  </span>
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-stone-900 mb-3 group-hover:text-emerald-700 transition-colors">
                  {c.simple_title}
                </h3>
                <p className="text-stone-600 text-sm line-clamp-3 mb-6 flex-1">
                  {c.summary}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                  <div className="flex items-center gap-2 text-stone-500 text-xs">
                    <Calendar className="w-4 h-4" />
                    <span>{t.deadline}: {c.deadline}</span>
                  </div>
                  <div className="text-emerald-600 font-bold text-sm flex items-center gap-1">
                    {t.view_details}
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Case Detail Overlay */}
      <AnimatePresence>
        {selectedCase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => {
              if (!isChatOpen) setSelectedCase(null);
            }}
          >
            <motion.div
              layoutId={`card-${selectedCase.id}`}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left: Info */}
                <div className="flex-1 overflow-y-auto p-8 border-r border-stone-100">
                  <button 
                    onClick={() => setSelectedCase(null)}
                    className="mb-6 p-2 hover:bg-stone-100 rounded-full transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6 text-stone-600" />
                  </button>

                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{selectedCase.category}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-stone-900 leading-tight mb-4">
                      {selectedCase.title}
                    </h2>
                  </div>

                  <div className="space-y-8">
                    {/* Visual Overview Infographic (Illustrative Slide) */}
                    {selectedCase.visual_summary && (
                      <section className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm mb-8">
                        <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex items-center justify-between">
                          <h4 className="text-sm font-black text-stone-800 flex items-center gap-2">
                            <Palette className="w-5 h-5 text-emerald-600" />
                            {t.visual_overview}
                          </h4>
                          <span className="text-[10px] font-bold text-stone-400 bg-white px-2 py-1 rounded border border-stone-100">
                            SLIDE 01: OVERVIEW
                          </span>
                        </div>
                        
                        <div className="p-6 bg-[#fdfdfb] relative overflow-hidden min-h-[500px]">
                          {/* Background Decorative Elements */}
                          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl" />
                          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-50 rounded-full -ml-32 -mb-32 opacity-50 blur-3xl" />

                          {/* Main Content Grid */}
                          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                            
                            {/* 1. Problem Section (Left) */}
                            <div className="lg:col-span-3 flex flex-col">
                              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex-1 flex flex-col items-center text-center">
                                <div className="text-[10px] font-black text-red-600 mb-2 uppercase tracking-tighter">
                                  {selectedCase.visual_summary.problem.title}
                                </div>
                                <div className="relative mb-4">
                                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
                                    <Users2 className="w-10 h-10 text-red-400" />
                                  </div>
                                  {/* Illustrative Arrows (Overwhelmed) */}
                                  <div className="absolute -top-2 -left-2 animate-bounce"><ArrowRight className="w-4 h-4 text-red-300 -rotate-135" /></div>
                                  <div className="absolute -top-2 -right-2 animate-bounce delay-75"><ArrowRight className="w-4 h-4 text-red-300 -rotate-45" /></div>
                                  <div className="absolute -bottom-2 -left-2 animate-bounce delay-150"><ArrowRight className="w-4 h-4 text-red-300 rotate-135" /></div>
                                  <div className="absolute -bottom-2 -right-2 animate-bounce delay-200"><ArrowRight className="w-4 h-4 text-red-300 rotate-45" /></div>
                                </div>
                                <ul className="space-y-2 text-left w-full">
                                  {selectedCase.visual_summary.problem.items.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-[11px] text-stone-600 leading-tight">
                                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 flex-shrink-0" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* 2. Solution Shield (Middle) */}
                            <div className="lg:col-span-4 flex flex-col items-center justify-center">
                              <div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center">
                                {/* Shield Shape */}
                                <div className="absolute inset-0 bg-indigo-900 rounded-[20%_20%_50%_50%] border-4 border-indigo-700 shadow-2xl overflow-hidden grid grid-cols-2 grid-rows-2">
                                  {selectedCase.visual_summary.solution.quadrants.map((q, i) => (
                                    <div key={i} className={cn(
                                      "flex items-center justify-center p-3 text-center border-indigo-800/50",
                                      i % 2 === 0 ? "border-r" : "",
                                      i < 2 ? "border-b" : ""
                                    )}>
                                      <div className="text-[10px] font-bold text-white leading-tight">
                                        {q}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                {/* Shield Center Icon */}
                                <div className="absolute z-20 w-12 h-12 bg-white rounded-full border-4 border-indigo-900 flex items-center justify-center shadow-lg">
                                  <ShieldCheck className="w-6 h-6 text-indigo-900" />
                                </div>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-black text-indigo-900 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                                  {selectedCase.visual_summary.solution.title}
                                </div>
                              </div>
                            </div>

                            {/* 3. Roles Section (Right) */}
                            <div className="lg:col-span-5 flex flex-col gap-4">
                              <div className="grid grid-cols-2 gap-4 flex-1">
                                {/* Left Role */}
                                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col">
                                  <div className="flex items-center gap-2 mb-3 border-b border-stone-100 pb-2">
                                    <Building2 className="w-4 h-4 text-emerald-600" />
                                    <span className="text-[11px] font-black text-stone-800">
                                      {selectedCase.visual_summary.roles.left.title}
                                    </span>
                                  </div>
                                  <ul className="space-y-2 flex-1">
                                    {selectedCase.visual_summary.roles.left.items.map((item, i) => (
                                      <li key={i} className="text-[10px] text-stone-500 leading-tight flex items-start gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                {/* Right Role */}
                                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col">
                                  <div className="flex items-center gap-2 mb-3 border-b border-stone-100 pb-2">
                                    <UserCheck className="w-4 h-4 text-orange-600" />
                                    <span className="text-[11px] font-black text-stone-800">
                                      {selectedCase.visual_summary.roles.right.title}
                                    </span>
                                  </div>
                                  <ul className="space-y-2 flex-1">
                                    {selectedCase.visual_summary.roles.right.items.map((item, i) => (
                                      <li key={i} className="text-[10px] text-stone-500 leading-tight flex items-start gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-orange-400 mt-0.5 flex-shrink-0" />
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>

                              {/* 4. Outcome Section (Bottom Right) */}
                              <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 p-4 rounded-2xl shadow-lg border border-indigo-700">
                                <div className="text-[10px] font-black text-indigo-200 mb-3 uppercase tracking-widest flex items-center gap-2">
                                  <Target className="w-4 h-4" />
                                  {selectedCase.visual_summary.outcome.title}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  {selectedCase.visual_summary.outcome.items.map((item, i) => (
                                    <div key={i} className="bg-white/10 backdrop-blur-sm p-2 rounded-lg border border-white/10 text-[10px] text-white leading-tight flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                      {item}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                          </div>

                          {/* Connecting Arrows (SVG) */}
                          <div className="hidden lg:block absolute inset-0 pointer-events-none">
                            <svg className="w-full h-full" viewBox="0 0 800 500" fill="none">
                              {/* Problem to Shield */}
                              <path d="M240 250 L300 250" stroke="#e5e7eb" strokeWidth="4" strokeDasharray="8 8" />
                              <polygon points="300,250 290,245 290,255" fill="#e5e7eb" />
                              
                              {/* Shield to Roles */}
                              <path d="M500 250 L560 250" stroke="#e5e7eb" strokeWidth="4" strokeDasharray="8 8" />
                              <polygon points="560,250 550,245 550,255" fill="#e5e7eb" />
                              
                              {/* Roles to Outcome */}
                              <path d="M680 320 Q680 360 640 360" stroke="#e5e7eb" strokeWidth="4" strokeDasharray="8 8" />
                              <polygon points="640,360 650,355 650,365" fill="#e5e7eb" />
                            </svg>
                          </div>

                          {/* Footer Note */}
                          <div className="mt-8 pt-4 border-t border-stone-100 flex justify-between items-end">
                            <div className="text-[9px] text-stone-400 italic">
                              ※本図解はAIによって生成されたイメージです。詳細は公式資料をご確認ください。
                            </div>
                            <div className="flex gap-1">
                              {[1, 2, 3].map(i => (
                                <div key={i} className={cn("w-1 h-1 rounded-full", i === 1 ? "bg-emerald-600" : "bg-stone-200")} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </section>
                    )}

                    <section>
                      <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        {t.summary}
                      </h4>
                    <div className="bg-stone-50 p-5 rounded-2xl border border-stone-100 text-stone-700 leading-relaxed italic mb-4">
                      {selectedCase.summary}
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {selectedCase.summary_pdf_url && (
                        <a 
                          href={selectedCase.summary_pdf_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors bg-white px-3 py-2 rounded-lg border border-emerald-100 shadow-sm"
                        >
                          <FileText className="w-4 h-4" />
                          {t.view_summary_pdf}
                        </a>
                      )}
                      {selectedCase.full_pdf_url && (
                        <a 
                          href={selectedCase.full_pdf_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-stone-800 transition-colors bg-white px-3 py-2 rounded-lg border border-stone-200 shadow-sm"
                        >
                          <FileText className="w-4 h-4" />
                          {t.view_full_pdf}
                        </a>
                      )}
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">
                      {t.points}
                    </h4>
                    <div className="space-y-3">
                      {selectedCase.points.map((p, i) => (
                        <div key={i} className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                          <details className="group">
                            <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                              <div className="flex items-start gap-3 text-stone-700 pr-4">
                                <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-[10px] font-bold text-emerald-700">{i + 1}</span>
                                </div>
                                <span className="text-sm font-medium">{p.text}</span>
                              </div>
                              <ChevronDown className="w-4 h-4 text-stone-400 group-open:rotate-180 transition-transform" />
                            </summary>
                            <div className="px-4 pb-4 pt-0 border-t border-stone-50 bg-stone-50/50">
                              <div className="grid grid-cols-1 gap-3 mt-3">
                                <div 
                                  onClick={() => toggleReason(i, 'merit', p.merit)}
                                  className={cn(
                                    "p-3 rounded-lg border transition-all cursor-pointer group/item",
                                    isReasonSelected(i, 'merit') 
                                      ? "bg-emerald-100 border-emerald-500 ring-1 ring-emerald-500" 
                                      : "bg-emerald-50 border-emerald-100 hover:border-emerald-300"
                                  )}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                      <PlusCircle className="w-3 h-3" />
                                      期待できること（メリット）
                                    </div>
                                    <div className={cn(
                                      "text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors",
                                      isReasonSelected(i, 'merit') 
                                        ? "bg-emerald-600 text-white" 
                                        : "bg-emerald-200 text-emerald-800 opacity-0 group-hover/item:opacity-100"
                                    )}>
                                      {isReasonSelected(i, 'merit') ? 'えらび中' : 'これ大事！'}
                                    </div>
                                  </div>
                                  <p className="text-xs text-stone-700 leading-relaxed">
                                    {p.merit}
                                  </p>
                                </div>
                                <div 
                                  onClick={() => toggleReason(i, 'demerit', p.demerit)}
                                  className={cn(
                                    "p-3 rounded-lg border transition-all cursor-pointer group/item",
                                    isReasonSelected(i, 'demerit') 
                                      ? "bg-red-100 border-red-500 ring-1 ring-red-500" 
                                      : "bg-red-50 border-red-100 hover:border-red-300"
                                  )}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1">
                                      <MinusCircle className="w-3 h-3" />
                                      気になること（デメリット）
                                    </div>
                                    <div className={cn(
                                      "text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors",
                                      isReasonSelected(i, 'demerit') 
                                        ? "bg-red-600 text-white" 
                                        : "bg-red-200 text-red-800 opacity-0 group-hover/item:opacity-100"
                                    )}>
                                      {isReasonSelected(i, 'demerit') ? 'えらび中' : 'これ大事！'}
                                    </div>
                                  </div>
                                  <p className="text-xs text-stone-700 leading-relaxed">
                                    {p.demerit}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </details>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>

              {/* Right: Interaction */}
              <div className="w-full md:w-[400px] bg-stone-50 flex flex-col">
                <div className="p-6 border-b border-stone-200 bg-white">
                  <h3 className="font-bold text-stone-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-emerald-600" />
                    AIガイドとお話しする
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {step === 1 && interactionSubStep === 'initial' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <p className="text-sm text-stone-600 leading-relaxed">
                        このテーマについて、いまのあなたのお気持ちは？
                      </p>
                      <div className="grid grid-cols-1 gap-3">
                        <button 
                          onClick={() => handleVote('agree')}
                          className="flex items-center gap-3 p-4 bg-white border border-stone-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group"
                        >
                          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                            <ThumbsUp className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-stone-900">{t.agree}</div>
                            <div className="text-xs text-stone-500">いい取り組みだと思う！</div>
                          </div>
                        </button>
                        <button 
                          onClick={() => handleVote('disagree')}
                          className="flex items-center gap-3 p-4 bg-white border border-stone-200 rounded-2xl hover:border-red-500 hover:bg-red-50 transition-all text-left group"
                        >
                          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                            <ThumbsDown className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-stone-900">{t.disagree}</div>
                            <div className="text-xs text-stone-500">ちょっと心配・反対かな</div>
                          </div>
                        </button>
                        <button 
                          onClick={() => handleVote('neutral')}
                          className="flex items-center gap-3 p-4 bg-white border border-stone-200 rounded-2xl hover:border-stone-400 hover:bg-stone-100 transition-all text-left group"
                        >
                          <div className="w-10 h-10 bg-stone-200 rounded-xl flex items-center justify-center text-stone-600 group-hover:scale-110 transition-transform">
                            <Minus className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-stone-900">{t.neutral}</div>
                            <div className="text-xs text-stone-500">まだわからない・もっと知りたい</div>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {step === 1 && interactionSubStep === 'select_points' && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      <button 
                        onClick={() => setInteractionSubStep('initial')}
                        className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700 transition-colors"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        もどる
                      </button>
                      <div>
                        <h4 className="font-bold text-stone-900 mb-2">
                          {currentVote === 'neutral' ? 'どのポイントについてもっと知りたい？' : '特に気になったポイントは？'}
                        </h4>
                        <p className="text-xs text-stone-500 mb-4">（いくつ選んでもOKだよ！）</p>
                      </div>
                      <div className="space-y-2">
                        {selectedCase.points.map((p, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setSelectedPointsForInteraction(prev => 
                                prev.includes(i) ? prev.filter(idx => idx !== i) : [...prev, i]
                              );
                            }}
                            className={cn(
                              "w-full p-4 text-left text-sm rounded-xl border transition-all",
                              selectedPointsForInteraction.includes(i)
                                ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-100"
                                : "bg-white border-stone-200 text-stone-700 hover:border-emerald-300"
                            )}
                          >
                            {p.text}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={handleStartChat}
                        disabled={selectedPointsForInteraction.length === 0}
                        className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        次へすすむ
                      </button>
                    </motion.div>
                  )}

                  {step >= 2 && (
                    <div className="space-y-4">
                      {messages.map((m, i) => (
                        <div key={i} className={cn(
                          "flex flex-col",
                          m.role === 'user' ? "items-end" : "items-start"
                        )}>
                          <div className={cn(
                            "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed",
                            m.role === 'user' 
                              ? "bg-emerald-600 text-white rounded-tr-none" 
                              : "bg-white border border-stone-200 text-stone-800 rounded-tl-none shadow-sm"
                          )}>
                            <div className="markdown-body">
                              <ReactMarkdown>{m.text}</ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex items-center gap-2 text-stone-400 text-xs animate-pulse">
                          <div className="w-2 h-2 bg-stone-300 rounded-full" />
                          <div className="w-2 h-2 bg-stone-300 rounded-full" />
                          <div className="w-2 h-2 bg-stone-300 rounded-full" />
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  )}

                  {step === 3 && opinionDraft && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-4"
                    >
                      <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                        <CheckCircle2 className="w-5 h-5" />
                        意見書の下書きができました！
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-emerald-100 text-xs text-stone-700 max-h-[200px] overflow-y-auto">
                        <div className="markdown-body">
                          <ReactMarkdown>{opinionDraft}</ReactMarkdown>
                        </div>
                      </div>
                      <button 
                        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                        onClick={() => alert('送信しました（シミュレーション）')}
                      >
                        {t.submit_opinion}
                      </button>
                    </motion.div>
                  )}
                </div>

                {step === 2 && (
                  <div className="p-4 bg-white border-t border-stone-200">
                    <div className="flex gap-2 mb-3">
                      <button 
                        onClick={handleGenerateDraft}
                        disabled={messages.length < 3 || isTyping}
                        className="flex-1 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-100 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {t.generate_draft}
                      </button>
                    </div>
                    <div className="relative">
                      <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder={t.chat_placeholder}
                        className="w-full p-4 pr-12 bg-stone-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 resize-none h-24"
                      />
                      <button 
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isTyping}
                        className="absolute bottom-3 right-3 p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-stone-100 border-t border-stone-200 py-12">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="flex justify-center gap-6 mb-8">
            <a href="#" className="text-stone-400 hover:text-stone-600 text-sm">利用規約</a>
            <a href="#" className="text-stone-400 hover:text-stone-600 text-sm">プライバシーポリシー</a>
            <a href="#" className="text-stone-400 hover:text-stone-600 text-sm">お問い合わせ</a>
          </div>
          <p className="text-stone-400 text-xs">
            © 2026 まち声ラボ (Machigoe Lab). 行政資料の著作権は各自治体に帰属します。
          </p>
        </div>
      </footer>
    </div>
  );
}
