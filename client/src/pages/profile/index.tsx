import { useState, useEffect } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import type { AuthUser, Word } from "../../data/types";
import {
  getGlobalUser,
  onUserChange,
  logout,
} from "../../hooks/useAuth";
import { fetchUserStats, fetchFavorites, type UserStats } from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { Icon } from "../../components/Icon";
import { CustomTabBar } from "../../components/CustomTabBar";

// 收藏列表视图（内嵌在 profile 页面中）
function FavoritesView({ onBack }: { onBack: () => void }) {
  const [favs, setFavs] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites({ pageSize: 50 })
      .then((res) => setFavs(res.data))
      .catch(() => Taro.showToast({ title: "加载失败", icon: "none" }))
      .finally(() => setLoading(false));
  }, []);

  const BG = "#F7F9FC";
  const CARD = {
    background: "#fff",
    borderRadius: "20px",
    boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
  };

  if (loading) {
    return (
      <View style={{ minHeight: "100vh", background: BG }}>
        <PageHeader showBack backLabel="个人中心" title="我的收藏" onBack={onBack} bgColor="rgba(247,249,252,0.94)" sticky />
        <View style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <Icon name="refresh" size={24} color="#9CA3AF" />
          <Text style={{ fontSize: "15px", color: "#9CA3AF", marginTop: "12px", display: "block" }}>加载中...</Text>
        </View>
        <CustomTabBar activeTab="profile" />
      </View>
    );
  }

  return (
    <View style={{ minHeight: "100vh", background: BG }}>
      <PageHeader showBack backLabel="个人中心" title="我的收藏" onBack={onBack} bgColor="rgba(247,249,252,0.94)" sticky />
      <View style={{ padding: "8px 24px 40px" }}>
        {favs.length === 0 ? (
          <View style={{ textAlign: "center", padding: "64px 0", color: "#9CA3AF" }}>
            <Icon name="star" size={32} color="rgba(156,163,175,0.3)" />
            <Text style={{ fontSize: "14px", display: "block", marginTop: "12px" }}>暂无收藏，去词库看看吧</Text>
          </View>
        ) : (
          <View style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {favs.map((word) => (
              <View key={word.id} onClick={() => Taro.navigateTo({ url: `/pages/word-detail/index?wordId=${word.id}` })}
                style={{ ...CARD, padding: "16px 20px" }}>
                <View style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "4px" }}>
                  <Text style={{ fontSize: "18px", fontWeight: "700", color: "#111827" }}>{word.word}</Text>
                  <Text style={{ fontSize: "12px", color: "#9CA3AF" }}>{word.phonetic}</Text>
                </View>
                <Text style={{ fontSize: "12px", color: "#6B7280", display: "block",
                  lineHeight: "1.5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {word.coreMeaning}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <CustomTabBar activeTab="profile" />
    </View>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(getGlobalUser());
  const [stats, setStats] = useState<UserStats | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    const unsub = onUserChange((u) => setUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserStats()
        .then((s) => setStats(s))
        .catch(() => {
          // 静默失败，保持旧 UI
        });
    }
  }, [user]);

  const handleLogout = () => {
    Taro.showModal({
      title: "退出登录",
      content: "确定要退出登录吗？",
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: "已退出", icon: "success" });
          setTimeout(() => {
            logout();
          }, 800);
        }
      },
    });
  };

  // Not logged in
  if (!user) {
    return (
      <View style={{ minHeight: "100vh", background: "#F7F9FC" }}>
        <PageHeader subtitle="我的" title="个人中心" />

        <View
          style={{
            padding: "40px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "#F1F5F9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "24px",
            }}
          >
            <Icon name="user" size={36} color="#CBD5E1" />
          </View>
          <Text
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#374151",
              display: "block",
              marginBottom: "8px",
            }}
          >
            登录后开始学习
          </Text>
          <Text
            style={{
              fontSize: "14px",
              color: "#9CA3AF",
              textAlign: "center",
              lineHeight: "1.6",
              display: "block",
              marginBottom: "36px",
            }}
          >
            登录账号，追踪学习进度{"\n"}解锁完整词库内容
          </Text>
          <View
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              width: "100%",
              maxWidth: "280px",
            }}
          >
            <View
              onClick={() =>
                Taro.navigateTo({ url: "/pages/auth/index?mode=login" })
              }
              style={{
                padding: "16px",
                background: "#2563EB",
                color: "#fff",
                borderRadius: "16px",
                fontSize: "16px",
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              <Text style={{ color: "#fff" }}>登录</Text>
            </View>
            <View
              onClick={() =>
                Taro.navigateTo({ url: "/pages/auth/index?mode=register" })
              }
              style={{
                padding: "16px",
                background: "#fff",
                color: "#2563EB",
                border: "1.5px solid #BFDBFE",
                borderRadius: "16px",
                fontSize: "16px",
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              <Text style={{ color: "#2563EB" }}>注册新账号</Text>
            </View>
          </View>
        </View>

        <CustomTabBar activeTab="profile" />
      </View>
    );
  }

  const isAdmin = user.role === "admin";

  if (showFavorites) {
    return <FavoritesView onBack={() => setShowFavorites(false)} />;
  }

  return (
    <View style={{ minHeight: "100vh", background: "#F7F9FC" }}>
      <PageHeader subtitle="我的" title="个人中心" />

      <View style={{ padding: "20px 24px" }}>
        {/* User card */}
        <View
          style={{
            background: isAdmin
              ? "linear-gradient(135deg, #4C1D95, #7C3AED)"
              : "linear-gradient(135deg, #1D4ED8, #2563EB)",
            borderRadius: "24px",
            padding: "24px",
            marginBottom: "20px",
            color: "#fff",
            boxShadow: isAdmin
              ? "0 8px 32px rgba(124,58,237,0.25)"
              : "0 8px 32px rgba(37,99,235,0.25)",
          }}
        >
          <View style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <View
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="user" size={24} color="#fff" />
            </View>
            <View>
              <Text
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#fff",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                {user.username}
              </Text>
              <Text
                style={{
                  fontSize: "13px",
                  opacity: "0.75",
                  color: "#fff",
                  display: "block",
                }}
              >
                {user.phone}
              </Text>
              <Text
                style={{
                  display: "inline-block",
                  marginTop: "6px",
                  fontSize: "11px",
                  background: "rgba(255,255,255,0.2)",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  letterSpacing: "0.5px",
                  color: "#fff",
                }}
              >
                {isAdmin ? "管理员" : "普通用户"}
              </Text>
            </View>
          </View>
        </View>

        {/* Admin entry or user stats */}
        {isAdmin ? (
          <View style={{ marginBottom: "16px" }}>
            <View
              onClick={() =>
                Taro.navigateTo({ url: "/pages/admin/index?tab=overview" })
              }
              style={{
                padding: "20px 24px",
                background: "#fff",
                borderRadius: "20px",
                boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View
                style={{ display: "flex", alignItems: "center", gap: "14px" }}
              >
                <View
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "#FAF5FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="shield" size={20} color="#7C3AED" />
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#111827",
                      display: "block",
                      marginBottom: "2px",
                    }}
                  >
                    管理后台
                  </Text>
                  <Text
                    style={{
                      fontSize: "12px",
                      color: "#9CA3AF",
                      display: "block",
                    }}
                  >
                    词库、单词与用户管理
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={18} color="#D1D5DB" />
            </View>
          </View>
        ) : (
          <View
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            {[
              {
                icon: "book",
                label: "已学单词",
                value: stats ? `${stats.totalWordsLearned} 个` : "--",
                color: "#2563EB",
                bg: "#EFF6FF",
              },
              {
                icon: "target",
                label: "今日已学",
                value: stats ? `${stats.todayLearnedCount} 个` : "--",
                color: "#16A34A",
                bg: "#F0FDF4",
              },
            ].map((item, i) => (
              <View
                key={i}
                style={{
                  background: "#fff",
                  borderRadius: "20px",
                  padding: "20px",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                }}
              >
                <View
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: item.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "10px",
                  }}
                >
                  <Icon name={item.icon as any} size={18} color={item.color} />
                </View>
                <Text
                  style={{
                    fontSize: "12px",
                    color: "#9CA3AF",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  {item.label}
                </Text>
                <Text
                  style={{
                    fontSize: "15px",
                    fontWeight: "600",
                    color: "#111827",
                    display: "block",
                  }}
                >
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Favorites entry (for all users) */}
        <View style={{ marginBottom: "14px" }}>
          <View
            onClick={() => setShowFavorites(true)}
            style={{
              padding: "20px 24px",
              background: "#fff",
              borderRadius: "20px",
              boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <View style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: "#FEF3C7",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="star" size={20} color="#EAB308" />
              </View>
              <View>
                <Text style={{ fontSize: "16px", fontWeight: "600", color: "#111827", display: "block", marginBottom: "2px" }}>
                  我的收藏
                </Text>
                <Text style={{ fontSize: "12px", color: "#9CA3AF", display: "block" }}>
                  收藏的单词列表
                </Text>
              </View>
            </View>
            <Icon name="chevron-right" size={18} color="#D1D5DB" />
          </View>
        </View>

        {/* Settings */}
        <View
          style={{
            background: "#fff",
            borderRadius: "20px",
            overflow: "hidden",
            marginBottom: "14px",
            boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
          }}
        >
          <View
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "16px 20px",
            }}
          >
            <View
              style={{ display: "flex", alignItems: "center", gap: "12px" }}
            >
              <View
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "#F3F4F6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="settings" size={16} />
              </View>
              <Text
                style={{
                  fontSize: "15px",
                  color: "#374151",
                  fontWeight: "500",
                }}
              >
                设置
              </Text>
            </View>
            <Icon name="chevron-right" size={16} color="#D1D5DB" />
          </View>
        </View>

        {/* Logout */}
        <View
          onClick={handleLogout}
          style={{
            padding: "16px",
            background: "#FEF2F2",
            color: "#DC2626",
            borderRadius: "16px",
            fontSize: "15px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <Icon name="logout" size={16} color="#DC2626" />
          <Text style={{ color: "#DC2626" }}>退出登录</Text>
        </View>
      </View>

      <CustomTabBar activeTab="profile" />
    </View>
  );
}
