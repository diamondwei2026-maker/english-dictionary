import { useState } from "react";
import { View, Text, Input } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { setGlobalUser, setToken } from "../../hooks/useAuth";
import { login, register } from "../../api/auth";
import type { ApiRequestError } from "../../api/request";
import { navigateBack } from "../../hooks/useNavigate";
import { Icon } from "../../components/Icon";
import { CustomTabBar } from "../../components/CustomTabBar";

type AuthMode = "login" | "register";

function isValidPhone(p: string) {
  return /^1[3-9]\d{9}$/.test(p.replace(/\s/g, ""));
}

export default function AuthPage() {
  const router = useRouter();
  const initialMode: AuthMode = (router.params.mode as AuthMode) || "login";
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // ─── Shared form state ───────────────────────────────────────
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [pwdFocused, setPwdFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  const isLogin = mode === "login";

  const handleSubmit = async () => {
    setError("");
    const cleanPhone = phone.replace(/\s/g, "");

    // --- 前端校验 ---
    if (!cleanPhone || !password) {
      setError("请填写所有必填字段");
      return;
    }
    if (!isValidPhone(cleanPhone)) {
      setError("请输入有效的手机号");
      return;
    }
    if (!isLogin) {
      if (!username.trim()) {
        setError("请填写用户名");
        return;
      }
      if (password.length < 6) {
        setError("密码至少需要6位");
        return;
      }
      if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
        setError("密码必须包含字母和数字");
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        // 登录 — POST /api/v1/auth/login
        const result = await login({ phone: cleanPhone, password });
        setToken(result.token);
        setGlobalUser({
          id: result.id,
          username: result.username,
          phone: result.phone,
          role: result.role,
        });
        Taro.showToast({ title: "登录成功", icon: "success", duration: 1200 });
        setTimeout(() => {
          if (result.role === "admin") {
            Taro.redirectTo({ url: "/pages/admin/index?tab=overview" });
          } else {
            Taro.redirectTo({ url: "/pages/profile/index" });
          }
        }, 1300);
      } else {
        // 注册 — POST /api/v1/auth/register
        await register({
          phone: cleanPhone,
          password,
          username: username.trim(),
        });
        Taro.showToast({ title: "注册成功", icon: "success", duration: 1200 });
        setTimeout(() => {
          setMode("login");
          setPhone("");
          setPassword("");
          setUsername("");
        }, 1300);
      }
    } catch (err) {
      const apiErr = err as ApiRequestError;
      setError(
        apiErr?.message ||
          (isLogin ? "登录失败，请稍后重试" : "注册失败，请稍后重试"),
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── Style tokens ────────────────────────────────────────────
  const inputBase = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1.5px solid #E5E7EB",
    background: "#fff",
    fontSize: "16px",
    color: "#111827",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  const title = isLogin ? "欢迎回来" : "创建账号";
  const subtitle = isLogin
    ? "登录继续你的认知英语学习"
    : "开始用物理意象理解英语";
  const btnLabel = isLogin ? "登录" : "创建账号";
  const loadingLabel = "处理中...";

  return (
    <View
      style={{
        minHeight: "100vh",
        background: "#F7F9FC",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Back button */}
      <View style={{ padding: "52px 24px 0" }}>
        <View
          onClick={() => navigateBack()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "#6B7280",
            fontSize: "14px",
            padding: "6px 0",
          }}
        >
          <Text>← 返回</Text>
        </View>
      </View>

      <View
        style={{
          flex: 1,
          padding: "32px 24px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Logo */}
        <View style={{ marginBottom: "36px" }}>
          <View
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #1D4ED8, #3B82F6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
              boxShadow: "0 4px 16px rgba(37,99,235,0.3)",
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: "22px",
                fontWeight: "800",
                fontStyle: "italic",
              }}
            >
              E
            </Text>
          </View>
          <Text
            style={{
              fontSize: "26px",
              fontWeight: "800",
              color: "#111827",
              display: "block",
              marginBottom: "6px",
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: "14px",
              color: "#9CA3AF",
              display: "block",
              lineHeight: "1.6",
            }}
          >
            {subtitle}
          </Text>
        </View>

        {/* Tab switcher — no redirectTo, pure useState */}
        <View
          style={{
            display: "flex",
            background: "#F1F5F9",
            borderRadius: "12px",
            padding: "4px",
            marginBottom: "28px",
          }}
        >
          <View
            onClick={() => {
              setMode("login");
              setError("");
            }}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              background: isLogin ? "#fff" : "transparent",
              boxShadow: isLogin ? "0 1px 4px rgba(0,0,0,0.08)" : undefined,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: isLogin ? "#111827" : "#9CA3AF",
              }}
            >
              登录
            </Text>
          </View>
          <View
            onClick={() => {
              setMode("register");
              setError("");
            }}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              background: !isLogin ? "#fff" : "transparent",
              boxShadow: !isLogin ? "0 1px 4px rgba(0,0,0,0.08)" : undefined,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: !isLogin ? "#111827" : "#9CA3AF",
              }}
            >
              注册
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Username — register only */}
          {!isLogin && (
            <View>
              <Text
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                用户名
              </Text>
              <Input
                value={username}
                onInput={(e) => setUsername(e.detail.value)}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                placeholder="输入你的名字"
                style={{
                  ...inputBase,
                  border: nameFocused
                    ? "1.5px solid #2563EB"
                    : "1.5px solid #E5E7EB",
                  background: nameFocused ? "#fff" : "#fff",
                }}
              />
            </View>
          )}

          {/* Phone */}
          <View>
            <Text
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              手机号
            </Text>
            <View style={{ position: "relative" }}>
              <Text
                style={{
                  position: "absolute",
                  left: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "15px",
                  color: "#6B7280",
                  fontWeight: "500",
                  zIndex: 1,
                }}
              >
                +86
              </Text>
              <Input
                type="number"
                value={phone}
                onInput={(e) => setPhone(e.detail.value)}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
                placeholder="请输入手机号"
                maxlength={11}
                style={{
                  ...inputBase,
                  paddingLeft: "52px",
                  border: phoneFocused
                    ? "1.5px solid #2563EB"
                    : "1.5px solid #E5E7EB",
                }}
              />
            </View>
          </View>

          {/* Password */}
          <View>
            <Text
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              密码
            </Text>
            <View style={{ position: "relative" }}>
              <Input
                password={!showPassword}
                value={password}
                onInput={(e) => setPassword(e.detail.value)}
                onFocus={() => setPwdFocused(true)}
                onBlur={() => setPwdFocused(false)}
                onConfirm={handleSubmit}
                placeholder={isLogin ? "输入密码" : "至少6位，包含字母和数字"}
                style={{
                  ...inputBase,
                  paddingRight: "48px",
                  border: pwdFocused
                    ? "1.5px solid #2563EB"
                    : "1.5px solid #E5E7EB",
                }}
              />
              <View
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute",
                  right: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9CA3AF",
                  padding: "0",
                  fontSize: "16px",
                }}
              >
                {showPassword ? (
                  <Icon name="eye-off" size={16} color="#9CA3AF" />
                ) : (
                  <Icon name="eye" size={16} color="#9CA3AF" />
                )}
              </View>
            </View>
          </View>

          {error ? (
            <Text
              style={{
                fontSize: "13px",
                color: "#DC2626",
                background: "#FEF2F2",
                padding: "10px 14px",
                borderRadius: "10px",
              }}
            >
              {error}
            </Text>
          ) : null}

          <View style={{ marginTop: "8px" }}>
            <View
              onClick={handleSubmit}
              style={{
                padding: "16px",
                background: loading ? "#93C5FD" : "#2563EB",
                color: "#fff",
                borderRadius: "16px",
                fontSize: "16px",
                fontWeight: "700",
                textAlign: "center",
                letterSpacing: "0.3px",
              }}
            >
              <Text style={{ color: "#fff" }}>
                {loading ? loadingLabel : btnLabel}
              </Text>
            </View>
          </View>
        </View>

        {/* Demo hint — login only */}
        {/* {isLogin && (
          <View
            style={{
              marginTop: "20px",
              padding: "14px 16px",
              background: "#FFFBEB",
              borderRadius: "12px",
              border: "1px solid #FDE68A",
            }}
          >
            <Text
              style={{
                fontSize: "12px",
                color: "#92400E",
                lineHeight: "1.8",
                display: "block",
              }}
            >
              演示账号（管理员）：13800000001{"\n"}
              演示账号（普通用户）：13800000002{"\n"}
              密码需包含字母和数字，至少6位
            </Text>
          </View>
        )} */}
      </View>

      <CustomTabBar activeTab="profile" />
    </View>
  );
}
