import { useState, useEffect } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import type { WordLibrary } from "../../data/types";
import { fetchWordbanks, fetchWords } from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { Icon } from "../../components/Icon";
import { CustomTabBar } from "../../components/CustomTabBar";

export default function LibrariesPage() {
  const libraryColors = [
    { bg: "linear-gradient(135deg, #EFF6FF, #DBEAFE)", accent: "#2563EB", border: "#BFDBFE" },
    { bg: "linear-gradient(135deg, #F0FDF4, #DCFCE7)", accent: "#16A34A", border: "#BBF7D0" },
    { bg: "linear-gradient(135deg, #FFF7ED, #FED7AA)", accent: "#D97706", border: "#FDE68A" },
    { bg: "linear-gradient(135deg, #FAF5FF, #EDE9FE)", accent: "#7C3AED", border: "#DDD6FE" },
  ];

  const [libraries, setLibraries] = useState<WordLibrary[]>([]);
  const [wordCounts, setWordCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [libResult, wordResult] = await Promise.all([
        fetchWordbanks({ pageSize: 100 }),
        fetchWords({ pageSize: 999 }),
      ]);
      setLibraries(libResult.libraries);
      const counts: Record<string, number> = {};
      wordResult.words.forEach((w) => {
        counts[w.libraryId] = (counts[w.libraryId] || 0) + 1;
      });
      setWordCounts(counts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败，请检查网络连接");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const goToLibraryWords = (libraryId: string) => {
    Taro.navigateTo({ url: `/pages/library-words/index?libraryId=${libraryId}` });
  };

  // Loading
  if (loading) {
    return (
      <View style={{ minHeight: "100vh", background: "#F7F9FC" }}>
        <PageHeader subtitle="词库" title="选择词库" />
        <View
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
            color: "#9CA3AF",
          }}
        >
          <Icon name="refresh" size={24} color="#9CA3AF" />
          <Text style={{ fontSize: "15px", marginTop: "12px", display: "block" }}>
            加载中...
          </Text>
        </View>
        <CustomTabBar activeTab="libraries" />
      </View>
    );
  }

  // Error
  if (error) {
    return (
      <View style={{ minHeight: "100vh", background: "#F7F9FC" }}>
        <PageHeader subtitle="词库" title="选择词库" />
        <View
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
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
            onClick={loadData}
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
        <CustomTabBar activeTab="libraries" />
      </View>
    );
  }

  return (
    <View style={{ minHeight: "100vh", background: "#F7F9FC" }}>
      <PageHeader subtitle="词库" title="选择词库" />

      <View style={{ padding: "20px 24px" }}>
        {libraries.length === 0 ? (
          <View
            style={{
              textAlign: "center",
              padding: "60px 0",
              color: "#9CA3AF",
            }}
          >
            <View style={{ opacity: 0.4 }}>
              <Icon name="book" size={32} color="#9CA3AF" />
            </View>
            <Text style={{ fontSize: "15px", display: "block" }}>
              暂无词库
            </Text>
          </View>
        ) : (
          <View style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {libraries.map((lib, index) => {
              const color = libraryColors[index % libraryColors.length];
              const count = wordCounts[lib.id] ?? lib.wordCount;

              return (
                <View
                  key={lib.id}
                  onClick={() => goToLibraryWords(lib.id)}
                  style={{
                    background: color.bg,
                    border: `1px solid ${color.border}`,
                    borderRadius: "24px",
                    padding: "24px",
                    boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
                  }}
                >
                  <View style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                        <View style={{
                          width: "36px", height: "36px", borderRadius: "10px",
                          background: "rgba(255,255,255,0.7)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Icon name="book" size={18} color={color.accent} />
                        </View>
                        <Text style={{ fontSize: "17px", fontWeight: "700", color: "#111827" }}>
                          {lib.name}
                        </Text>
                      </View>
                      <Text style={{ fontSize: "13px", color: "#6B7280", lineHeight: "1.6", display: "block", marginBottom: "16px" }}>
                        {lib.description}
                      </Text>
                      <View style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <View style={{ display: "flex", gap: "16px" }}>
                          <Text style={{ fontSize: "12px", color: color.accent, fontWeight: "600" }}>
                            {count} 个单词
                          </Text>
                        </View>
                        <Icon name="chevron-right" size={16} color={color.accent} />
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <CustomTabBar activeTab="libraries" />
    </View>
  );
}
