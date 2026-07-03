import { ArrowLeft, ChevronRight } from 'lucide-react';
import { mockWords, mockLibraries } from '../data/mockData';
import { PhysicalImage } from './PhysicalImage';
import type { ViewState } from '../data/types';

interface WordDetailViewProps {
  wordId: string;
  navigate: (view: ViewState) => void;
}

const POS_COLORS: Record<string, { bg: string; text: string }> = {
  'n.': { bg: '#EFF6FF', text: '#1D4ED8' },
  'v.': { bg: '#F0FDF4', text: '#166534' },
  'adj.': { bg: '#FFF7ED', text: '#C2410C' },
  'adv.': { bg: '#FAF5FF', text: '#7E22CE' },
  'v./n.': { bg: '#ECFDF5', text: '#065F46' },
  'adj./adv.': { bg: '#FFF1F2', text: '#9F1239' },
};

function EvolutionArrow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '12px 0 10px' }}>
      <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to right, #E5E7EB, #2563EB)' }} />
      <ChevronRight size={14} color="#2563EB" />
    </div>
  );
}

export function WordDetailView({ wordId, navigate }: WordDetailViewProps) {
  const word = mockWords.find(w => w.id === wordId);

  if (!word) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6B7280' }}>
        <p>单词不存在</p>
        <button onClick={() => navigate({ name: 'home' })} style={{ marginTop: '12px', color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer' }}>
          返回首页
        </button>
      </div>
    );
  }

  const library = mockLibraries.find(l => l.id === word.libraryId);

  return (
    <div style={{ minHeight: '100vh', background: '#F7F9FC' }}>
      {/* Top bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '52px 20px 16px',
          background: 'rgba(247,249,252,0.92)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <button
          onClick={() => navigate({ name: 'home' })}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6B7280',
            padding: '6px 0',
            fontSize: '14px',
          }}
        >
          <ArrowLeft size={18} />
          返回
        </button>
        {library && (
          <span style={{
            fontSize: '11px',
            color: '#2563EB',
            background: '#EFF6FF',
            padding: '4px 12px',
            borderRadius: '20px',
            letterSpacing: '0.3px',
          }}>
            {library.name}
          </span>
        )}
      </div>

      <div style={{ padding: '8px 24px 40px' }}>
        {/* Word heading */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '42px', fontWeight: 800, color: '#111827', margin: '0 0 4px', letterSpacing: '-1px', lineHeight: 1.1 }}>
            {word.word}
          </h1>
          <p style={{ fontSize: '16px', color: '#9CA3AF', margin: 0, letterSpacing: '0.5px' }}>
            {word.phonetic}
          </p>
        </div>

        {/* Physical image - the visual centerpiece */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
            物理意象
          </p>
          <div style={{
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
          }}>
            <PhysicalImage type={word.coreImageType} />
          </div>
        </div>

        {/* Core meaning */}
        <div style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '24px',
          marginBottom: '16px',
          boxShadow: '0 2px 20px rgba(0,0,0,0.05)',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 12px' }}>
            核心义
          </p>
          <p style={{ fontSize: '16px', color: '#111827', lineHeight: 1.7, margin: '0 0 20px', fontWeight: 500 }}>
            {word.coreMeaning}
          </p>
          <div style={{
            padding: '16px 18px',
            background: '#F8FAFC',
            borderRadius: '14px',
            borderLeft: '3px solid #2563EB',
          }}>
            <p style={{ fontSize: '15px', color: '#1D4ED8', margin: '0 0 6px', fontStyle: 'italic', lineHeight: 1.6 }}>
              {word.coreExampleSentence}
            </p>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
              {word.coreExampleTranslation}
            </p>
          </div>
        </div>

        {/* Extended meanings */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 12px' }}>
            引申义演化
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {word.extendedMeanings.map((ext, index) => (
              <div
                key={ext.id}
                style={{
                  background: '#fff',
                  borderRadius: '20px',
                  padding: '20px',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
                }}
              >
                {/* Evolution logic */}
                <div style={{
                  padding: '10px 14px',
                  background: '#F8FAFC',
                  borderRadius: '10px',
                  marginBottom: '14px',
                }}>
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
                    <span style={{ color: '#9CA3AF', marginRight: '6px' }}>{index + 1}.</span>
                    {ext.logicalEvolution}
                  </p>
                </div>

                <EvolutionArrow />

                {/* Meaning */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
                  <p style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0, lineHeight: 1.5, flex: 1 }}>
                    {ext.meaning}
                  </p>
                  <span style={{
                    flexShrink: 0,
                    fontSize: '11px',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontWeight: 500,
                    background: (POS_COLORS[ext.partOfSpeech] || { bg: '#F3F4F6', text: '#6B7280' }).bg,
                    color: (POS_COLORS[ext.partOfSpeech] || { bg: '#F3F4F6', text: '#6B7280' }).text,
                  }}>
                    {ext.partOfSpeech}
                  </span>
                </div>

                {/* Example */}
                <div style={{
                  padding: '14px 16px',
                  background: '#F8FAFC',
                  borderRadius: '12px',
                  borderLeft: '3px solid #10B981',
                }}>
                  <p style={{ fontSize: '14px', color: '#065F46', margin: '0 0 6px', fontStyle: 'italic', lineHeight: 1.6 }}>
                    {ext.exampleSentence}
                  </p>
                  <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
                    {ext.exampleTranslation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Collocations */}
        <div style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 2px 20px rgba(0,0,0,0.05)',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 16px' }}>
            常见搭配
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {word.collocations.map((col, i) => (
              <span
                key={i}
                style={{
                  padding: '8px 14px',
                  background: '#F1F5F9',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: '#374151',
                  fontStyle: 'italic',
                  lineHeight: 1,
                }}
              >
                {col}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
