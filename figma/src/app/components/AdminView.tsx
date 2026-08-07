import { useState } from 'react';
import {
  BookOpen, Type, Users, Plus, Trash2, ArrowLeft,
  RefreshCw, Loader, ChevronRight, Check, X, ArrowRight, Search,
} from 'lucide-react';
import type { AuthUser, ViewState, Word, WordLibrary, ExtendedMeaning } from '../data/types';
import { mockWords as initialWords, mockLibraries as initialLibraries, mockUsers, AI_GENERATED_TEMPLATES } from '../data/mockData';
import { PhysicalImage } from './PhysicalImage';

type AdminSection = 'overview' | 'libraries' | 'words' | 'users';

interface AdminViewProps {
  navigate: (view: ViewState) => void;
  user: AuthUser | null;
}

const IMAGE_TYPES = ['flow', 'grasp', 'break', 'bear', 'drive', 'light', 'leverage', 'yield'];
const POS_OPTIONS = ['n.', 'v.', 'adj.', 'adv.', 'v./n.', 'adj./adv.', 'prep.'];

function genId() { return Math.random().toString(36).slice(2, 10); }

function generateAIContent(word: string): Partial<Word> {
  const t = AI_GENERATED_TEMPLATES[word.toLowerCase()];
  if (t && Object.keys(t).length > 0) return t as Partial<Word>;
  return {
    phonetic: `/${word.slice(0, 2)}/`,
    coreMeaning: `物体在外力作用下产生与"${word}"相关的物理状态或运动`,
    coreImageType: IMAGE_TYPES[Math.floor(Math.random() * IMAGE_TYPES.length)],
    coreExampleSentence: `The ${word} demonstrates its core physical meaning.`,
    coreExampleTranslation: `该例句展示了"${word}"的核心物理义。`,
    extendedMeanings: [{
      id: genId(), logicalEvolution: '物理意义 → 抽象延伸至日常语境',
      meaning: '（引申义一）抽象延伸含义', partOfSpeech: 'v.',
      exampleSentence: `They ${word}ed their way through the challenge.`,
      exampleTranslation: `他们以"${word}"的方式应对了这一挑战。`,
    }],
    collocations: [`${word} up`, `${word} out`, `${word} away`, `well-${word}ed`],
  };
}

// ─── Style tokens — identical to front-end ────────────────────────────────────
const BG = '#F7F9FC';
const CARD: React.CSSProperties = {
  background: '#fff',
  borderRadius: '20px',
  boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
};
const SECTION_LABEL: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, color: '#9CA3AF',
  letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 12px',
};
const INPUT: React.CSSProperties = {
  width: '100%', padding: '13px 14px', borderRadius: '14px',
  border: '1.5px solid transparent', background: '#F1F5F9',
  fontSize: '15px', color: '#111827', outline: 'none',
  boxSizing: 'border-box', lineHeight: 1.5, transition: 'border-color 0.2s, background 0.2s',
};
const LABEL: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: 600,
  color: '#374151', marginBottom: '8px',
};

function onFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  (e.target as HTMLElement).style.borderColor = '#2563EB';
  (e.target as HTMLElement).style.background = '#fff';
}
function onBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  (e.target as HTMLElement).style.borderColor = 'transparent';
  (e.target as HTMLElement).style.background = '#F1F5F9';
}

// ─── Shared components (front-end style) ──────────────────────────────────────

/** Sticky page header — matches WordDetailView top bar */
function PageHeader({
  onBack, backLabel = '返回', right, children,
}: {
  onBack?: () => void;
  backLabel?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 10,
      padding: '52px 24px 16px',
      background: 'rgba(247,249,252,0.94)',
      backdropFilter: 'blur(16px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: children ? '12px' : 0 }}>
        {onBack ? (
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: '14px', padding: '6px 0' }}>
            <ArrowLeft size={18} />
            {backLabel}
          </button>
        ) : <div />}
        {right}
      </div>
      {children}
    </div>
  );
}

/** Section label — same as WordDetailView */
function SLabel({ children }: { children: React.ReactNode }) {
  return <p style={SECTION_LABEL}>{children}</p>;
}

/** Primary action button */
function PrimaryBtn({ children, onClick, disabled, loading, ghost }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  ghost?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: '100%', padding: '15px', borderRadius: '16px', border: 'none',
        background: ghost ? '#fff' : (disabled || loading ? '#93C5FD' : '#2563EB'),
        color: ghost ? '#2563EB' : '#fff',
        fontSize: '15px', fontWeight: 700, cursor: disabled || loading ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        ...(ghost ? { border: '1.5px solid #BFDBFE' } : {}),
      }}
    >
      {loading && <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} />}
      {children}
    </button>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────
function Overview({ libraries, words, onNavigate, onExit }: {
  libraries: WordLibrary[];
  words: Word[];
  onNavigate: (s: AdminSection) => void;
  onExit: () => void;
}) {
  const sections = [
    { id: 'libraries' as AdminSection, label: '词库管理', icon: <BookOpen size={20} />, count: `${libraries.length} 个词库`, color: '#2563EB', bg: '#EFF6FF' },
    { id: 'words' as AdminSection, label: '单词管理', icon: <Type size={20} />, count: `${words.length} 个单词`, color: '#16A34A', bg: '#F0FDF4' },
    { id: 'users' as AdminSection, label: '用户管理', icon: <Users size={20} />, count: `${mockUsers.length} 位用户`, color: '#7C3AED', bg: '#FAF5FF' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: BG }}>
      <PageHeader>
        <p style={{ fontSize: '12px', color: '#9CA3AF', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 4px' }}>
          管理后台
        </p>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: 0 }}>数据概览</h1>
      </PageHeader>

      <div style={{ padding: '16px 24px 40px' }}>
        {/* Stats banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 60%, #3B82F6 100%)',
          borderRadius: '24px', padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 8px 32px rgba(37,99,235,0.22)',
          color: '#fff',
        }}>
          <p style={{ fontSize: '11px', opacity: 0.7, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 16px' }}>
            当前数据
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '4px' }}>
            {[
              { label: '词库', value: libraries.length },
              { label: '单词', value: words.length },
              { label: '用户', value: mockUsers.length },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '30px', fontWeight: 800, margin: '0 0 2px', letterSpacing: '-0.5px' }}>{s.value}</p>
                <p style={{ fontSize: '12px', opacity: 0.7, margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <SLabel>功能入口</SLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => onNavigate(s.id)}
              style={{
                ...CARD, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '18px 20px', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: '0 0 2px' }}>{s.label}</p>
                  <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>{s.count}</p>
                </div>
              </div>
              <ArrowRight size={16} color="#D1D5DB" />
            </button>
          ))}
        </div>

        <button
          onClick={onExit}
          style={{
            width: '100%', padding: '16px', background: '#FEF2F2', color: '#DC2626',
            border: 'none', borderRadius: '16px', fontSize: '15px', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          退出管理
        </button>
      </div>
    </div>
  );
}

// ─── Library Manager ──────────────────────────────────────────────────────────
function LibraryManager({ libraries, words, onAdd, onEdit, onDelete, onAddWordToLib, onRemoveWordFromLib, onBack }: {
  libraries: WordLibrary[];
  words: Word[];
  onAdd: (l: Omit<WordLibrary, 'id' | 'createdAt'>) => void;
  onEdit: (id: string, d: Partial<WordLibrary>) => void;
  onDelete: (id: string) => void;
  onAddWordToLib: (libId: string, wordId: string) => void;
  onRemoveWordFromLib: (libId: string, wordId: string) => void;
  onBack: () => void;
}) {
  const [editTarget, setEditTarget] = useState<WordLibrary | 'new' | null>(null);
  const [managingLibId, setManagingLibId] = useState<string | null>(null);
  const [addingToLibId, setAddingToLibId] = useState<string | null>(null);
  const [wordSearch, setWordSearch] = useState('');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const openNew = () => { setName(''); setDesc(''); setWordSearch(''); setEditTarget('new'); };
  const openEdit = (lib: WordLibrary) => { setName(lib.name); setDesc(lib.description); setWordSearch(''); setEditTarget(lib); };
  const handleSave = () => {
    if (!name.trim()) return;
    if (editTarget === 'new') onAdd({ name, description: desc, wordCount: 0, wordIds: [] });
    else if (editTarget) onEdit(editTarget.id, { name, description: desc });
    setEditTarget(null);
  };

  // ── 全库搜索添加子视图 ────────────────────────────────────────────────────────
  if (addingToLibId !== null) {
    const addingLib = libraries.find(l => l.id === addingToLibId);
    if (!addingLib) { setAddingToLibId(null); return null; }

    const searchTrimmed = wordSearch.trim().toLowerCase();
    const searchResults = searchTrimmed
      ? words.filter(w => w.word.toLowerCase().includes(searchTrimmed) || w.coreMeaning.includes(wordSearch.trim()))
      : [];

    return (
      <div style={{ minHeight: '100vh', background: BG }}>
        <PageHeader onBack={() => { setAddingToLibId(null); setWordSearch(''); }} backLabel={addingLib.name}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>添加单词</h1>
        </PageHeader>

        <div style={{ padding: '8px 24px 40px' }}>
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
            <input
              value={wordSearch}
              onChange={e => setWordSearch(e.target.value)}
              placeholder="搜索单词名称或核心义..."
              style={{ ...INPUT, paddingLeft: '40px' }}
              onFocus={onFocus}
              onBlur={onBlur}
              autoFocus
            />
            {wordSearch && (
              <button
                onClick={() => setWordSearch('')}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '2px', display: 'flex' }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {!searchTrimmed ? (
            <div style={{ textAlign: 'center', padding: '64px 0', color: '#9CA3AF' }}>
              <Search size={28} style={{ marginBottom: '10px', opacity: 0.25 }} />
              <p style={{ fontSize: '14px' }}>输入关键词搜索全库单词</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF' }}>
              <Type size={28} style={{ marginBottom: '10px', opacity: 0.3 }} />
              <p style={{ fontSize: '14px' }}>未找到匹配的单词</p>
            </div>
          ) : (
            <>
              <SLabel>找到 {searchResults.length} 个单词</SLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {searchResults.map(word => {
                  const inLib = addingLib.wordIds.includes(word.id);
                  return (
                    <div key={word.id} style={{ ...CARD, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '2px' }}>
                          <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>{word.word}</span>
                          <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{word.phonetic}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#6B7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {word.coreMeaning}
                        </p>
                      </div>
                      {inLib ? (
                        <span style={{ fontSize: '11px', color: '#059669', background: '#ECFDF5', padding: '4px 10px', borderRadius: '20px', fontWeight: 500, flexShrink: 0 }}>
                          已收录
                        </span>
                      ) : (
                        <button
                          onClick={() => onAddWordToLib(addingLib.id, word.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px', background: '#2563EB', border: 'none', borderRadius: '20px', cursor: 'pointer', color: '#fff', fontSize: '12px', fontWeight: 600, flexShrink: 0 }}
                        >
                          <Plus size={12} />添加
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── 词库详情子视图（已收录单词列表）────────────────────────────────────────────
  if (managingLibId !== null) {
    const managingLib = libraries.find(l => l.id === managingLibId);
    if (!managingLib) { setManagingLibId(null); return null; }

    const libSearchTrimmed = wordSearch.trim().toLowerCase();
    const addedWords = words.filter(w => managingLib.wordIds.includes(w.id));
    const displayedWords = libSearchTrimmed
      ? addedWords.filter(w => w.word.toLowerCase().includes(libSearchTrimmed) || w.coreMeaning.includes(wordSearch.trim()))
      : addedWords;

    return (
      <div style={{ minHeight: '100vh', background: BG }}>
        <PageHeader
          onBack={() => { setManagingLibId(null); setWordSearch(''); }}
          backLabel="词库列表"
          right={
            <button
              onClick={() => { setAddingToLibId(managingLib.id); setWordSearch(''); }}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              <Plus size={14} />添加单词
            </button>
          }
        >
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: '0 0 2px' }}>
            {managingLib.name}
          </h1>
          <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>
            已收录 {managingLib.wordIds.length} 个单词
          </p>
        </PageHeader>

        <div style={{ padding: '8px 24px 40px' }}>
          {addedWords.length > 0 && (
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
              <input
                value={wordSearch}
                onChange={e => setWordSearch(e.target.value)}
                placeholder="搜索已收录单词..."
                style={{ ...INPUT, paddingLeft: '40px' }}
                onFocus={onFocus}
                onBlur={onBlur}
              />
              {wordSearch && (
                <button
                  onClick={() => setWordSearch('')}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '2px', display: 'flex' }}
                >
                  <X size={15} />
                </button>
              )}
            </div>
          )}
          <SLabel>
            {libSearchTrimmed ? `搜索结果 ${displayedWords.length} 个` : `已收录 ${addedWords.length} 个`}
          </SLabel>
          {addedWords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0', color: '#9CA3AF' }}>
              <BookOpen size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p style={{ fontSize: '14px', margin: '0 0 16px' }}>暂无收录单词</p>
              <button
                onClick={() => { setAddingToLibId(managingLib.id); setWordSearch(''); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                <Plus size={14} />添加单词
              </button>
            </div>
          ) : displayedWords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF' }}>
              <Type size={28} style={{ marginBottom: '10px', opacity: 0.3 }} />
              <p style={{ fontSize: '14px' }}>未找到匹配的单词</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {displayedWords.map(word => (
                <div key={word.id} style={{ ...CARD, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>{word.word}</span>
                      <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{word.phonetic}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#6B7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {word.coreMeaning}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemoveWordFromLib(managingLib.id, word.id)}
                    style={{ padding: '5px 12px', background: '#FEF2F2', border: 'none', borderRadius: '20px', cursor: 'pointer', color: '#DC2626', fontSize: '12px', fontWeight: 500, flexShrink: 0 }}
                  >
                    移除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── 词库表单视图 ─────────────────────────────────────────────────────────────
  if (editTarget !== null) {
    const isNew = editTarget === 'new';
    return (
      <div style={{ minHeight: '100vh', background: BG }}>
        <PageHeader onBack={() => setEditTarget(null)} backLabel="词库列表">
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>
            {isNew ? '新增词库' : '编辑词库'}
          </h1>
        </PageHeader>
        <div style={{ padding: '8px 24px 40px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={LABEL}>词库名称</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="输入词库名称" style={INPUT} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div>
            <label style={LABEL}>词库描述</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="简要描述该词库的内容和适用人群..."
              style={{ ...INPUT, minHeight: '88px', resize: 'vertical' as const }}
              onFocus={onFocus} onBlur={onBlur}
            />
          </div>
          <PrimaryBtn onClick={handleSave} disabled={!name.trim()}>保存</PrimaryBtn>
          <PrimaryBtn onClick={() => setEditTarget(null)} ghost>取消</PrimaryBtn>
        </div>
      </div>
    );
  }

  // ── 词库列表主视图 ───────────────────────────────────────────────────────────
  const libSearchTrimmed = wordSearch.trim().toLowerCase();
  const filteredLibraries = libSearchTrimmed
    ? libraries.filter(l => l.name.toLowerCase().includes(libSearchTrimmed) || l.description.toLowerCase().includes(libSearchTrimmed))
    : libraries;

  return (
    <div style={{ minHeight: '100vh', background: BG }}>
      <PageHeader
        onBack={onBack}
        right={
          <button
            onClick={openNew}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={14} />新增
          </button>
        }
      >
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>词库管理</h1>
      </PageHeader>

      <div style={{ padding: '8px 24px 40px' }}>
        {libraries.length > 0 && (
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
            <input
              value={wordSearch}
              onChange={e => setWordSearch(e.target.value)}
              placeholder="搜索词库..."
              style={{ ...INPUT, paddingLeft: '40px' }}
              onFocus={onFocus}
              onBlur={onBlur}
            />
            {wordSearch && (
              <button
                onClick={() => setWordSearch('')}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '2px', display: 'flex' }}
              >
                <X size={15} />
              </button>
            )}
          </div>
        )}
        <SLabel>
          {libSearchTrimmed ? `搜索结果 ${filteredLibraries.length} 个` : `共 ${libraries.length} 个词库`}
        </SLabel>
        {libraries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#9CA3AF' }}>
            <BookOpen size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p style={{ fontSize: '14px' }}>暂无词库，点击右上角新增</p>
          </div>
        ) : filteredLibraries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF' }}>
            <BookOpen size={28} style={{ marginBottom: '10px', opacity: 0.3 }} />
            <p style={{ fontSize: '14px' }}>未找到匹配的词库</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredLibraries.map(lib => (
              <div key={lib.id} style={{ ...CARD, padding: '20px' }}>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>{lib.name}</p>
                <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 14px', lineHeight: 1.6 }}>{lib.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#2563EB', background: '#EFF6FF', padding: '3px 10px', borderRadius: '20px' }}>
                    {lib.wordIds.length} 个单词
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => { setManagingLibId(lib.id); setWordSearch(''); }}
                      style={{ padding: '7px 16px', background: '#EFF6FF', border: 'none', borderRadius: '20px', cursor: 'pointer', color: '#2563EB', fontSize: '13px', fontWeight: 500 }}
                    >
                      管理单词
                    </button>
                    <button onClick={() => openEdit(lib)} style={{ padding: '7px 16px', background: '#F1F5F9', border: 'none', borderRadius: '20px', cursor: 'pointer', color: '#374151', fontSize: '13px', fontWeight: 500 }}>
                      编辑
                    </button>
                    <button onClick={() => onDelete(lib.id)} style={{ padding: '7px 16px', background: '#FEF2F2', border: 'none', borderRadius: '20px', cursor: 'pointer', color: '#DC2626', fontSize: '13px', fontWeight: 500 }}>
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Word Edit Form ───────────────────────────────────────────────────────────
function WordEditForm({ word, isNew, onSave, onCancel }: {
  word: Partial<Word>;
  isNew: boolean;
  onSave: (w: Word) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<Word>>({
    id: word.id || genId(),
    word: word.word || '',
    phonetic: word.phonetic || '',
    coreMeaning: word.coreMeaning || '',
    coreImageType: word.coreImageType || 'flow',
    coreExampleSentence: word.coreExampleSentence || '',
    coreExampleTranslation: word.coreExampleTranslation || '',
    extendedMeanings: word.extendedMeanings || [],
    collocations: word.collocations || [],
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [aiDone, setAiDone] = useState(!!word.word);
  const [colInput, setColInput] = useState((word.collocations || []).join('、'));

  const set = (key: keyof Word, val: unknown) => setForm(f => ({ ...f, [key]: val }));

  const handleAI = () => {
    if (!form.word) return;
    setAiLoading(true); setAiDone(false);
    setTimeout(() => {
      const g = generateAIContent(form.word!);
      setForm(f => ({ ...f, ...g }));
      setColInput((g.collocations || []).join('、'));
      setAiLoading(false); setAiDone(true);
    }, 1800);
  };

  const handleRegenImg = () => {
    setImgLoading(true);
    setTimeout(() => {
      const cur = form.coreImageType || 'flow';
      set('coreImageType', IMAGE_TYPES[(IMAGE_TYPES.indexOf(cur) + 1) % IMAGE_TYPES.length]);
      setImgLoading(false);
    }, 500);
  };

  const updateExt = (i: number, key: keyof ExtendedMeaning, val: string) => {
    const exts = [...(form.extendedMeanings || [])];
    exts[i] = { ...exts[i], [key]: val };
    set('extendedMeanings', exts);
  };
  const addExt = () => set('extendedMeanings', [
    ...(form.extendedMeanings || []),
    { id: genId(), logicalEvolution: '', meaning: '', partOfSpeech: 'v.', exampleSentence: '', exampleTranslation: '' },
  ]);
  const removeExt = (i: number) => {
    const exts = [...(form.extendedMeanings || [])]; exts.splice(i, 1); set('extendedMeanings', exts);
  };

  const handleSave = () => {
    if (!form.word) return;
    onSave({ ...(form as Word), collocations: colInput.split(/[,，、]/).map(s => s.trim()).filter(Boolean) });
  };

  const ta = { ...INPUT, minHeight: '72px', resize: 'vertical' as const };
  const taShort = { ...ta, minHeight: '48px' };

  return (
    <div style={{ paddingBottom: '40px' }}>

      {/* AI Generate card */}
      <div style={{ marginBottom: '20px' }}>
        <SLabel>AI 生成</SLabel>
        <div style={{
          ...CARD, padding: '20px',
          background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
          border: '1px solid #BFDBFE',
        }}>
          <label style={LABEL}>单词</label>
          <input
            value={form.word || ''}
            onChange={e => { set('word', e.target.value); setAiDone(false); }}
            placeholder="输入英文单词，例：flow"
            style={{ ...INPUT, marginBottom: '12px' }}
            onFocus={onFocus} onBlur={onBlur}
          />
          <button
            onClick={handleAI}
            disabled={aiLoading || !form.word}
            style={{
              width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
              background: aiLoading ? '#93C5FD' : aiDone ? '#059669' : '#2563EB',
              color: '#fff', fontSize: '15px', fontWeight: 700,
              cursor: !form.word || aiLoading ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'background 0.25s',
            }}
          >
            {aiLoading
              ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} />正在生成...</>
              : aiDone
              ? <><Check size={15} />已生成，可继续编辑</>
              : 'AI 自动生成词条'}
          </button>
        </div>
      </div>

      {/* Basic info */}
      <SLabel>基本信息</SLabel>
      <div style={{ ...CARD, padding: '20px', marginBottom: '20px' }}>
        <label style={LABEL}>音标</label>
        <input value={form.phonetic || ''} onChange={e => set('phonetic', e.target.value)} placeholder="/fləʊ/" style={INPUT} onFocus={onFocus} onBlur={onBlur} />
      </div>

      {/* Core meaning */}
      <SLabel>核心义</SLabel>
      <div style={{ ...CARD, padding: '20px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={LABEL}>核心义描述</label>
          <textarea value={form.coreMeaning || ''} onChange={e => set('coreMeaning', e.target.value)} placeholder="从物理感知出发，描述词的核心物理意义..." style={ta} onFocus={onFocus} onBlur={onBlur} />
        </div>
        <div>
          <label style={LABEL}>核心义例句</label>
          <textarea value={form.coreExampleSentence || ''} onChange={e => set('coreExampleSentence', e.target.value)} placeholder="English example sentence..." style={taShort} onFocus={onFocus} onBlur={onBlur} />
        </div>
        <div>
          <label style={LABEL}>例句中文翻译</label>
          <textarea value={form.coreExampleTranslation || ''} onChange={e => set('coreExampleTranslation', e.target.value)} placeholder="中文翻译..." style={taShort} onFocus={onFocus} onBlur={onBlur} />
        </div>
      </div>

      {/* Physical image */}
      <SLabel>核心义图（物理意象）</SLabel>
      <div style={{ ...CARD, padding: '20px', marginBottom: '20px' }}>
        <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '12px' }}>
          <PhysicalImage type={form.coreImageType || 'flow'} />
        </div>
        <button
          onClick={handleRegenImg}
          disabled={imgLoading}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '11px', background: '#F1F5F9', border: 'none',
            borderRadius: '14px', cursor: imgLoading ? 'default' : 'pointer', color: '#374151', fontSize: '13px', fontWeight: 500,
          }}
        >
          <RefreshCw size={13} style={imgLoading ? { animation: 'spin 0.6s linear infinite' } : {}} />
          重新生成
        </button>
      </div>

      {/* Extended meanings */}
      <SLabel>引申义{isNew ? '（由 AI 生成后自动填充）' : ''}</SLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        {(form.extendedMeanings || []).length === 0 && isNew && (
          <div style={{ textAlign: 'center', padding: '28px 0', color: '#D1D5DB', background: '#fff', borderRadius: '16px', border: '1.5px dashed #E5E7EB' }}>
            <p style={{ fontSize: '13px', margin: 0 }}>点击上方「AI 自动生成词条」后自动填充</p>
          </div>
        )}
        {(form.extendedMeanings || []).map((ext, i) => (
          <div key={ext.id} style={{ ...CARD, padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', letterSpacing: '1px', textTransform: 'uppercase' }}>
                引申义 {i + 1}
              </span>
              {!isNew && (
                <button onClick={() => removeExt(i)} style={{ background: '#FEF2F2', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#DC2626', padding: '5px 7px', display: 'flex' }}>
                  <X size={14} />
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={LABEL}>逻辑演化描述</label>
                <input value={ext.logicalEvolution} onChange={e => updateExt(i, 'logicalEvolution', e.target.value)} placeholder="物理感知 → 抽象延伸..." style={INPUT} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 96px', gap: '10px' }}>
                <div>
                  <label style={LABEL}>引申义</label>
                  <input value={ext.meaning} onChange={e => updateExt(i, 'meaning', e.target.value)} placeholder="中文引申义" style={INPUT} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <div>
                  <label style={LABEL}>词性</label>
                  <select value={ext.partOfSpeech} onChange={e => updateExt(i, 'partOfSpeech', e.target.value)} style={{ ...INPUT, cursor: 'pointer' }} onFocus={onFocus} onBlur={onBlur}>
                    {POS_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={LABEL}>英文例句</label>
                <textarea value={ext.exampleSentence} onChange={e => updateExt(i, 'exampleSentence', e.target.value)} placeholder="English example..." style={taShort} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label style={LABEL}>例句中文翻译</label>
                <textarea value={ext.exampleTranslation} onChange={e => updateExt(i, 'exampleTranslation', e.target.value)} placeholder="中文翻译..." style={taShort} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>
          </div>
        ))}
        {!isNew && (
          <button
            onClick={addExt}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '14px', background: '#fff', border: '1.5px dashed #D1D5DB',
              borderRadius: '16px', cursor: 'pointer', color: '#6B7280', fontSize: '14px', fontWeight: 500,
            }}
          >
            <Plus size={16} />添加引申义
          </button>
        )}
      </div>

      {/* Collocations */}
      <SLabel>常见搭配</SLabel>
      <div style={{ ...CARD, padding: '20px', marginBottom: '24px' }}>
        <label style={LABEL}>用顿号或逗号分隔多个搭配</label>
        <textarea value={colInput} onChange={e => setColInput(e.target.value)} placeholder="flow freely、cash flow、go with the flow..." style={{ ...ta, minHeight: '60px' }} onFocus={onFocus} onBlur={onBlur} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <PrimaryBtn onClick={handleSave} disabled={!form.word}>保存单词</PrimaryBtn>
        {!isNew && <PrimaryBtn onClick={onCancel} ghost>取消</PrimaryBtn>}
      </div>
    </div>
  );
}

// ─── Word Manager ─────────────────────────────────────────────────────────────
function WordManager({ words, onAdd, onEdit, onDelete, onBack }: {
  words: Word[];
  onAdd: (w: Word) => void;
  onEdit: (id: string, w: Word) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}) {
  const [editWord, setEditWord] = useState<Partial<Word> | null>(null);
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? words.filter(w => w.word.toLowerCase().includes(query.trim().toLowerCase()) || w.coreMeaning.includes(query.trim()))
    : words;

  const handleSave = (w: Word) => {
    if (words.find(x => x.id === w.id)) onEdit(w.id, w); else onAdd(w);
    setEditWord(null);
  };

  if (editWord !== null) {
    return (
      <div style={{ minHeight: '100vh', background: BG }}>
        <PageHeader onBack={() => setEditWord(null)} backLabel="单词列表">
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>
            {editWord.word ? `编辑：${editWord.word}` : '新增单词'}
          </h1>
        </PageHeader>
        <div style={{ padding: '8px 24px 40px' }}>
          <WordEditForm word={editWord} isNew={!words.find(x => x.id === editWord.id)} onSave={handleSave} onCancel={() => setEditWord(null)} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: BG }}>
      <PageHeader
        onBack={onBack}
        right={
          <button
            onClick={() => setEditWord({ id: genId() })}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={14} />新增
          </button>
        }
      >
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>单词管理</h1>
      </PageHeader>

      <div style={{ padding: '8px 24px 40px' }}>
        {/* Search box */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜索单词或含义..."
            style={{ ...INPUT, paddingLeft: '40px' }}
            onFocus={onFocus}
            onBlur={onBlur}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '2px', display: 'flex' }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        <SLabel>共 {filtered.length} 个单词</SLabel>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#9CA3AF' }}>
            <Type size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p style={{ fontSize: '14px' }}>暂无单词</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map(word => (
                <div key={word.id} style={{ ...CARD, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>{word.word}</span>
                        <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{word.phonetic}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 8px', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {word.coreMeaning}
                      </p>
                      <span style={{ fontSize: '11px', color: '#6B7280', background: '#F3F4F6', padding: '2px 8px', borderRadius: '20px' }}>{word.extendedMeanings.length} 个引申义</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button onClick={() => setEditWord(word)} style={{ padding: '7px 14px', background: '#F1F5F9', border: 'none', borderRadius: '20px', cursor: 'pointer', color: '#374151', fontSize: '13px', fontWeight: 500 }}>
                        编辑
                      </button>
                      <button onClick={() => onDelete(word.id)} style={{ padding: '7px 14px', background: '#FEF2F2', border: 'none', borderRadius: '20px', cursor: 'pointer', color: '#DC2626', fontSize: '13px', fontWeight: 500 }}>
                        删除
                      </button>
                    </div>
                  </div>
                </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── User Manager ─────────────────────────────────────────────────────────────
function UserManager({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: BG }}>
      <PageHeader onBack={onBack}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>用户管理</h1>
      </PageHeader>
      <div style={{ padding: '8px 24px 40px' }}>
        <SLabel>共 {mockUsers.length} 位用户</SLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {mockUsers.map(u => (
            <div key={u.id} style={{ ...CARD, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                background: u.role === 'admin'
                  ? 'linear-gradient(135deg,#7C3AED,#8B5CF6)'
                  : 'linear-gradient(135deg,#2563EB,#3B82F6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '16px', fontWeight: 700,
              }}>
                {u.username[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{u.username}</span>
                  <span style={{
                    fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                    background: u.role === 'admin' ? '#FAF5FF' : '#F3F4F6',
                    color: u.role === 'admin' ? '#7C3AED' : '#6B7280', fontWeight: 500,
                  }}>
                    {u.role === 'admin' ? '管理员' : '普通用户'}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>{u.phone}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: '17px', fontWeight: 700, color: '#2563EB', margin: '0 0 2px' }}>{u.learnedWords}</p>
                <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>已学</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function AdminView({ navigate, user }: AdminViewProps) {
  const [section, setSection] = useState<AdminSection>('overview');
  const [libraries, setLibraries] = useState<WordLibrary[]>(initialLibraries);
  const [words, setWords] = useState<Word[]>(initialWords);

  const addLib = (d: Omit<WordLibrary, 'id' | 'createdAt'>) =>
    setLibraries(p => [...p, { ...d, id: genId(), createdAt: new Date().toISOString().slice(0, 10) }]);
  const editLib = (id: string, d: Partial<WordLibrary>) =>
    setLibraries(p => p.map(l => l.id === id ? { ...l, ...d } : l));
  const deleteLib = (id: string) => {
    if (!window.confirm('确认删除该词库？')) return;
    setLibraries(p => p.filter(l => l.id !== id));
  };
  const addWordToLib = (libId: string, wordId: string) =>
    setLibraries(p => p.map(l => l.id === libId
      ? { ...l, wordIds: l.wordIds.includes(wordId) ? l.wordIds : [...l.wordIds, wordId] }
      : l));
  const removeWordFromLib = (libId: string, wordId: string) =>
    setLibraries(p => p.map(l => l.id === libId
      ? { ...l, wordIds: l.wordIds.filter(id => id !== wordId) }
      : l));
  const addWord = (w: Word) => setWords(p => [...p, w]);
  const editWord = (id: string, w: Word) => setWords(p => p.map(x => x.id === id ? w : x));
  const deleteWord = (id: string) => {
    if (!window.confirm('确认删除该单词？')) return;
    setWords(p => p.filter(w => w.id !== id));
  };

  return (
    <div style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', minHeight: '100vh', background: BG }}>
      {section === 'overview' && <Overview libraries={libraries} words={words} onNavigate={setSection} onExit={() => navigate({ name: 'profile' })} />}
      {section === 'libraries' && <LibraryManager libraries={libraries} words={words} onAdd={addLib} onEdit={editLib} onDelete={deleteLib} onAddWordToLib={addWordToLib} onRemoveWordFromLib={removeWordFromLib} onBack={() => setSection('overview')} />}
      {section === 'words' && <WordManager words={words} onAdd={addWord} onEdit={editWord} onDelete={deleteWord} onBack={() => setSection('overview')} />}
      {section === 'users' && <UserManager onBack={() => setSection('overview')} />}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
