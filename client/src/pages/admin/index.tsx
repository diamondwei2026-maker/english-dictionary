import { useState, useEffect } from "react";
import { View, Text, Input, Textarea, Picker } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import type { Word, WordLibrary, ExtendedMeaning } from "../../data/types";
import {
  fetchWords,
  fetchWordbanks,
  fetchUsers,
  createWordbank as apiCreateWordbank,
  updateWordbank as apiUpdateWordbank,
  deleteWordbank as apiDeleteWordbank,
  createWord as apiCreateWord,
  updateWord as apiUpdateWord,
  deleteWord as apiDeleteWord,
  mapPosToBackend,
  generateWord,
  generateWordStream,
} from "../../api";
import { PhysicalImage } from "../../components/PhysicalImage";
import { PageHeader } from "../../components/PageHeader";
import { Icon } from "../../components/Icon";

type AdminSection = "overview" | "libraries" | "words" | "users";

const IMAGE_TYPES = [
  "flow", "grasp", "break", "bear", "drive", "light", "leverage", "yield",
];
const POS_OPTIONS = ["n.", "v.", "adj.", "adv.", "v./n.", "adj./adv.", "prep."];

function genId() {
  return Math.random().toString(36).slice(2, 10);
}


// ---- Style tokens ----
const BG = "#F7F9FC";
const CARD: Record<string, unknown> = {
  background: "#fff",
  borderRadius: "20px",
  boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
};
const SECTION_LABEL = {
  fontSize: "11px" as const,
  fontWeight: "600" as const,
  color: "#9CA3AF",
  letterSpacing: "2px",
  textTransform: "uppercase" as const,
  margin: "0 0 12px",
};
const INPUT = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: "14px",
  border: "1.5px solid transparent",
  background: "#F1F5F9",
  fontSize: "15px",
  color: "#111827",
  outline: "none",
  boxSizing: "border-box" as const,
  lineHeight: "1.5",
};
const LABEL = {
  display: "block" as const,
  fontSize: "13px",
  fontWeight: "600" as const,
  color: "#374151",
  marginBottom: "8px",
};

function SLabel({ children }: { children: React.ReactNode }) {
  return <Text style={SECTION_LABEL}>{children}</Text>;
}

// ---- Overview ----
function Overview({
  libraries,
  words,
  users,
  onNavigate,
  onExit,
}: {
  libraries: WordLibrary[];
  words: Word[];
  users: { id: string; username: string; phone: string; role: string; joinedAt: string; learnedWords: number }[];
  onNavigate: (s: AdminSection) => void;
  onExit: () => void;
}) {
  const sections = [
    {
      id: "libraries" as AdminSection,
      label: "词库管理",
      icon: "book" as const,
      count: `${libraries.length} 个词库`,
      color: "#2563EB",
      bg: "#EFF6FF",
    },
    {
      id: "words" as AdminSection,
      label: "单词管理",
      icon: "font" as const,
      count: `${words.length} 个单词`,
      color: "#16A34A",
      bg: "#F0FDF4",
    },
    {
      id: "users" as AdminSection,
      label: "用户管理",
      icon: "friends" as const,
      count: `${users.length} 位用户`,
      color: "#7C3AED",
      bg: "#FAF5FF",
    },
  ];

  return (
    <View style={{ minHeight: "100vh", background: BG }}>
      <PageHeader subtitle="管理后台" title="数据概览" sticky bgColor="rgba(247,249,252,0.94)" />

      <View style={{ padding: "16px 24px 40px" }}>
        <View style={{
          background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 60%, #3B82F6 100%)",
          borderRadius: "24px", padding: "24px", marginBottom: "24px",
          boxShadow: "0 8px 32px rgba(37,99,235,0.22)", color: "#fff",
        }}>
          <Text style={{ fontSize: "11px", opacity: "0.7", letterSpacing: "2px",
            textTransform: "uppercase", color: "#fff", display: "block", marginBottom: "16px" }}>
            当前数据
          </Text>
          <View style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "4px" }}>
            {[
              { label: "词库", value: libraries.length },
              { label: "单词", value: words.length },
              { label: "用户", value: users.length },
            ].map((s, i) => (
              <View key={i} style={{ textAlign: "center" }}>
                <Text style={{ fontSize: "30px", fontWeight: "800", color: "#fff", display: "block", marginBottom: "2px", letterSpacing: "-0.5px" }}>
                  {s.value}
                </Text>
                <Text style={{ fontSize: "12px", opacity: "0.7", color: "#fff", display: "block" }}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <SLabel>功能入口</SLabel>
        <View style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "32px" }}>
          {sections.map((s) => (
            <View key={s.id} onClick={() => onNavigate(s.id)}
              style={{ ...CARD, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px" }}>
              <View style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <View style={{ width: "44px", height: "44px", borderRadius: "12px", background: s.bg,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={s.icon as any} size={20} color={s.color} />
                </View>
                <View>
                  <Text style={{ fontSize: "16px", fontWeight: "600", color: "#111827", display: "block", marginBottom: "2px" }}>{s.label}</Text>
                  <Text style={{ fontSize: "13px", color: "#9CA3AF", display: "block" }}>{s.count}</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={16} color="#D1D5DB" />
            </View>
          ))}
        </View>

        <View onClick={onExit}
          style={{ padding: "16px", background: "#FEF2F2", color: "#DC2626", borderRadius: "16px",
            fontSize: "15px", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <Text style={{ color: "#DC2626" }}>退出管理</Text>
        </View>
      </View>
    </View>
  );
}

// ---- Library Manager ----
function LibraryManager({
  libraries,
  words,
  onAdd,
  onEdit,
  onDelete,
  onBack,
}: {
  libraries: WordLibrary[];
  words: Word[];
  onAdd: (l: Omit<WordLibrary, "id" | "createdAt">) => void;
  onEdit: (id: string, d: Partial<WordLibrary>) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}) {
  const [editTarget, setEditTarget] = useState<WordLibrary | "new" | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openNew = () => { setName(""); setDesc(""); setEditTarget("new"); };
  const openEdit = (lib: WordLibrary) => { setName(lib.name); setDesc(lib.description); setEditTarget(lib); };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editTarget === "new") await onAdd({ name, description: desc, wordCount: 0 });
      else if (editTarget) await onEdit(editTarget.id, { name, description: desc });
      setEditTarget(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Taro.showModal({
      title: "确认删除",
      content: "确认删除该词库？",
      success: (res) => { if (res.confirm) onDelete(id); },
    });
  };

  if (editTarget !== null) {
    const isNew = editTarget === "new";
    return (
      <View style={{ minHeight: "100vh", background: BG }}>
        <PageHeader showBack backLabel="词库列表" title={isNew ? "新增词库" : "编辑词库"}
          onBack={() => setEditTarget(null)} bgColor="rgba(247,249,252,0.94)" sticky />
        <View style={{ padding: "8px 24px 40px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <View><Text style={LABEL}>词库名称</Text>
            <Input value={name} onInput={(e) => setName(e.detail.value)}
              onFocus={() => setFocusedField("libName")} onBlur={() => setFocusedField(null)}
              placeholder="输入词库名称"
              style={{ ...INPUT, border: focusedField === "libName" ? "1.5px solid #2563EB" : "1.5px solid transparent",
                background: focusedField === "libName" ? "#fff" : "#F1F5F9" }} />
          </View>
          <View><Text style={LABEL}>词库描述</Text>
            <Textarea value={desc} onInput={(e) => setDesc(e.detail.value)}
              onFocus={() => setFocusedField("libDesc")} onBlur={() => setFocusedField(null)}
              placeholder="简要描述该词库的内容和适用人群..."
              style={{ ...INPUT, minHeight: "88px", border: focusedField === "libDesc" ? "1.5px solid #2563EB" : "1.5px solid transparent",
                background: focusedField === "libDesc" ? "#fff" : "#F1F5F9" }} />
          </View>
          <View onClick={saving ? undefined : handleSave}
            style={{ padding: "15px", borderRadius: "16px",
              background: !name.trim() || saving ? "#93C5FD" : "#2563EB",
              color: "#fff", fontSize: "15px", fontWeight: "700", textAlign: "center", opacity: saving ? 0.6 : 1 }}>
            <Text style={{ color: "#fff" }}>{saving ? "保存中..." : "保存"}</Text>
          </View>
          <View onClick={() => setEditTarget(null)}
            style={{ padding: "15px", borderRadius: "16px", background: "#fff",
              border: "1.5px solid #BFDBFE", color: "#2563EB", fontSize: "15px", fontWeight: "700", textAlign: "center" }}>
            <Text style={{ color: "#2563EB" }}>取消</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ minHeight: "100vh", background: BG }}>
      <PageHeader showBack backLabel="返回" title="词库管理" onBack={onBack}
        bgColor="rgba(247,249,252,0.94)" sticky
        right={<View onClick={openNew} style={{ display: "flex", alignItems: "center", gap: "5px",
          padding: "8px 16px", background: "#2563EB", borderRadius: "20px" }}>
          <Text style={{ color: "#fff", fontSize: "13px", fontWeight: "600" }}>+ 新增</Text>
        </View>} />

      <View style={{ padding: "8px 24px 40px" }}>
        <SLabel>共 {libraries.length} 个词库</SLabel>
        {libraries.length === 0 ? (
          <View style={{ textAlign: "center", padding: "64px 0", color: "#9CA3AF" }}>
            <Icon name="book" size={32} color="rgba(156,163,175,0.3)" />
            <Text style={{ fontSize: "14px", display: "block" }}>暂无词库，点击右上角新增</Text>
          </View>
        ) : (
          <View style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {libraries.map((lib) => (
              <View key={lib.id} style={{ ...CARD, padding: "20px" }}>
                <Text style={{ fontSize: "16px", fontWeight: "700", color: "#111827", display: "block", marginBottom: "6px" }}>{lib.name}</Text>
                <Text style={{ fontSize: "13px", color: "#6B7280", display: "block", marginBottom: "14px", lineHeight: "1.6" }}>{lib.description}</Text>
                <View style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: "12px", color: "#2563EB", background: "#EFF6FF",
                    padding: "3px 10px", borderRadius: "20px" }}>
                    {words.filter((w) => w.libraryId === lib.id).length} 个单词
                  </Text>
                  <View style={{ display: "flex", gap: "8px" }}>
                    <View onClick={() => openEdit(lib)}
                      style={{ padding: "7px 16px", background: "#F1F5F9", borderRadius: "20px" }}>
                      <Text style={{ color: "#374151", fontSize: "13px", fontWeight: "500" }}>编辑</Text>
                    </View>
                    <View onClick={() => handleDelete(lib.id)}
                      style={{ padding: "7px 16px", background: "#FEF2F2", borderRadius: "20px" }}>
                      <Text style={{ color: "#DC2626", fontSize: "13px", fontWeight: "500" }}>删除</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// ---- Word Edit Form ----
function WordEditForm({
  word,
  libraries,
  isNew,
  onSave,
  onCancel,
  saving,
}: {
  word: Partial<Word>;
  libraries: WordLibrary[];
  isNew: boolean;
  onSave: (w: Word) => void;
  onCancel: () => void;
  saving?: boolean;
}) {
  const [form, setForm] = useState<Partial<Word>>({
    id: word.id || genId(),
    libraryId: word.libraryId || libraries[0]?.id || "",
    word: word.word || "",
    phonetic: word.phonetic || "",
    coreMeaning: word.coreMeaning || "",
    coreImageType: word.coreImageType || "flow",
    coreImageDescription: word.coreImageDescription || "",
    coreExampleSentence: word.coreExampleSentence || "",
    coreExampleTranslation: word.coreExampleTranslation || "",
    extendedMeanings: word.extendedMeanings || [],
    collocations: word.collocations || [],
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [aiDone, setAiDone] = useState(!!word.word);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [colInput, setColInput] = useState((word.collocations || []).join("、"));

  const libraryNames = libraries.map((l) => l.name);

  const set = (key: keyof Word, val: unknown) => setForm((f) => ({ ...f, [key]: val }));

  const handleAI = async () => {
    // 防止重复点击
    if (aiLoading) return;
    // 前端校验
    if (!form.word) {
      Taro.showToast({ title: "请先输入单词", icon: "none" });
      return;
    }
    if (!form.libraryId) {
      Taro.showToast({ title: "请先选择词库", icon: "none" });
      return;
    }
    if (form.word.length > 100) {
      Taro.showToast({ title: "单词过长，请控制在 100 字以内", icon: "none" });
      return;
    }

    const force = !!form.coreMeaning;
    setAiLoading(true);
    setAiDone(false);

    try {
      // 优先尝试 SSE 流式接口
      await generateWordStream(form.word, form.libraryId, force, {
        onThinking(_message: string) {
          // 进度消息，流式模式下可在此更新 UI 进度文本
        },
        onDone(adaptedWord: Word) {
          setForm((f) => ({
            ...f,
            id: f.id,
            libraryId: f.libraryId,
            phonetic: adaptedWord.phonetic,
            coreMeaning: adaptedWord.coreMeaning,
            coreImageType: adaptedWord.coreImageType,
            coreImageDescription: adaptedWord.coreImageDescription,
            coreExampleSentence: adaptedWord.coreExampleSentence,
            coreExampleTranslation: adaptedWord.coreExampleTranslation,
            extendedMeanings: adaptedWord.extendedMeanings,
            collocations: adaptedWord.collocations,
          }));
          setColInput((adaptedWord.collocations || []).join("、"));
          setAiDone(true);
        },
        onError(code: string, message: string) {
          Taro.showToast({ title: message, icon: "none", duration: 2500 });
        },
      });
    } catch {
      // SSE 异常，降级为非流式接口
      try {
        const result = await generateWord(form.word, form.libraryId, force);
        setForm((f) => ({
          ...f,
          id: f.id,
          libraryId: f.libraryId,
          phonetic: result.phonetic,
          coreMeaning: result.coreMeaning,
          coreImageType: result.coreImageType,
          coreImageDescription: result.coreImageDescription,
          coreExampleSentence: result.coreExampleSentence,
          coreExampleTranslation: result.coreExampleTranslation,
          extendedMeanings: result.extendedMeanings,
          collocations: result.collocations,
        }));
        setColInput((result.collocations || []).join("、"));
        setAiDone(true);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "AI 生成失败，请稍后再试";
        Taro.showToast({ title: msg, icon: "none", duration: 2500 });
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleRegenImg = () => {
    setImgLoading(true);
    setTimeout(() => {
      const cur = form.coreImageType || "flow";
      set("coreImageType", IMAGE_TYPES[(IMAGE_TYPES.indexOf(cur) + 1) % IMAGE_TYPES.length]);
      setImgLoading(false);
    }, 500);
  };

  const updateExt = (i: number, key: keyof ExtendedMeaning, val: string) => {
    const exts = [...(form.extendedMeanings || [])];
    exts[i] = { ...exts[i], [key]: val };
    set("extendedMeanings", exts);
  };
  const addExt = () => set("extendedMeanings", [
    ...(form.extendedMeanings || []),
    { id: genId(), logicalEvolution: "", meaning: "", partOfSpeech: "v.", exampleSentence: "", exampleTranslation: "" },
  ]);
  const removeExt = (i: number) => {
    const exts = [...(form.extendedMeanings || [])];
    exts.splice(i, 1);
    set("extendedMeanings", exts);
  };

  const handleSave = () => {
    if (!form.word || !form.libraryId) return;
    onSave({
      ...(form as Word),
      collocations: colInput.split(/[,，、]/).map((s) => s.trim()).filter(Boolean),
    });
  };

  const ta = { ...INPUT, minHeight: "72px" };
  const taShort = { ...ta, minHeight: "48px" };

  const fieldStyle = (fieldKey: string, baseStyle: Record<string, unknown> = INPUT) => ({
    ...baseStyle,
    border: focusedField === fieldKey ? "1.5px solid #2563EB" : "1.5px solid transparent",
    background: focusedField === fieldKey ? "#fff" : "#F1F5F9",
  });

  return (
    <View style={{ paddingBottom: "40px" }}>
      {/* AI Generate card */}
      <View style={{ marginBottom: "20px" }}>
        <SLabel>AI 生成</SLabel>
        <View style={{ ...CARD, padding: "20px", background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)", border: "1px solid #BFDBFE" }}>
          <Text style={LABEL}>单词</Text>
          <Input value={form.word || ""} onInput={(e) => { set("word", e.detail.value); setAiDone(false); }}
            onFocus={() => setFocusedField("aiWord")} onBlur={() => setFocusedField(null)}
            placeholder="输入英文单词，例：flow"
            style={{ ...fieldStyle("aiWord"), marginBottom: "12px" }} />
          <View onClick={handleAI}
            style={{ padding: "14px", borderRadius: "14px",
              background: aiLoading ? "#93C5FD" : aiDone ? "#059669" : "#2563EB",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <Text style={{ color: "#fff", fontSize: "15px", fontWeight: "700" }}>
              {aiLoading ? "⏳ 正在生成..." : aiDone ? "✓ 已生成，可继续编辑" : "AI 自动生成词条"}
            </Text>
          </View>
        </View>
      </View>

      {/* Basic info */}
      <SLabel>基本信息</SLabel>
      <View style={{ ...CARD, padding: "20px", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <View><Text style={LABEL}>所属词库</Text>
          <Picker mode="selector" range={libraryNames}
            value={libraries.findIndex((l) => l.id === form.libraryId)}
            onChange={(e) => { const lib = libraries[e.detail.value]; if (lib) set("libraryId", lib.id); }}>
            <View style={{ ...INPUT, cursor: "pointer" }}>
              <Text>{libraries.find((l) => l.id === form.libraryId)?.name || "选择词库"}</Text>
            </View>
          </Picker>
        </View>
        <View><Text style={LABEL}>音标</Text>
          <Input value={form.phonetic || ""} onInput={(e) => set("phonetic", e.detail.value)}
            onFocus={() => setFocusedField("phonetic")} onBlur={() => setFocusedField(null)}
            placeholder="/fləʊ/" style={fieldStyle("phonetic")} />
        </View>
      </View>

      {/* Core meaning */}
      <SLabel>核心义</SLabel>
      <View style={{ ...CARD, padding: "20px", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <View><Text style={LABEL}>核心义描述</Text>
          <Textarea value={form.coreMeaning || ""} onInput={(e) => set("coreMeaning", e.detail.value)}
            onFocus={() => setFocusedField("coreMeaning")} onBlur={() => setFocusedField(null)}
            placeholder="从物理感知出发，描述词的核心物理意义..."
            style={fieldStyle("coreMeaning", ta)} />
        </View>
        <View><Text style={LABEL}>核心义例句</Text>
          <Textarea value={form.coreExampleSentence || ""} onInput={(e) => set("coreExampleSentence", e.detail.value)}
            onFocus={() => setFocusedField("coreExampleSent")} onBlur={() => setFocusedField(null)}
            placeholder="English example sentence..."
            style={fieldStyle("coreExampleSent", taShort)} />
        </View>
        <View><Text style={LABEL}>例句中文翻译</Text>
          <Textarea value={form.coreExampleTranslation || ""} onInput={(e) => set("coreExampleTranslation", e.detail.value)}
            onFocus={() => setFocusedField("coreExampleTrans")} onBlur={() => setFocusedField(null)}
            placeholder="中文翻译..."
            style={fieldStyle("coreExampleTrans", taShort)} />
        </View>
      </View>

      {/* Physical image */}
      <SLabel>核心义图（物理意象）</SLabel>
      <View style={{ ...CARD, padding: "20px", marginBottom: "20px" }}>
        <View style={{ borderRadius: "16px", overflow: "hidden", marginBottom: "12px" }}>
          <PhysicalImage type={form.coreImageType || "flow"} />
        </View>
        <View onClick={handleRegenImg}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            padding: "11px", background: "#F1F5F9", borderRadius: "14px", color: "#374151", fontSize: "13px", fontWeight: "500", marginBottom: "14px" }}>
          <Icon name="refresh" size={14} />
          <Text style={{ marginLeft: 4 }}>{imgLoading ? "生成中..." : "重新生成"}</Text>
        </View>
        <View>
          <Text style={LABEL}>意象描述（触发物理感知的关键描述）</Text>
          <Textarea
            value={form.coreImageDescription || ""}
            onInput={(e) => set("coreImageDescription", e.detail.value)}
            onFocus={() => setFocusedField("coreImageDesc")}
            onBlur={() => setFocusedField(null)}
            placeholder="描述单词最原始的物理动作或状态..."
            style={fieldStyle("coreImageDesc", ta)}
          />
        </View>
      </View>

      {/* Extended meanings */}
      <SLabel>引申义{isNew ? "（由 AI 生成后自动填充）" : ""}</SLabel>
      <View style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
        {(form.extendedMeanings || []).length === 0 && isNew && (
          <View style={{ textAlign: "center", padding: "28px 0", color: "#D1D5DB",
            background: "#fff", borderRadius: "16px", border: "1.5px dashed #E5E7EB" }}>
            <Text style={{ fontSize: "13px" }}>点击上方「AI 自动生成词条」后自动填充</Text>
          </View>
        )}
        {(form.extendedMeanings || []).map((ext, i) => (
          <View key={ext.id} style={{ ...CARD, padding: "20px" }}>
            <View style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <Text style={{ fontSize: "12px", fontWeight: "600", color: "#9CA3AF",
                letterSpacing: "1px", textTransform: "uppercase" }}>引申义 {i + 1}</Text>
              {!isNew && (
                <View onClick={() => removeExt(i)}
                  style={{ background: "#FEF2F2", borderRadius: "8px", padding: "5px 7px" }}>
                  <Icon name="close" size={14} color="#DC2626" />
                </View>
              )}
            </View>
            <View style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <View><Text style={LABEL}>逻辑演化描述</Text>
                <Input value={ext.logicalEvolution} onInput={(e) => updateExt(i, "logicalEvolution", e.detail.value)}
                  onFocus={() => setFocusedField(`extLogic_${i}`)} onBlur={() => setFocusedField(null)}
                  placeholder="物理感知 → 抽象延伸..."
                  style={fieldStyle(`extLogic_${i}`)} />
              </View>
              <View style={{ display: "grid", gridTemplateColumns: "1fr 96px", gap: "10px" }}>
                <View><Text style={LABEL}>引申义</Text>
                  <Input value={ext.meaning} onInput={(e) => updateExt(i, "meaning", e.detail.value)}
                    onFocus={() => setFocusedField(`extMeaning_${i}`)} onBlur={() => setFocusedField(null)}
                    placeholder="中文引申义" style={fieldStyle(`extMeaning_${i}`)} />
                </View>
                <View><Text style={LABEL}>词性</Text>
                  <Picker mode="selector" range={POS_OPTIONS}
                    value={POS_OPTIONS.indexOf(ext.partOfSpeech)}
                    onChange={(e) => updateExt(i, "partOfSpeech", POS_OPTIONS[e.detail.value])}>
                    <View style={{ ...INPUT, cursor: "pointer" }}>
                      <Text style={{ fontSize: "15px" }}>{ext.partOfSpeech}</Text>
                    </View>
                  </Picker>
                </View>
              </View>
              <View><Text style={LABEL}>英文例句</Text>
                <Textarea value={ext.exampleSentence} onInput={(e) => updateExt(i, "exampleSentence", e.detail.value)}
                  onFocus={() => setFocusedField(`extSent_${i}`)} onBlur={() => setFocusedField(null)}
                  placeholder="English example..." style={fieldStyle(`extSent_${i}`, taShort)} />
              </View>
              <View><Text style={LABEL}>例句中文翻译</Text>
                <Textarea value={ext.exampleTranslation} onInput={(e) => updateExt(i, "exampleTranslation", e.detail.value)}
                  onFocus={() => setFocusedField(`extTrans_${i}`)} onBlur={() => setFocusedField(null)}
                  placeholder="中文翻译..." style={fieldStyle(`extTrans_${i}`, taShort)} />
              </View>
            </View>
          </View>
        ))}
        {!isNew && (
          <View onClick={addExt}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              padding: "14px", background: "#fff", border: "1.5px dashed #D1D5DB",
              borderRadius: "16px", color: "#6B7280", fontSize: "14px", fontWeight: "500" }}>
            <Text>+ 添加引申义</Text>
          </View>
        )}
      </View>

      {/* Collocations */}
      <SLabel>常见搭配</SLabel>
      <View style={{ ...CARD, padding: "20px", marginBottom: "24px" }}>
        <Text style={LABEL}>用顿号或逗号分隔多个搭配</Text>
        <Textarea value={colInput} onInput={(e) => setColInput(e.detail.value)}
          onFocus={() => setFocusedField("collocations")} onBlur={() => setFocusedField(null)}
          placeholder="flow freely、cash flow、go with the flow..."
          style={fieldStyle("collocations", { ...ta, minHeight: "60px" })} />
      </View>

      <View style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <View onClick={saving ? undefined : handleSave}
          style={{ padding: "15px", borderRadius: "16px",
            background: !form.word || !form.libraryId || saving ? "#93C5FD" : "#2563EB",
            color: "#fff", fontSize: "15px", fontWeight: "700", textAlign: "center",
            opacity: saving ? 0.6 : 1 }}>
          <Text style={{ color: "#fff" }}>{saving ? "保存中..." : "保存单词"}</Text>
        </View>
        {!isNew && (
          <View onClick={onCancel}
            style={{ padding: "15px", borderRadius: "16px", background: "#fff",
              border: "1.5px solid #BFDBFE", color: "#2563EB", fontSize: "15px", fontWeight: "700", textAlign: "center" }}>
            <Text style={{ color: "#2563EB" }}>取消</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ---- Word Manager ----
function WordManager({
  words,
  libraries,
  onAdd,
  onEdit,
  onDelete,
  onBack,
}: {
  words: Word[];
  libraries: WordLibrary[];
  onAdd: (w: Word) => Promise<void>;
  onEdit: (id: string, w: Word) => Promise<void>;
  onDelete: (id: string) => void;
  onBack: () => void;
}) {
  const [editWord, setEditWord] = useState<Partial<Word> | null>(null);
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = query.trim()
    ? words.filter((w) =>
        w.word.toLowerCase().includes(query.trim().toLowerCase()) ||
        w.coreMeaning.includes(query.trim()))
    : words;

  const handleSave = async (w: Word) => {
    setSaving(true);
    try {
      if (words.find((x) => x.id === w.id)) await onEdit(w.id, w);
      else await onAdd(w);
      setEditWord(null);
    } catch {
      // Error toast already shown by parent callback
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Taro.showModal({
      title: "确认删除",
      content: "确认删除该单词？",
      success: (res) => { if (res.confirm) onDelete(id); },
    });
  };

  if (editWord !== null) {
    return (
      <View style={{ minHeight: "100vh", background: BG }}>
        <PageHeader showBack backLabel="返回"
          title={editWord.word ? `编辑：${editWord.word}` : "新增单词"}
          onBack={() => setEditWord(null)} bgColor="rgba(247,249,252,0.94)" sticky />
        <View style={{ padding: "8px 24px 40px" }}>
          <WordEditForm word={editWord} libraries={libraries}
            isNew={!words.find((x) => x.id === editWord.id)}
            onSave={handleSave} onCancel={() => setEditWord(null)}
            saving={saving} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ minHeight: "100vh", background: BG }}>
      <PageHeader showBack backLabel="返回" title="单词管理" onBack={onBack}
        bgColor="rgba(247,249,252,0.94)" sticky
        right={<View onClick={() => setEditWord({ id: genId() })}
          style={{ display: "flex", alignItems: "center", gap: "5px",
            padding: "8px 16px", background: "#2563EB", borderRadius: "20px" }}>
          <Text style={{ color: "#fff", fontSize: "13px", fontWeight: "600" }}>+ 新增</Text>
        </View>} />

      <View style={{ padding: "8px 24px 40px" }}>
        <View style={{ position: "relative", marginBottom: "16px" }}>
          <View style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 1 }}>
            <Icon name="search" size={16} color="#9CA3AF" />
          </View>
          <Input value={query} onInput={(e) => setQuery(e.detail.value)}
            onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
            placeholder="搜索单词或含义..."
            style={{ ...INPUT, paddingLeft: "40px",
              border: searchFocused ? "1.5px solid #2563EB" : "1.5px solid transparent",
              background: searchFocused ? "#fff" : "#F1F5F9" }} />
          {query ? (
            <View onClick={() => setQuery("")}
              style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", padding: "2px" }}>
              <Icon name="close" size={15} color="#9CA3AF" />
            </View>
          ) : null}
        </View>

        <SLabel>共 {filtered.length} 个单词</SLabel>

        {filtered.length === 0 ? (
          <View style={{ textAlign: "center", padding: "64px 0", color: "#9CA3AF" }}>
            <Icon name="font" size={32} color="rgba(156,163,175,0.3)" />
            <Text style={{ fontSize: "14px", display: "block" }}>暂无单词</Text>
          </View>
        ) : (
          <View style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filtered.map((word) => {
              const lib = libraries.find((l) => l.id === word.libraryId);
              return (
                <View key={word.id} style={{ ...CARD, padding: "16px 20px" }}>
                  <View style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <View style={{ flex: 1, minWidth: "0" }}>
                      <View style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "4px" }}>
                        <Text style={{ fontSize: "18px", fontWeight: "700", color: "#111827" }}>{word.word}</Text>
                        <Text style={{ fontSize: "12px", color: "#9CA3AF" }}>{word.phonetic}</Text>
                      </View>
                      <Text style={{ fontSize: "12px", color: "#6B7280", display: "block", marginBottom: "8px",
                        lineHeight: "1.5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {word.coreMeaning}
                      </Text>
                      <View style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {lib && <Text style={{ fontSize: "11px", color: "#2563EB", background: "#EFF6FF",
                          padding: "2px 8px", borderRadius: "20px" }}>{lib.name}</Text>}
                        <Text style={{ fontSize: "11px", color: "#6B7280", background: "#F3F4F6",
                          padding: "2px 8px", borderRadius: "20px" }}>
                          {word.extendedMeanings.length} 个引申义
                        </Text>
                      </View>
                    </View>
                    <View style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                      <View onClick={() => setEditWord(word)}
                        style={{ padding: "7px 14px", background: "#F1F5F9", borderRadius: "20px" }}>
                        <Text style={{ color: "#374151", fontSize: "13px", fontWeight: "500" }}>编辑</Text>
                      </View>
                      <View onClick={() => handleDelete(word.id)}
                        style={{ padding: "7px 14px", background: "#FEF2F2", borderRadius: "20px" }}>
                        <Text style={{ color: "#DC2626", fontSize: "13px", fontWeight: "500" }}>删除</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

// ---- User Manager ----
function UserManager({
  users,
  onBack,
}: {
  users: { id: string; username: string; phone: string; role: string; joinedAt: string; learnedWords: number }[];
  onBack: () => void;
}) {
  return (
    <View style={{ minHeight: "100vh", background: BG }}>
      <PageHeader showBack backLabel="返回" title="用户管理" onBack={onBack}
        bgColor="rgba(247,249,252,0.94)" sticky />
      <View style={{ padding: "8px 24px 40px" }}>
        <SLabel>共 {users.length} 位用户</SLabel>
        {users.length === 0 ? (
          <View style={{ textAlign: "center", padding: "64px 0", color: "#9CA3AF" }}>
            <Text style={{ fontSize: "14px", display: "block" }}>暂无用户数据</Text>
          </View>
        ) : (
          <View style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {users.map((u) => (
              <View key={u.id} style={{ ...CARD, padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
                <View style={{ width: "44px", height: "44px", borderRadius: "50%", flexShrink: 0,
                  background: u.role === "admin" ? "linear-gradient(135deg,#7C3AED,#8B5CF6)" : "linear-gradient(135deg,#2563EB,#3B82F6)",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "16px", fontWeight: "700" }}>
                  <Text style={{ color: "#fff", fontSize: "16px", fontWeight: "700" }}>{u.username[0]?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1, minWidth: "0" }}>
                  <View style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <Text style={{ fontSize: "15px", fontWeight: "600", color: "#111827" }}>{u.username}</Text>
                    <Text style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px",
                      background: u.role === "admin" ? "#FAF5FF" : "#F3F4F6",
                      color: u.role === "admin" ? "#7C3AED" : "#6B7280", fontWeight: "500" }}>
                      {u.role === "admin" ? "管理员" : "普通用户"}
                    </Text>
                  </View>
                  <Text style={{ fontSize: "12px", color: "#9CA3AF", display: "block" }}>{u.phone}</Text>
                </View>
                <View style={{ textAlign: "right", flexShrink: 0 }}>
                  <Text style={{ fontSize: "17px", fontWeight: "700", color: "#2563EB", display: "block", marginBottom: "2px" }}>
                    {u.learnedWords}
                  </Text>
                  <Text style={{ fontSize: "11px", color: "#9CA3AF", display: "block" }}>已学</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// ---- Main ----
export default function AdminPage() {
  const router = useRouter();
  const initialTab = (router.params.tab as AdminSection) || "overview";

  const [section, setSection] = useState<AdminSection>(initialTab);
  const [libraries, setLibraries] = useState<WordLibrary[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [users, setUsers] = useState<{ id: string; username: string; phone: string; role: string; joinedAt: string; learnedWords: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** 全量加载数据 */
  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [libResult, wordResult, userList] = await Promise.all([
        fetchWordbanks({ pageSize: 100 }),
        fetchWords({ pageSize: 999 }),
        fetchUsers(),
      ]);
      setLibraries(libResult.libraries);
      setWords(wordResult.words);
      setUsers(userList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败，请检查网络连接");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  /** 将前端 Word 类型转换为后端 CreateWordInput 并调 API */
  const buildCreateInput = (w: Word) => ({
    word: w.word,
    wordbankId: w.libraryId,
    phonetic: w.phonetic,
    coreMeaning: w.coreMeaning,
    coreExampleEn: w.coreExampleSentence,
    coreExampleZh: w.coreExampleTranslation,
    physicalImageType: w.coreImageType,
    physicalImageDescription: w.coreImageDescription || `${w.word}的物理意象`,
    extendedMeanings: w.extendedMeanings.map((em) => ({
      evolutionDescription: em.logicalEvolution,
      meaning: em.meaning,
      partOfSpeech: mapPosToBackend(em.partOfSpeech),
      exampleEn: em.exampleSentence,
      exampleZh: em.exampleTranslation,
    })),
    collocations: w.collocations,
  });

  // ---- CRUD 方法 ----

  const addLib = async (d: Omit<WordLibrary, "id" | "createdAt">) => {
    try {
      await apiCreateWordbank({ name: d.name, description: d.description });
      Taro.showToast({ title: "词库已创建", icon: "success" });
      await loadAllData();
    } catch (e) {
      Taro.showToast({ title: e instanceof Error ? e.message : "创建失败", icon: "error" });
    }
  };

  const editLib = async (id: string, d: Partial<WordLibrary>) => {
    try {
      await apiUpdateWordbank(id, { name: d.name, description: d.description });
      Taro.showToast({ title: "词库已更新", icon: "success" });
      await loadAllData();
    } catch (e) {
      Taro.showToast({ title: e instanceof Error ? e.message : "更新失败", icon: "error" });
    }
  };

  const deleteLib = async (id: string) => {
    try {
      await apiDeleteWordbank(id);
      Taro.showToast({ title: "词库已删除", icon: "success" });
      await loadAllData();
    } catch (e) {
      Taro.showToast({ title: e instanceof Error ? e.message : "删除失败", icon: "error" });
    }
  };

  const addWord = async (w: Word) => {
    try {
      await apiCreateWord(buildCreateInput(w));
      Taro.showToast({ title: "单词已创建", icon: "success" });
      await loadAllData();
    } catch (e) {
      Taro.showToast({ title: e instanceof Error ? e.message : "创建失败", icon: "error" });
    }
  };

  const editWord = async (id: string, w: Word) => {
    try {
      await apiUpdateWord(id, buildCreateInput(w));
      Taro.showToast({ title: "单词已更新", icon: "success" });
      await loadAllData();
    } catch (e) {
      Taro.showToast({ title: e instanceof Error ? e.message : "更新失败", icon: "error" });
    }
  };

  const deleteWord = async (id: string) => {
    try {
      await apiDeleteWord(id);
      Taro.showToast({ title: "单词已删除", icon: "success" });
      await loadAllData();
    } catch (e) {
      Taro.showToast({ title: e instanceof Error ? e.message : "删除失败", icon: "error" });
    }
  };

  // Loading / Error
  if (loading) {
    return (
      <View style={{ minHeight: "100vh", background: BG, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <Icon name="refresh" size={24} color="#9CA3AF" />
        <Text style={{ fontSize: "15px", color: "#9CA3AF", marginTop: "12px", display: "block" }}>
          加载中...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ minHeight: "100vh", background: BG, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
        <Text style={{ fontSize: "15px", color: "#DC2626", textAlign: "center", display: "block", marginBottom: "20px" }}>
          {error}
        </Text>
        <View onClick={loadAllData}
          style={{ padding: "12px 32px", background: "#2563EB", color: "#fff", borderRadius: "20px",
            fontSize: "14px", fontWeight: "600" }}>
          <Text style={{ color: "#fff" }}>重试</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif", minHeight: "100vh", background: BG }}>
      {section === "overview" && (
        <Overview libraries={libraries} words={words} users={users}
          onNavigate={setSection}
          onExit={() => Taro.redirectTo({ url: "/pages/profile/index" })} />
      )}
      {section === "libraries" && (
        <LibraryManager libraries={libraries} words={words}
          onAdd={addLib} onEdit={editLib} onDelete={deleteLib}
          onBack={() => setSection("overview")} />
      )}
      {section === "words" && (
        <WordManager words={words} libraries={libraries}
          onAdd={addWord} onEdit={editWord} onDelete={deleteWord}
          onBack={() => setSection("overview")} />
      )}
      {section === "users" && (
        <UserManager users={users} onBack={() => setSection("overview")} />
      )}
    </View>
  );
}
