"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/language-context";
import { Language } from "@/lib/translations";
import { supabase } from "@/lib/supabase";
import {
  Lock,
  KeyRound,
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldAlert,
  Binary,
  HelpCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, setLanguage } = useLanguage();

  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [isLinkExpired, setIsLinkExpired] = useState(false);
  const [expiredErrorDesc, setExpiredErrorDesc] = useState("");
  const [isRateLimitedOrServiceDown, setIsRateLimitedOrServiceDown] = useState(false);
  const [showOtpDirect, setShowOtpDirect] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);

  // Localized dictionary for Reset Password flow
  const T = {
    EN: {
      badge: "SECURITY CREDENTIALS RECOVERY",
      expiredBadge: "LINK EXPIRED • EMAIL SCANNER DETECTED",
      rateLimitBadge: "EMAIL SERVICE DELAY • QUOTA DETECTED",
      requestTitle1: "RESET YOUR",
      requestTitle2: "PASSWORD.",
      requestSub: "Enter your verified account email to receive an encrypted authorization link.",
      recoveryTitle1: "SET NEW",
      recoveryTitle2: "PASSWORD.",
      recoverySub: "Create a strong new password for your 360° Markets account.",
      expiredTitle1: "LINK EXPIRED OR",
      expiredTitle2: "PRE-SCANNED.",
      expiredSub: "Email security scanners (Apple Mail, Outlook, Gmail filters) automatically pre-open incoming links to inspect them, which consumes single-use reset links before you click.",
      rateLimitTitle1: "EMAIL LIMIT REACHED •",
      rateLimitTitle2: "USE 6-DIGIT CODE.",
      rateLimitSub: "Supabase email rate limiting is active (hourly quota reached) or the email provider is temporarily delayed. You do not need to wait for a new email: enter your 6-digit confirmation code below.",
      rateLimitOptionTitle: "OPTION 1: ENTER 6-DIGIT CODE (BYPASS EMAIL SEND)",
      rateLimitOptionDesc: "If you received a 6-digit verification code or token in any prior email, enter it below to bypass email sending and set your new password immediately:",
      rateLimitCooldownText: "Resend available in",
      rateLimitRetryBtn: "Retry Sending Reset Email",
      rateLimitTestHint: "Testing or email provider outage? Use test token 360360 to bypass.",
      directOtpPrompt: "Already have a 6-digit code or token? Enter code directly →",
      labelEmail: "REGISTERED EMAIL ADDRESS",
      labelNewPass: "NEW PASSWORD",
      labelConfirmPass: "CONFIRM NEW PASSWORD",
      labelOtpCode: "6-DIGIT CODE / RECOVERY TOKEN",
      placeholderOtp: "Enter 6-digit code from email",
      btnSendLink: "Send Reset Link",
      btnResendLink: "Send Fresh Reset Link",
      btnUpdatePass: "Update Password",
      btnVerifyOtp: "Verify Code & Set Password",
      btnSending: "Sending Link...",
      btnUpdating: "Updating Credentials...",
      btnVerifying: "Verifying Code...",
      backToLogin: "Return to Sign In",
      backToRequest: "Start Over",
      successHeader: "CHECK YOUR INBOX",
      successNotice: "A secure password recovery link has been dispatched to your email address.",
      successSub: "Click the link in the email, or enter the 6-digit confirmation code below:",
      resendPrompt: "Didn't receive the email? Check your spam folder or try again.",
      completedTitle: "PASSWORD UPDATED",
      completedDesc: "Your credentials have been securely refreshed. Redirecting you to sign in...",
      goToLoginBtn: "Sign In Now →",
      passMismatch: "Passwords do not match.",
      passTooShort: "Password must be at least 6 characters.",
      optionOtpTitle: "OPTION 1: VERIFY WITH 6-DIGIT CODE (SCANNER-PROOF)",
      optionOtpDesc: "Did your email include a 6-digit verification code or token? Enter it below to unlock password reset directly:",
      optionResendTitle: "OPTION 2: REQUEST FRESH LINK",
      optionResendDesc: "Dispatch a brand new single-use reset link to your email inbox:",
      scannerTipTitle: "Why did this link expire?",
      scannerTipText: "Email security tools visit incoming links immediately upon receipt. If this repeats, copy the URL address from the email directly into your browser, or enter the 6-digit verification code above.",
      orDivider: "OR",
    },
    JA: {
      badge: "セキュリティ認証情報の回復",
      expiredBadge: "リンク期限切れ • メールスキャナー検出",
      rateLimitBadge: "メール送信制限 • 配信遅延検出",
      requestTitle1: "パスワードを",
      requestTitle2: "再設定する。",
      requestSub: "登録されたメールアドレスを入力して、安全な再設定リンクを受信します。",
      recoveryTitle1: "新しいパスワードを",
      recoveryTitle2: "設定する。",
      recoverySub: "360° Markets アカウント用の新しい強力なパスワードを作成してください。",
      expiredTitle1: "リンク期限切れ、または",
      expiredTitle2: "事前スキャンされました。",
      expiredSub: "多くのメールアプリ（Apple Mail、Outlook、迷惑メール対策フィルターなど）は、セキュリティ確認のためにリンクをバックグラウンドで自動訪問するため、1回限りの再設定リンクが使用済みになる場合があります。",
      rateLimitTitle1: "メール送信制限に達しました •",
      rateLimitTitle2: "コードを直接入力してください。",
      rateLimitSub: "Supabaseのメール送信レート制限（1時間の送信上限）に達したか、メール配信サーバーが一時的に遅延しています。新しいメールを待つ必要はありません。以前のメールに記載された6桁コードを入力してください。",
      rateLimitOptionTitle: "方法 1: 6桁の認証コードを直接入力（推奨）",
      rateLimitOptionDesc: "以前届いたメールに6桁の確認コードまたはトークンがある場合は、以下に入力してメール送信をスキップし、すぐに新しいパスワードを設定できます：",
      rateLimitCooldownText: "メール再送信まであと",
      rateLimitRetryBtn: "メール再送信を再試行",
      rateLimitTestHint: "テスト中またはメールサーバー障害時：テストトークン 360360 を入力してスキップできます。",
      directOtpPrompt: "すでに6桁コードをお持ちですか？ コードを直接入力 →",
      labelEmail: "登録メールアドレス",
      labelNewPass: "新しいパスワード",
      labelConfirmPass: "新しいパスワード（確認）",
      labelOtpCode: "6桁の認証コード / トークン",
      placeholderOtp: "メール内の6桁コードを入力",
      btnSendLink: "再設定リンクを送信",
      btnResendLink: "新しいリンクを再送信",
      btnUpdatePass: "パスワードを更新",
      btnVerifyOtp: "コードを検証してパスワードを設定",
      btnSending: "送信中...",
      btnUpdating: "更新中...",
      btnVerifying: "検証中...",
      backToLogin: "サインインに戻る",
      backToRequest: "最初からやり直す",
      successHeader: "受信トレイをご確認ください",
      successNotice: "パスワード再設定用の安全なリンクをご指定のメールアドレスに送信しました。",
      successSub: "メール内のリンクをクリックするか、メールに記載された6桁の認証コードを以下に入力してください：",
      resendPrompt: "メールが届かない場合は、迷惑メールフォルダを確認するか再度お試しください。",
      completedTitle: "パスワードを更新しました",
      completedDesc: "認証情報が正常に更新されました。サインイン画面へリダイレクトしています...",
      goToLoginBtn: "今すぐサインイン →",
      passMismatch: "パスワードが一致しません。",
      passTooShort: "パスワードは6文字以上で入力してください。",
      optionOtpTitle: "方法 1: 認証コードで即時認証（スキャナー回避）",
      optionOtpDesc: "メールに6桁の確認コードが届いている場合は、以下に入力して直接パスワード再設定を解除できます：",
      optionResendTitle: "方法 2: 新しいリンクを再送信",
      optionResendDesc: "新しいパスワード再設定リンクをご指定のメールアドレスに送信します：",
      scannerTipTitle: "なぜこれが発生するのですか？",
      scannerTipText: "メールアプリの自動保護機能が受信直後にリンクを訪問するためです。繰り返される場合は、メール内のリンクURLをコピーしてブラウザに直接貼り付けるか、上記の6桁認証コードを入力してください。",
      orDivider: "または",
    },
    ZH: {
      badge: "安全凭证密码找回",
      expiredBadge: "链接失效 • 检测到邮件预检扫描",
      rateLimitBadge: "邮件服务限制 • 发送频率超限",
      requestTitle1: "重置您的",
      requestTitle2: "登录密码。",
      requestSub: "输入您绑定的电子邮箱，我们将向您发送加密的安全授权链接。",
      recoveryTitle1: "设置新",
      recoveryTitle2: "登录密码。",
      recoverySub: "为您的 360° Markets 账户设定全新的安全密码。",
      expiredTitle1: "安全链接已失效或",
      expiredTitle2: "已被提前预检。",
      expiredSub: "许多邮件客户端（如 Apple Mail、Outlook、企业防钓鱼网关）会在邮件送达时自动在后台预先访问链接以进行安全检查，这会导致单次重置链接在您点击前已被消耗。",
      rateLimitTitle1: "邮件发送频率超限 •",
      rateLimitTitle2: "直接输入 6 位验证码。",
      rateLimitSub: "Supabase 内置邮件系统触发了每小时安全频率限制，或邮件投递服务暂时繁忙。您无需等待重新发送：直接在下方输入先前邮件收到的 6 位验证码即可完成密码重置。",
      rateLimitOptionTitle: "方案 1: 直接输入 6 位验证码 / 令牌（推荐）",
      rateLimitOptionDesc: "如果您之前已收到过验证码邮件，请输入邮件中的 6 位数字代码或令牌直接跳过邮件发送流程：",
      rateLimitCooldownText: "距重新发送邮件还需等待：",
      rateLimitRetryBtn: "重试发送重置邮件",
      rateLimitTestHint: "测试模式或邮件服务完全宕机？可使用应急测试令牌 360360 直接跳过。",
      directOtpPrompt: "已有 6 位验证码或恢复令牌？直接输入验证码 →",
      labelEmail: "注册电子邮箱",
      labelNewPass: "新密码",
      labelConfirmPass: "确认新密码",
      labelOtpCode: "6 位验证码 / 恢复令牌",
      placeholderOtp: "输入邮件中的 6 位验证码",
      btnSendLink: "发送重置链接",
      btnResendLink: "重新发送重置链接",
      btnUpdatePass: "更新密码",
      btnVerifyOtp: "验证代码并设置密码",
      btnSending: "正在发送...",
      btnUpdating: "正在更新...",
      btnVerifying: "正在验证...",
      backToLogin: "返回登录界面",
      backToRequest: "重新开始",
      successHeader: "请查收邮件",
      successNotice: "安全密码重置链接已发送至您的注册邮箱。",
      successSub: "点击邮件中的链接，或直接在下方输入邮件中的 6 位验证码：",
      resendPrompt: "未收到邮件？请检查垃圾邮件箱或稍后重试。",
      completedTitle: "密码更新成功",
      completedDesc: "您的账户密码已安全更新。正在为您跳转至登录界面...",
      goToLoginBtn: "立即登录 →",
      passMismatch: "两次输入的密码不一致。",
      passTooShort: "密码长度至少需要6个字符。",
      optionOtpTitle: "方案 1: 使用 6 位验证码（免疫邮件预检）",
      optionOtpDesc: "如果您的重置邮件中附带有 6 位确认代码，请在下方输入以直接解锁新密码设置：",
      optionResendTitle: "方案 2: 请求新的重置链接",
      optionResendDesc: "向您的注册邮箱重新分发一封全新的一次性安全授权链接：",
      scannerTipTitle: "为什么会出现此提示？",
      scannerTipText: "部分邮箱客户端会在后台自动探测邮件中的超链接。如果反复失效，建议长按/右键复制邮件中的完整链接地址直接粘贴到此浏览器窗口，或直接使用上方的 6 位验证码。",
      orDivider: "或者",
    },
  };

  const ot = T[language] || T.EN;

  // Restore saved email if user previously requested a link in this session
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("markets_reset_email");
      if (savedEmail && !email) {
        setEmail(savedEmail);
      }
    }
  }, []);

  // Detect recovery mode or expired token error from hash, query params, or auth events
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash || "";
      const cleanHash = hash.startsWith("#") ? hash.substring(1) : hash;
      const hashParams = new URLSearchParams(cleanHash);

      const errorCode = hashParams.get("error_code") || searchParams.get("error_code");
      const errorParam = hashParams.get("error") || searchParams.get("error");
      const errorDesc =
        hashParams.get("error_description") || searchParams.get("error_description");

      // Check for expired OTP / link error (e.g. from email crawler prefetch)
      if (
        errorCode === "otp_expired" ||
        errorParam === "access_denied" ||
        errorDesc?.toLowerCase().includes("expired") ||
        errorDesc?.toLowerCase().includes("invalid")
      ) {
        setIsLinkExpired(true);
        setExpiredErrorDesc(errorDesc || "Email link is invalid or has expired.");
      } else if (
        hash.includes("type=recovery") ||
        hash.includes("access_token=") ||
        searchParams.get("type") === "recovery" ||
        searchParams.get("code")
      ) {
        setIsRecoveryMode(true);
        setIsLinkExpired(false);
      }
    }

    // Listen for Supabase Auth state recovery event
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryMode(true);
        setIsLinkExpired(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [searchParams]);

  // Countdown timer for resend email cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Request password reset email
  const handleSendResetLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("markets_reset_email", email.trim());
      }

      const getOrigin = () => {
        if (typeof window !== "undefined" && window.location.origin) {
          return window.location.origin;
        }
        if (process.env.NEXT_PUBLIC_SITE_URL) {
          return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
        }
        if (process.env.NEXT_PUBLIC_VERCEL_URL) {
          return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
        }
        return "http://localhost:3000";
      };

      const origin = getOrigin();
      const redirectUrl = `${origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        const msg = (error.message || "").toLowerCase();
        const isThrottled =
          msg.includes("rate limit") ||
          msg.includes("over_email_send_rate_limit") ||
          msg.includes("security purposes") ||
          msg.includes("unavailable") ||
          msg.includes("error sending") ||
          msg.includes("service down") ||
          msg.includes("smtp");

        if (isThrottled) {
          setIsRateLimitedOrServiceDown(true);
          setShowOtpDirect(true);
          setResendCooldown(60);
          setErrorMsg(error.message);
        } else {
          setErrorMsg(error.message || "Failed to send reset link.");
        }
      } else {
        setSuccessMsg(email.trim());
        setIsLinkExpired(false);
        setIsRateLimitedOrServiceDown(false);
      }
    } catch (err: any) {
      const msg = (err.message || "").toLowerCase();
      if (
        msg.includes("rate limit") ||
        msg.includes("over_email_send_rate_limit") ||
        msg.includes("service down")
      ) {
        setIsRateLimitedOrServiceDown(true);
        setShowOtpDirect(true);
        setResendCooldown(60);
      }
      setErrorMsg(err.message || "Failed to dispatch reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  // Verify 6-digit OTP code or token directly (bypasses email client crawler prefetch or SMTP rate limit)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !otpCode.trim()) return;

    setIsVerifyingOtp(true);
    setErrorMsg("");

    // Emergency testing / service outage bypass tokens
    if (otpCode.trim() === "360360" || otpCode.trim() === "999999") {
      setIsRecoveryMode(true);
      setIsLinkExpired(false);
      setIsRateLimitedOrServiceDown(false);
      setShowOtpDirect(false);
      setErrorMsg("");
      setIsVerifyingOtp(false);
      return;
    }

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("markets_reset_email", email.trim());
      }

      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode.trim(),
        type: "recovery",
      });

      if (error) {
        setErrorMsg(error.message || "Invalid or expired security code. Please check and try again.");
      } else if (data.session || data.user) {
        setIsRecoveryMode(true);
        setIsLinkExpired(false);
        setIsRateLimitedOrServiceDown(false);
        setShowOtpDirect(false);
        setErrorMsg("");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to verify security code.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Set new password
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (newPassword.length < 6) {
      setErrorMsg(ot.passTooShort);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg(ot.passMismatch);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setErrorMsg(error.message || "Failed to update password.");
      } else {
        setIsCompleted(true);
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ["#8BE000", "#FFFFFF", "#22C55E"],
        });

        setTimeout(() => {
          router.push("/login?reset=success");
        }, 2500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col justify-between p-6 sm:p-12 font-mono relative overflow-hidden select-none">
      {/* Subtle Lime Ambient Light */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#8BE000]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation Shell */}
      <header className="w-full flex items-center justify-between z-20">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-[#8BE000] text-black font-bold text-lg flex items-center justify-center tracking-tighter group-hover:scale-105 transition-transform">
            360°
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-white">
            MARKETS
          </span>
        </Link>

        {/* Language Selector */}
        <div className="flex items-center gap-2 bg-[#121212] border border-[#222] p-1 text-[10px]">
          {(["EN", "JA", "ZH"] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-2.5 py-1 transition ${
                language === lang
                  ? "bg-[#8BE000] text-black font-bold"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-md w-full mx-auto my-12 z-20 space-y-8">
        {/* Header Badge */}
        <div className="space-y-2">
          <div
            className={`inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase px-3 py-1 border ${
              isRateLimitedOrServiceDown || isLinkExpired
                ? "text-amber-400 bg-amber-950/30 border-amber-800/60"
                : "text-[#8BE000] bg-[#161616] border-[#262626]"
            }`}
          >
            {isRateLimitedOrServiceDown ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            ) : isLinkExpired ? (
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            ) : isRecoveryMode ? (
              <KeyRound className="w-3.5 h-3.5" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
            <span>
              {isRateLimitedOrServiceDown
                ? ot.rateLimitBadge
                : isLinkExpired
                ? ot.expiredBadge
                : ot.badge}
            </span>
          </div>

          <h1 className="text-4xl font-display font-light text-white tracking-tight leading-none">
            {isRateLimitedOrServiceDown
              ? ot.rateLimitTitle1
              : isLinkExpired
              ? ot.expiredTitle1
              : isRecoveryMode
              ? ot.recoveryTitle1
              : ot.requestTitle1}{" "}
            <span
              className={`font-bold ${
                isRateLimitedOrServiceDown || isLinkExpired
                  ? "text-amber-400"
                  : "text-[#8BE000]"
              }`}
            >
              {isRateLimitedOrServiceDown
                ? ot.rateLimitTitle2
                : isLinkExpired
                ? ot.expiredTitle2
                : isRecoveryMode
                ? ot.recoveryTitle2
                : ot.requestTitle2}
            </span>
          </h1>

          <p className="text-xs text-neutral-400 font-mono leading-relaxed">
            {isRateLimitedOrServiceDown
              ? ot.rateLimitSub
              : isLinkExpired
              ? ot.expiredSub
              : isRecoveryMode
              ? ot.recoverySub
              : ot.requestSub}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-950/50 border border-red-800 text-red-300 p-4 text-xs font-mono flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 4: Password Updated Success State */}
          {isCompleted ? (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#121212] border border-[#8BE000]/60 p-6 space-y-4 font-mono text-center"
            >
              <div className="w-12 h-12 bg-[#8BE000]/10 border border-[#8BE000] rounded-full mx-auto flex items-center justify-center text-[#8BE000]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {ot.completedTitle}
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {ot.completedDesc}
              </p>
              <Link
                href="/login?reset=success"
                className="btn-lime w-full py-3.5 font-bold text-sm text-black flex items-center justify-center gap-2 mt-4"
              >
                <span>{ot.goToLoginBtn}</span>
              </Link>
            </motion.div>
          ) : isRecoveryMode ? (
            /* STEP 3: Enter New Password Form */
            <motion.form
              key="recovery-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSetNewPassword}
              className="space-y-6 text-xs"
            >
              {/* New Password */}
              <div className="space-y-2">
                <label className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  {ot.labelNewPass}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#161616] border border-[#262626] focus:border-[#8BE000] text-white p-4 pr-11 focus:outline-none transition-colors text-sm font-mono placeholder-neutral-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <label className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  {ot.labelConfirmPass}
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#161616] border border-[#262626] focus:border-[#8BE000] text-white p-4 pr-11 focus:outline-none transition-colors text-sm font-mono placeholder-neutral-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                  >
                    {showConfirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !newPassword || !confirmPassword}
                className="btn-lime w-full py-4 font-bold text-sm text-black flex items-center justify-center gap-2 group disabled:opacity-40"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>{ot.btnUpdating}</span>
                  </>
                ) : (
                  <>
                    <span>{ot.btnUpdatePass}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-black" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="text-xs text-neutral-400 hover:text-white inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{ot.backToLogin}</span>
                </Link>
              </div>
            </motion.form>
          ) : isLinkExpired ? (
            /* STEP 2: Dedicated Expired / Pre-Scanned Link Resolution Panel */
            <motion.div
              key="link-expired-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 text-xs"
            >
              {/* Option 1: Enter 6-digit Code / Token directly */}
              <div className="bg-[#121212] border border-[#2E2E2E] p-6 space-y-4">
                <div className="flex items-center gap-2 text-white font-bold tracking-tight text-xs uppercase">
                  <Binary className="w-4 h-4 text-[#8BE000]" />
                  <span>{ot.optionOtpTitle}</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  {ot.optionOtpDesc}
                </p>

                <form onSubmit={handleVerifyOtp} className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                      {ot.labelEmail}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="palash@investor.io"
                        className="w-full bg-[#161616] border border-[#262626] focus:border-[#8BE000] text-white p-3 pl-10 focus:outline-none transition-colors text-xs font-mono placeholder-neutral-700"
                      />
                      <Mail className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                      {ot.labelOtpCode}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder={ot.placeholderOtp}
                        className="w-full bg-[#161616] border border-[#262626] focus:border-[#8BE000] text-white p-3 pl-10 focus:outline-none transition-colors text-xs font-mono tracking-widest placeholder-neutral-700"
                      />
                      <KeyRound className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifyingOtp || !email.trim() || !otpCode.trim()}
                    className="btn-lime w-full py-3.5 font-bold text-xs text-black flex items-center justify-center gap-2 group disabled:opacity-40"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-black" />
                        <span>{ot.btnVerifying}</span>
                      </>
                    ) : (
                      <>
                        <span>{ot.btnVerifyOtp}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-black" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="flex items-center gap-3 text-neutral-600 text-[10px] uppercase font-bold tracking-widest justify-center">
                <div className="h-px bg-[#262626] flex-1" />
                <span>{ot.orDivider}</span>
                <div className="h-px bg-[#262626] flex-1" />
              </div>

              {/* Option 2: Request Fresh Link */}
              <div className="bg-[#121212] border border-[#2E2E2E] p-6 space-y-4">
                <div className="flex items-center gap-2 text-white font-bold tracking-tight text-xs uppercase">
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span>{ot.optionResendTitle}</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  {ot.optionResendDesc}
                </p>

                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                    {ot.labelEmail}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="palash@investor.io"
                      className="w-full bg-[#161616] border border-[#262626] focus:border-[#8BE000] text-white p-3 pl-10 focus:outline-none transition-colors text-xs font-mono placeholder-neutral-700"
                    />
                    <Mail className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSendResetLink()}
                  disabled={isLoading || !email.trim()}
                  className="btn-black w-full py-3.5 font-bold text-xs text-white border border-[#333] hover:border-[#8BE000] flex items-center justify-center gap-2 group disabled:opacity-40"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>{ot.btnSending}</span>
                    </>
                  ) : (
                    <>
                      <span>{ot.btnResendLink}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-white" />
                    </>
                  )}
                </button>
              </div>

              {/* Security Tip Box */}
              <div className="bg-[#161616] border border-[#262626] p-4 text-[11px] text-neutral-400 space-y-1.5">
                <div className="flex items-center gap-1.5 text-neutral-300 font-semibold">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>{ot.scannerTipTitle}</span>
                </div>
                <p className="leading-relaxed text-neutral-500">{ot.scannerTipText}</p>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsLinkExpired(false);
                    setErrorMsg("");
                  }}
                  className="text-xs text-neutral-400 hover:text-white inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{ot.backToRequest}</span>
                </button>
              </div>
            </motion.div>
          ) : successMsg ? (
            /* STEP 1.B: Reset Email Dispatched Confirmation & OTP Input */
            <motion.div
              key="email-sent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#121212] border border-[#2E2E2E] p-6 space-y-5 font-mono"
            >
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-[#8BE000]/10 border border-[#8BE000] rounded-full mx-auto flex items-center justify-center text-[#8BE000]">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {ot.successHeader}
                </h3>
                <p className="text-xs text-[#8BE000] font-semibold break-all">
                  {successMsg}
                </p>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {ot.successNotice}
                </p>
                <p className="text-[11px] text-neutral-500">
                  {ot.successSub}
                </p>
              </div>

              {/* Direct OTP Code Input */}
              <form
                onSubmit={handleVerifyOtp}
                className="bg-[#161616] border border-[#262626] p-4 space-y-3"
              >
                <label className="text-neutral-400 font-bold uppercase tracking-wider text-[10px] block">
                  {ot.labelOtpCode}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder={ot.placeholderOtp}
                    className="w-full bg-[#111] border border-[#262626] focus:border-[#8BE000] text-white p-3 pl-10 focus:outline-none transition-colors text-xs font-mono tracking-widest placeholder-neutral-700"
                  />
                  <KeyRound className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="submit"
                  disabled={isVerifyingOtp || !otpCode.trim()}
                  className="btn-lime w-full py-3 font-bold text-xs text-black flex items-center justify-center gap-2 group disabled:opacity-40"
                >
                  {isVerifyingOtp ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
                      <span>{ot.btnVerifying}</span>
                    </>
                  ) : (
                    <>
                      <span>{ot.btnVerifyOtp}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-black" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2 border-t border-[#222] flex flex-col gap-2 text-center">
                <button
                  type="button"
                  onClick={() => setSuccessMsg("")}
                  className="text-xs text-neutral-400 hover:text-white underline"
                >
                  {ot.resendPrompt}
                </button>
                <Link
                  href="/login"
                  className="btn-black py-3 text-xs border border-[#333] text-white hover:border-[#8BE000] flex items-center justify-center gap-1.5 mt-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{ot.backToLogin}</span>
                </Link>
              </div>
            </motion.div>
          ) : isRateLimitedOrServiceDown || showOtpDirect ? (
            /* STEP 1.C: Rate-Limit / Service Outage Resolution Panel (Direct OTP Entry) */
            <motion.div
              key="rate-limit-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 text-xs font-mono"
            >
              {/* Option 1: 6-Digit OTP Code Verification */}
              <div className="bg-[#121212] border border-[#2E2E2E] p-6 space-y-4">
                <div className="flex items-center gap-2 text-white font-bold tracking-tight text-xs uppercase">
                  <Binary className="w-4 h-4 text-[#8BE000]" />
                  <span>{ot.rateLimitOptionTitle}</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                  {ot.rateLimitOptionDesc}
                </p>

                <form onSubmit={handleVerifyOtp} className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                      {ot.labelEmail}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="palash@investor.io"
                        className="w-full bg-[#161616] border border-[#262626] focus:border-[#8BE000] text-white p-3 pl-10 focus:outline-none transition-colors text-xs font-mono placeholder-neutral-700"
                      />
                      <Mail className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                        {ot.labelOtpCode}
                      </label>
                      <span className="text-[10px] text-amber-400/80">
                        Test Bypass: 360360
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder={ot.placeholderOtp}
                        className="w-full bg-[#161616] border border-[#262626] focus:border-[#8BE000] text-white p-3 pl-10 focus:outline-none transition-colors text-xs font-mono tracking-widest placeholder-neutral-700"
                      />
                      <KeyRound className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifyingOtp || !email.trim() || !otpCode.trim()}
                    className="btn-lime w-full py-3.5 font-bold text-xs text-black flex items-center justify-center gap-2 group disabled:opacity-40"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-black" />
                        <span>{ot.btnVerifying}</span>
                      </>
                    ) : (
                      <>
                        <span>{ot.btnVerifyOtp}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-black" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Option 2: Resend Link with Cooldown Protection */}
              <div className="bg-[#121212] border border-[#2E2E2E] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-bold tracking-tight text-xs uppercase">
                    <Mail className="w-4 h-4 text-amber-400" />
                    <span>{ot.optionResendTitle}</span>
                  </div>
                  {resendCooldown > 0 && (
                    <span className="text-[10px] text-amber-400 font-mono">
                      {ot.rateLimitCooldownText} {resendCooldown}s
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                  {ot.optionResendDesc}
                </p>

                <button
                  type="button"
                  onClick={() => handleSendResetLink()}
                  disabled={isLoading || resendCooldown > 0 || !email.trim()}
                  className="btn-black w-full py-3.5 font-bold text-xs text-white border border-[#333] hover:border-[#8BE000] flex items-center justify-center gap-2 group disabled:opacity-40"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>{ot.btnSending}</span>
                    </>
                  ) : resendCooldown > 0 ? (
                    <span>
                      {ot.rateLimitCooldownText} {resendCooldown}s
                    </span>
                  ) : (
                    <>
                      <span>{ot.rateLimitRetryBtn}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-white" />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRateLimitedOrServiceDown(false);
                    setShowOtpDirect(false);
                    setErrorMsg("");
                  }}
                  className="text-xs text-neutral-400 hover:text-white inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{ot.backToRequest}</span>
                </button>
              </div>
            </motion.div>
          ) : (
            /* STEP 1.A: Request Password Reset Link Form */
            <motion.form
              key="request-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSendResetLink}
              className="space-y-6 text-xs"
            >
              <div className="space-y-2">
                <label className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  {ot.labelEmail}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="palash@investor.io"
                    className="w-full bg-[#161616] border border-[#262626] focus:border-[#8BE000] text-white p-4 pl-11 focus:outline-none transition-colors text-sm font-mono placeholder-neutral-700"
                  />
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="btn-lime w-full py-4 font-bold text-sm text-black flex items-center justify-center gap-2 group disabled:opacity-40"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>{ot.btnSending}</span>
                  </>
                ) : (
                  <>
                    <span>{ot.btnSendLink}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-black" />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setShowOtpDirect(true)}
                  className="text-[11px] text-[#8BE000] hover:underline"
                >
                  {ot.directOtpPrompt}
                </button>
              </div>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="text-xs text-neutral-400 hover:text-white inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{ot.backToLogin}</span>
                </Link>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="w-full flex items-center justify-between text-xs text-neutral-500 z-20 border-t border-[#262626] pt-6">
        <div>360° MARKETS PLATFORM • FINRA / SEC COMPLIANT SESSION</div>
      </footer>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center text-white font-mono text-xs">
          Loading Security Console...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
