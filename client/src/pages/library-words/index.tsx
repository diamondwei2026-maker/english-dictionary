import { useState, useEffect } from "react";
import { View, Text } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import type { Word, WordLibrary } from "../../data/types";
import { fetchWordbankById, fetchWordsByWordbank, ApiRequestError } from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { Icon } from "../../components/Icon";
import { CustomTabBar } from "../../components/CustomTabBar";

export default function LibraryWordsPage() {
  const router = useRouter();
  const libraryId = router.params.libraryId as string;

  const [library, setLibrary] = useState<WordLibrary | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [totalWords, setTotalWords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!libraryId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const [lib, wordResult] = await Promise.all([
        fetchWordbankById(libraryId),
        fetchWordsByWordbank(libraryId, { pageSize: 200 }),
      ]);
      setLibrary(lib);
      setWords(wordResult.words);
      setTotalWords(wordResult.total);
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
    loadData();
  }, [libraryId]);

  const goToWordDetail = (wordId: string) => {
    Taro.navigateTo({ url: `/pages/word-detail/index?wordId=${wordId}` });
  };

  // Loading
  if (loading) {
    return (
      <View style={{ minHeight: "100vh", background: "#F7F9FC" }}>
        <PageHeader showBack backLabel="词库列表" title={library?.name} />
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

  // 404
  if (notFound) {
    return (
      <View style={{ minHeight: "100vh", background: "#F7F9FC" }}>
        <PageHeader showBack backLabel="词库列表" title="词库" />
        <View
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
            color: "#6B7280",
          }}
        >
          <Text style={{ fontSize: "15px", display: "block" }}>
            词库不存在
          </Text>
          <View
            onClick={() => Taro.navigateTo({ url: "/pages/libraries/index" })}
            style={{ marginTop: "12px", color: "#2563EB" }}
          >
            <Text>返回词库列表</Text>
          </View>
        </View>
        <CustomTabBar activeTab="libraries" />
      </View>
    );
  }

  // Error
  if (error) {
    return (
      <View style={{ minHeight: "100vh", background: "#F7F9FC" }}>
        <PageHeader showBack backLabel="词库列表" title={library?.name} />
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
      <PageHeader
        showBack
        backLabel="词库列表"
        title={library?.name}
      >
        <Text style={{ fontSize: "13px", color: "#9CA3AF", display: "block", marginTop: "4px" }}>
          {totalWords} 个单词
        </Text>
      </PageHeader>

      <View style={{ padding: "16px 24px" }}>
        {words.length === 0 ? (
          <View style={{ textAlign: "center", padding: "60px 0", color: "#9CA3AF" }}>
            <View style={{ opacity: 0.4 }}>
              <Icon name="book" size={32} color="#9CA3AF" />
            </View>
            <Text style={{ fontSize: "15px", display: "block" }}>该词库暂无单词</Text>
          </View>
        ) : (
          <View style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {words.map((word) => (
              <View
                key={word.id}
                onClick={() => goToWordDetail(word.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  background: "#fff",
                  borderRadius: "16px",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                }}
              >
                <View>
                  <View style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "4px" }}>
                    <Text style={{ fontSize: "17px", fontWeight: "700", color: "#111827" }}>{word.word}</Text>
                    <Text style={{ fontSize: "12px", color: "#9CA3AF" }}>{word.phonetic}</Text>
                  </View>
                  <Text style={{ fontSize: "13px", color: "#6B7280", lineHeight: "1.5", display: "block" }}>
                    {word.coreMeaning.slice(0, 40)}...
                  </Text>
                </View>
                <Icon name="chevron-right" size={15} color="#D1D5DB" />
              </View>
            ))}
          </View>
        )}
      </View>

      <CustomTabBar activeTab="libraries" />
    </View>
  );
}
