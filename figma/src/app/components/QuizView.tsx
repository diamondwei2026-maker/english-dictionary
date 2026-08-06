import { useState } from 'react';
import { ArrowLeft, BookOpen, Check, ChevronDown, RotateCcw, X } from 'lucide-react';
import { motion } from 'motion/react';
import { generateQuiz, judgeAnswer } from '../data/quizEngine';
import type { QuizDirection, QuizItem, QuizResult, ViewState } from '../data/types';

interface Props {
  direction: QuizDirection;
  wordId?: string;
  navigate: (view: ViewState) => void;
}

type GlossaryItem = { word: string; meaning: string };
type SentenceGlossary = { verbs: GlossaryItem[]; nouns: GlossaryItem[] };

const sentenceGlossary: Record<string, SentenceGlossary> = {
  q1: { verbs: [], nouns: [{ word: 'cash flow', meaning: '现金流；资金持续进出企业的流动' }, { word: 'lifeblood', meaning: '生命线；维持事物运转的关键资源' }, { word: 'business', meaning: '企业；商业活动' }] },
  q2: { verbs: [{ word: 'flow', meaning: '流动；顺畅地移动' }], nouns: [{ word: 'traffic', meaning: '交通流量；车流' }, { word: 'highway', meaning: '高速公路' }] },
  q3: { verbs: [{ word: 'paint', meaning: '绘画' }], nouns: [{ word: 'state', meaning: '状态' }, { word: 'flow', meaning: '心流；高度投入且顺畅的状态' }] },
  q4: { verbs: [{ word: 'submit', meaning: '正式提交；递交给审核方' }], nouns: [{ word: 'report', meaning: '报告' }, { word: 'deadline', meaning: '截止日期' }] },
  q5: { verbs: [{ word: 'submit', meaning: '正式提交；递交' }], nouns: [{ word: 'application', meaning: '申请；申请材料' }, { word: 'system', meaning: '系统' }] },
  q6: { verbs: [{ word: 'refuse', meaning: '拒绝' }, { word: 'submit to', meaning: '屈从于；服从' }], nouns: [{ word: 'decision', meaning: '决定' }] },
  q7: { verbs: [{ word: 'have', meaning: '产生；带来（影响）' }], nouns: [{ word: 'plan', meaning: '方案；计划' }, { word: 'impact', meaning: '重大影响；强烈作用' }, { word: 'environment', meaning: '环境' }] },
  q8: { verbs: [{ word: 'make', meaning: '造成；带来' }], nouns: [{ word: 'speech', meaning: '演讲' }, { word: 'impact', meaning: '影响；冲击' }, { word: 'audience', meaning: '观众' }] },
  q9: { verbs: [{ word: 'impact', meaning: '影响；对……产生作用' }], nouns: [{ word: 'policy', meaning: '政策' }, { word: 'business', meaning: '企业' }] },
  q10: { verbs: [{ word: 'need', meaning: '需要' }], nouns: [{ word: 'framework', meaning: '框架；支撑结构' }, { word: 'project', meaning: '项目' }] },
  q11: { verbs: [{ word: 'help', meaning: '帮助；促使' }, { word: 'make', meaning: '做出（决定）' }], nouns: [{ word: 'framework', meaning: '框架' }, { word: 'team', meaning: '团队' }, { word: 'decision', meaning: '决定' }] },
  q12: { verbs: [{ word: 'build', meaning: '搭建；建立' }, { word: 'add', meaning: '补充；添加' }], nouns: [{ word: 'framework', meaning: '框架' }, { word: 'detail', meaning: '细节' }] },
  q13: { verbs: [{ word: 'provide', meaning: '提供' }], nouns: [{ word: 'study', meaning: '研究' }, { word: 'evidence', meaning: '证据；可检验的依据' }] },
  q14: { verbs: [{ word: 'work', meaning: '起作用；有效' }], nouns: [{ word: 'evidence', meaning: '证据' }, { word: 'method', meaning: '方法' }] },
  q15: { verbs: [{ word: 'assess', meaning: '评估；衡量后作出判断' }], nouns: [{ word: 'risk', meaning: '风险' }, { word: 'decision', meaning: '决定' }] },
  q16: { verbs: [{ word: 'assess', meaning: '评估；系统判断' }], nouns: [{ word: 'manager', meaning: '经理' }, { word: 'team', meaning: '团队' }, { word: 'performance', meaning: '表现；绩效' }] },
  q17: { verbs: [{ word: 'manage', meaning: '管理' }], nouns: [{ word: 'account', meaning: '账户' }, { word: 'people', meaning: '人们' }] },
  q18: { verbs: [{ word: 'issue', meaning: '发布；正式发出' }], nouns: [{ word: 'statement', meaning: '声明' }] },
  q19: { verbs: [{ word: 'build', meaning: '建立；逐步搭建' }], nouns: [{ word: 'confidence', meaning: '自信' }, { word: 'practice', meaning: '练习' }] },
  q20: { verbs: [{ word: 'build', meaning: '建立；逐步构建' }], nouns: [{ word: 'company', meaning: '公司' }, { word: 'relationship', meaning: '关系' }, { word: 'client', meaning: '客户' }] },
};

export function QuizView({ direction, wordId, navigate }: Props) {
  const [items, setItems] = useState<QuizItem[]>(() => generateQuiz(direction, wordId));
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<QuizResult | null>(null);
  const [answers, setAnswers] = useState<QuizResult[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const done = answers.length === items.length;
  const item = items[index];
  const baseQuestionId = item?.id.replace(/-\d+$/, '');
  const glossary = baseQuestionId ? sentenceGlossary[baseQuestionId] : undefined;
  const canSubmit = Boolean(result || input.trim());

  const reset = () => {
    setItems(generateQuiz(direction, wordId));
    setIndex(0);
    setInput('');
    setResult(null);
    setAnswers([]);
    setShowReview(false);
    setShowHint(false);
  };

  const back = () => navigate(wordId ? { name: 'wordDetail', wordId } : { name: 'training' });

  const submit = () => {
    if (!result && !input.trim()) return;

    if (!result) {
      setResult(judgeAnswer(item, input, direction));
      return;
    }

    setAnswers((currentAnswers) => [...currentAnswers, result]);
    setIndex((currentIndex) => currentIndex + 1);
    setInput('');
    setResult(null);
    setShowHint(false);
  };

  if (done) {
    const correct = answers.filter((answer) => answer.correct).length;

    return (
      <main style={{ minHeight: '100vh', padding: '52px 24px 170px', background: '#F7F9FC' }}>
        <button onClick={back} style={backStyle}><ArrowLeft size={18} /> 返回</button>
        <section style={{ marginTop: 28, background: '#fff', borderRadius: 24, padding: '30px 24px', boxShadow: '0 8px 28px rgba(25,49,80,.06)', textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#2563EB', fontSize: 12, fontWeight: 700, letterSpacing: 1.5 }}>本轮完成</p>
          <div style={{ fontSize: 48, fontWeight: 760, color: '#111827', margin: '14px 0 4px', letterSpacing: '-1px' }}>{correct}<span style={{ fontSize: 20, color: '#9CA3AF', fontWeight: 500 }}> / {items.length}</span></div>
          <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>正确率 {Math.round(correct / items.length * 100)}%</p>
        </section>
        <button onClick={() => setShowReview(!showReview)} style={{ ...plainButton, width: '100%', marginTop: 16, justifyContent: 'space-between', background: '#fff', borderRadius: 18, padding: '17px 18px', boxShadow: '0 3px 14px rgba(25,49,80,.04)' }}>
          逐题回顾 <ChevronDown size={18} style={{ transform: showReview ? 'rotate(180deg)' : 'none' }} />
        </button>
        {showReview && <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>{answers.map((answer, answerIndex) => <div key={answerIndex} style={{ padding: '14px 16px', borderRadius: 14, background: answer.correct ? '#F0FDF4' : '#FFF1F2', color: answer.correct ? '#166534' : '#9F1239', fontSize: 13, display: 'flex', gap: 10, alignItems: 'center' }}>{answer.correct ? <Check size={16} /> : <X size={16} />}第 {answerIndex + 1} 题 · {answer.score} 分</div>)}</div>}
        <div style={actionBar}><button onClick={reset} style={primaryButton}><RotateCcw size={18} />再来一组</button></div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: '48px 24px 170px', background: '#F7F9FC' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={back} style={backStyle}><ArrowLeft size={18} /> 返回</button>
        <span style={{ fontSize: 13, color: '#6B7280' }}>{index + 1} / {items.length}</span>
      </div>
      <div style={{ height: 4, background: '#E8EDF4', borderRadius: 9, margin: '18px 0 28px', overflow: 'hidden' }}><div style={{ height: '100%', width: `${((index + 1) / items.length) * 100}%`, background: '#2563EB', borderRadius: 9, transition: 'width .3s' }} /></div>
      <section style={{ background: '#fff', borderRadius: 24, padding: 24, boxShadow: '0 8px 28px rgba(25,49,80,.06)' }}>
        <p style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: 1.4 }}>翻译成英语</p>
        <h1 style={{ margin: '0 0 22px', fontSize: 23, lineHeight: 1.55, color: '#111827', fontWeight: 700 }}>{item.prompt}</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 9, background: '#F1F5F9', color: '#64748B', fontSize: 12 }}>{item.hint}</span>
          <button onClick={() => setShowHint((visible) => !visible)} aria-expanded={showHint} style={hintButton}><BookOpen size={15} />{showHint ? '收起提示' : '查看提示'}</button>
        </div>
        {showHint && glossary && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ overflow: 'hidden' }}><div style={glossaryPanel}>
          <p style={glossaryTitle}>句中词汇提示</p>
          {glossary.verbs.length > 0 && <GlossaryGroup label="动词" items={glossary.verbs} />}
          {glossary.nouns.length > 0 && <GlossaryGroup label="名词" items={glossary.nouns} />}
        </div></motion.div>}
      </section>
      <textarea disabled={!!result} value={input} onChange={(event) => setInput(event.target.value)} placeholder="输入你的英文表达…" style={{ width: '100%', boxSizing: 'border-box', minHeight: 130, resize: 'vertical', marginTop: 16, border: `1.5px solid ${result ? '#E5E7EB' : '#DCE3EC'}`, borderRadius: 16, padding: 16, background: result ? '#F8FAFC' : '#fff', fontFamily: 'inherit', fontSize: 16, lineHeight: 1.65, color: '#111827', outline: 'none' }} />
      {result && <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 16, borderRadius: 18, padding: 18, background: result.correct ? '#F0FDF4' : '#FFF1F2', color: result.correct ? '#166534' : '#9F1239' }}><div style={{ display: 'flex', gap: 9, alignItems: 'center', fontSize: 15, fontWeight: 700 }}>{result.correct ? <Check size={18} /> : <X size={18} />} {result.correct ? '表达正确' : '再调整一下'}</div><p style={{ margin: '11px 0 0', fontSize: 13, lineHeight: 1.7 }}>{result.analysis}</p></motion.section>}
      <div style={actionBar}><button onClick={submit} disabled={!canSubmit} style={{ ...primaryButton, ...(canSubmit ? {} : disabledButton) }}>{result ? (index === items.length - 1 ? '查看结果' : '下一题') : '提交'}</button></div>
    </main>
  );
}

function GlossaryGroup({ label, items }: { label: string; items: GlossaryItem[] }) {
  return <div style={{ marginTop: 12 }}><p style={glossaryLabel}>{label}</p><div style={{ display: 'grid', gap: 7 }}>{items.map((item) => <div key={item.word} style={glossaryItem}><strong style={{ fontWeight: 650, color: '#334155' }}>{item.word}</strong><span style={{ color: '#64748B' }}>{item.meaning}</span></div>)}</div></div>;
}

const backStyle = { display: 'inline-flex', alignItems: 'center', gap: 6, border: 0, background: 'transparent', color: '#6B7280', cursor: 'pointer', padding: 0, fontSize: 14 };
const primaryButton = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 52, border: 0, borderRadius: 16, background: '#2563EB', color: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 650, boxShadow: '0 8px 18px rgba(37,99,235,.2)' };
const disabledButton = { background: '#CBD5E1', boxShadow: 'none', cursor: 'not-allowed' };
const plainButton = { display: 'inline-flex', alignItems: 'center', gap: 8, border: 0, background: 'transparent', color: '#475569', cursor: 'pointer', padding: 8, fontSize: 14 };
const hintButton = { display: 'inline-flex', flexShrink: 0, alignItems: 'center', gap: 5, border: 0, background: 'transparent', color: '#2563EB', cursor: 'pointer', padding: '5px 0', fontSize: 12, fontWeight: 650 };
const glossaryPanel = { marginTop: 16, padding: '14px 15px', background: '#F8FAFC', border: '1px solid #E8EDF4', borderRadius: 14 };
const glossaryTitle = { margin: 0, color: '#475569', fontSize: 12, fontWeight: 700, letterSpacing: '.5px' };
const glossaryLabel = { margin: '0 0 6px', color: '#94A3B8', fontSize: 11, fontWeight: 700, letterSpacing: '.8px' };
const glossaryItem = { display: 'grid', gridTemplateColumns: 'minmax(80px, auto) 1fr', columnGap: 12, alignItems: 'baseline', fontSize: 13, lineHeight: 1.5 };
const actionBar = { position: 'fixed' as const, bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, boxSizing: 'border-box' as const, padding: '12px 24px 14px', background: 'rgba(247,249,252,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid rgba(0,0,0,0.05)', zIndex: 99 };
