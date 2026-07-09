import { useState, useEffect, useRef } from "react";
import { View, Text } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import type { Word, WordLibrary } from "../../data/types";
import {
  fetchWordDetail,
  fetchWordbanks,
  ApiRequestError,
  recordLearn,
  favoriteWord,
  unfavoriteWord,
} from "../../api";
import { getGlobalUser } from "../../hooks/useAuth";
import { PhysicalImage } from "../../components/PhysicalImage";
import { PageHeader } from "../../components/PageHeader";
import { Icon } from "../../components/Icon";
import { CustomTabBar } from "../../components/CustomTabBar";

const POS_COLORS: Record<string, { bg: string; text: string }> = {
  "n.": { bg: "#EFF6FF", text: "#1D4ED8" },
  "v.": { bg: "#F0FDF4", text: "#166534" },
  "adj.": { bg: "#FFF7ED", text: "#C2410C" },
  "adv.": { bg: "#FAF5FF", text: "#7E22CE" },
  "v./n.": { bg: "#ECFDF5", text: "#065F46" },
  "adj./adv.": { bg: "#FFF1F2", text: "#9F1239" },
};

function EvolutionArrow() {
  return (
    <View style={{ display: "flex", alignItems: "center", gap: "6px", margin: "12px 0 10px" }}>
      <View style={{ height: "1px", flex: 1, background: "linear-gradient(to right, #E5E7EB, #2563EB)" }} />
      <Icon name="chevron-right" size={14} color="#2563EB" />
    </View>
  );
}

export default function WordDetailPage() {
  const router = useRouter();
  const wordId = router.params.wordId as string;

  const [word, setWord] = useState<Word | null>(null);
  const [library, setLibrary] = useState<WordLibrary | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const learnedRef = useRef<string | null>(null);

  const loadWord = async () => {
    if (!wordId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const w = await fetchWordDetail(wordId);
      setWord(w);
      setIsFavorited(w.isFavorited);
      // 获取词库名
      try {
        const { libraries } = await fetchWordbanks({ pageSize: 100 });
        setLibrary(libraries.find((l) => l.id === w.libraryId) || null);
      } catch {
        // 词库获取失败不影响详情展示
      }
      // 自动记录学习（去重）
      if (learnedRef.current !== wordId) {
        learnedRef.current = wordId;
        recordLearn(wordId).catch(() => {
          // 静默忽略——学习记录失败不影响浏览
        });
      }
    } catch (e) {
      if (e instanceof ApiRequestError && e.statusCode === 404) {
        setNotFound(true);
      } else {
        setError(e instanceof Error ? e.message : "加载失败，请检查网络连接");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWord();
  }, [wordId]);

  const handleToggleFavorite = async () => {
    if (favLoading) return;
    const loggedIn = !!getGlobalUser();
    if (!loggedIn) {
      Taro.showToast({ title: "请先登录", icon: "none" });
      setTimeout(() => {
        Taro.navigateTo({ url: "/pages/auth/index?mode=login" });
      }, 800);
      return;
    }
    setFavLoading(true);
    try {
      if (isFavorited) {
        await unfavoriteWord(wordId);
        setIsFavorited(false);
        Taro.showToast({ title: "已取消收藏", icon: "success" });
      } else {
        await favoriteWord(wordId);
        setIsFavorited(true);
        Taro.showToast({ title: "已收藏", icon: "success" });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "操作失败";
      Taro.showToast({ title: msg, icon: "none" });
    } finally {
      setFavLoading(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <View style={{ minHeight: "100vh", background: "#F7F9FC" }}>
        <PageHeader showBack backLabel="返回" sticky compact bgColor="rgba(247,249,252,0.92)" />
        <View
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "70vh",
            color: "#9CA3AF",
          }}
        >
          <Icon name="refresh" size={24} color="#9CA3AF" />
          <Text style={{ fontSize: "15px", marginTop: "12px", display: "block" }}>
            加载中...
          </Text>
        </View>
        <CustomTabBar activeTab="home" />
      </View>
    );
  }

  // 404
  if (notFound || !word) {
    return (
      <View style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", color: "#6B7280" }}>
        <Text style={{ display: "block" }}>单词不存在</Text>
        <View
          onClick={() => Taro.redirectTo({ url: "/pages/home/index" })}
          style={{ marginTop: "12px", color: "#2563EB" }}
        >
          <Text>返回首页</Text>
        </View>
      </View>
    );
  }

  // Error
  if (error) {
    return (
      <View style={{ minHeight: "100vh", background: "#F7F9FC" }}>
        <PageHeader showBack backLabel="返回" sticky compact bgColor="rgba(247,249,252,0.92)" />
        <View
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "70vh",
            padding: "0 24px",
          }}
        >
          <Text
            style={{
              fontSize: "15px",
              color: "#DC2626",
              textAlign: "center",
              display: "block",
              marginBottom: "20px",
            }}
          >
            {error}
          </Text>
          <View
            onClick={loadWord}
            style={{
              padding: "12px 32px",
              background: "#2563EB",
              color: "#fff",
              borderRadius: "20px",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            <Text style={{ color: "#fff" }}>重试</Text>
          </View>
        </View>
        <CustomTabBar activeTab="home" />
      </View>
    );
  }

  return (
    <View style={{ minHeight: "100vh", background: "#F7F9FC" }}>
      {/* Top bar */}
      <PageHeader
        showBack
        backLabel="返回"
        sticky
        compact
        bgColor="rgba(247,249,252,0.92)"
        right={library ? (
          <Text style={{
            fontSize: "11px",
            color: "#2563EB",
            background: "#EFF6FF",
            padding: "4px 12px",
            borderRadius: "20px",
            letterSpacing: "0.3px",
          }}>
            {library.name}
          </Text>
        ) : undefined}
      />

      <View style={{ padding: "8px 24px 40px" }}>
        {/* Word heading */}
        <View style={{ marginBottom: "24px" }}>
          <View style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "4px" }}>
            <Text style={{ fontSize: "42px", fontWeight: "800", color: "#111827", display: "block", letterSpacing: "-1px", lineHeight: "1.1" }}>
              {word.word}
            </Text>
            <View onClick={handleToggleFavorite} style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: isFavorited ? "#FEF3C7" : "#F9FAFB",
              flexShrink: 0,
              marginLeft: "12px",
              opacity: favLoading ? 0.6 : 1,
            }}>
              <Icon name="star" size={20} color={isFavorited ? "#EAB308" : "#D1D5DB"} />
            </View>
          </View>
          <Text style={{ fontSize: "16px", color: "#9CA3AF", display: "block", letterSpacing: "0.5px" }}>
            {word.phonetic}
          </Text>
        </View>

        {/* Physical image */}
        <View style={{ marginBottom: "24px" }}>
          <Text style={{ fontSize: "11px", fontWeight: "600", color: "#9CA3AF", letterSpacing: "2px", textTransform: "uppercase", display: "block", marginBottom: "12px" }}>
            物理意象
          </Text>
          <View style={{
            borderRadius: "24px",
            overflow: "hidden",
            boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
          }}>
            <PhysicalImage type={word.coreImageType} />
          </View>
        </View>

        {/* Core meaning */}
        <View style={{
          background: "#fff",
          borderRadius: "24px",
          padding: "24px",
          marginBottom: "16px",
          boxShadow: "0 2px 20px rgba(0,0,0,0.05)",
        }}>
          <Text style={{ fontSize: "11px", fontWeight: "600", color: "#9CA3AF", letterSpacing: "2px", textTransform: "uppercase", display: "block", marginBottom: "12px" }}>
            核心义
          </Text>
          <Text style={{ fontSize: "16px", color: "#111827", lineHeight: "1.7", display: "block", marginBottom: "20px", fontWeight: "500" }}>
            {word.coreMeaning}
          </Text>
          <View style={{
            padding: "16px 18px",
            background: "#F8FAFC",
            borderRadius: "14px",
            borderLeft: "3px solid #2563EB",
          }}>
            <Text style={{ fontSize: "15px", color: "#1D4ED8", display: "block", marginBottom: "6px", fontStyle: "italic", lineHeight: "1.6" }}>
              {word.coreExampleSentence}
            </Text>
            <Text style={{ fontSize: "13px", color: "#6B7280", display: "block", lineHeight: "1.6" }}>
              {word.coreExampleTranslation}
            </Text>
          </View>
        </View>

        {/* Extended meanings */}
        <View style={{ marginBottom: "16px" }}>
          <Text style={{ fontSize: "11px", fontWeight: "600", color: "#9CA3AF", letterSpacing: "2px", textTransform: "uppercase", display: "block", marginBottom: "12px" }}>
            引申义演化
          </Text>
          <View style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {word.extendedMeanings.map((ext, index) => (
              <View
                key={ext.id}
                style={{
                  background: "#fff",
                  borderRadius: "20px",
                  padding: "20px",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
                }}
              >
                {/* Evolution logic */}
                <View style={{
                  padding: "10px 14px",
                  background: "#F8FAFC",
                  borderRadius: "10px",
                  marginBottom: "14px",
                }}>
                  <Text style={{ fontSize: "12px", color: "#6B7280", display: "block", lineHeight: "1.6" }}>
                    <Text style={{ color: "#9CA3AF", marginRight: "6px" }}>{index + 1}.</Text>
                    {ext.logicalEvolution}
                  </Text>
                </View>

                <EvolutionArrow />

                {/* Meaning */}
                <View style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "14px" }}>
                  <Text style={{ fontSize: "16px", fontWeight: "600", color: "#111827", display: "block", lineHeight: "1.5", flex: 1 }}>
                    {ext.meaning}
                  </Text>
                  <Text style={{
                    flexShrink: 0,
                    fontSize: "11px",
                    padding: "3px 10px",
                    borderRadius: "20px",
                    fontWeight: "500",
                    background: (POS_COLORS[ext.partOfSpeech] || { bg: "#F3F4F6", text: "#6B7280" }).bg,
                    color: (POS_COLORS[ext.partOfSpeech] || { bg: "#F3F4F6", text: "#6B7280" }).text,
                  }}>
                    {ext.partOfSpeech}
                  </Text>
                </View>

                {/* Example */}
                <View style={{
                  padding: "14px 16px",
                  background: "#F8FAFC",
                  borderRadius: "12px",
                  borderLeft: "3px solid #10B981",
                }}>
                  <Text style={{ fontSize: "14px", color: "#065F46", display: "block", marginBottom: "6px", fontStyle: "italic", lineHeight: "1.6" }}>
                    {ext.exampleSentence}
                  </Text>
                  <Text style={{ fontSize: "13px", color: "#6B7280", display: "block", lineHeight: "1.6" }}>
                    {ext.exampleTranslation}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Collocations */}
        <View style={{
          background: "#fff",
          borderRadius: "24px",
          padding: "24px",
          boxShadow: "0 2px 20px rgba(0,0,0,0.05)",
        }}>
          <Text style={{ fontSize: "11px", fontWeight: "600", color: "#9CA3AF", letterSpacing: "2px", textTransform: "uppercase", display: "block", marginBottom: "16px" }}>
            常见搭配
          </Text>
          <View style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {word.collocations.map((col, i) => (
              <Text
                key={i}
                style={{
                  padding: "8px 14px",
                  background: "#F1F5F9",
                  borderRadius: "12px",
                  fontSize: "14px",
                  color: "#374151",
                  fontStyle: "italic",
                  lineHeight: "1",
                }}
              >
                {col}
              </Text>
            ))}
          </View>
        </View>
      </View>

      <CustomTabBar activeTab="home" />
    </View>
  );
}
