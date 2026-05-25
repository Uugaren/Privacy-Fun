import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { Link, Route, Switch, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Bell,
  Heart,
  MessageCircle,
  Bookmark,
  Lock,
  Images,
  Play,
  Sparkles,
  ChevronUp,
  Ellipsis,
  UserCheck,
  X,
  Loader2,
  Copy,
  CheckCircle2,
  ChevronDown,
  LayoutDashboard,
  ShoppingCart,
  Users,
  Film,
  TrendingUp,
  Plus,
  Shield,
  BadgeCheck,
  AlertCircle,
  Upload,
  Trash2,
  Pencil,
} from "lucide-react";
import {
  useCreateCheckout,
  useLogin,
  useGetMyAccess,
  useGetAdminStats,
  useListAdminOrders,
  useListAdminUsers,
  useListContents,
  useCreateContent,
  useListAdminContents,
  useUpdateContent,
  useDeleteContent,
  setAuthTokenGetter,
} from "./api-client";

// Register global token getter so every API call automatically includes auth
setAuthTokenGetter(() => localStorage.getItem("privacy_token"));

import profileImg from "./assets/profile-image.png";
import coverImg from "./assets/cover-img.png";
import contentImg from "./assets/content-img.png";
import sophieProfileImg from "./assets/sophie-profile.png";
import sophieCoverImg from "./assets/sophie-cover.png";

// ============================================================================
// QUERY CLIENT
// ============================================================================
const queryClient = new QueryClient();

// ============================================================================
// AUTH CONTEXT
// ============================================================================
interface User {
  id: string;
  email: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("privacy_token"));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("privacy_user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("privacy_token", newToken);
    localStorage.setItem("privacy_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("privacy_token");
    localStorage.removeItem("privacy_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Helper to get auth headers for API calls
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("privacy_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Custom hook to detect country (cached in localStorage)
export function useCountry() {
  const [isBR, setIsBR] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const testCountry = urlParams.get("country");
      if (testCountry) {
        localStorage.setItem("test_country", testCountry);
        localStorage.removeItem("detected_country");
        return testCountry.toLowerCase() === "br";
      }
    }
    const testCountry = localStorage.getItem("test_country");
    if (testCountry) return testCountry.toLowerCase() === "br";
    const detected = localStorage.getItem("detected_country");
    if (detected) return detected === "br";
    const locale = navigator.language || (navigator.languages && navigator.languages[0]) || "";
    return locale.toLowerCase().includes("br") || locale.toLowerCase().includes("pt");
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const testCountryParam = urlParams.get("country");
    if (testCountryParam) {
      localStorage.setItem("test_country", testCountryParam);
      localStorage.removeItem("detected_country");
      setIsBR(testCountryParam.toLowerCase() === "br");
      return;
    }
    const testCountry = localStorage.getItem("test_country");
    if (testCountry) {
      setIsBR(testCountry.toLowerCase() === "br");
      return;
    }
    const detected = localStorage.getItem("detected_country");
    if (detected) {
      setIsBR(detected === "br");
      return;
    }
    fetch("/api/country")
      .then((res) => res.json())
      .then((data) => {
        const checkBR = data.country?.toLowerCase() === "br";
        localStorage.setItem("detected_country", checkBR ? "br" : "intl");
        setIsBR(checkBR);
      })
      .catch(() => {
        const locale = navigator.language || (navigator.languages && navigator.languages[0]) || "";
        const checkBR = locale.toLowerCase().includes("br") || locale.toLowerCase().includes("pt");
        setIsBR(checkBR);
      });
  }, []);

  return isBR;
}

// ============================================================================
// COMPONENTS
// ============================================================================

// --- Header ---
function Header() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isBR = useCountry();

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between bg-white border-b border-gray-100 px-4">
      <Link href="/" className="text-[20px] font-extrabold tracking-[-0.08em] text-black">
        {isBR ? (
          <>
            privacy<span className="text-[#f59b32]">.</span>
          </>
        ) : (
          <span className="text-black tracking-normal">only<span className="text-[#00aff0]">fans</span></span>
        )}
      </Link>
      <div className="flex items-center gap-3">
        {user ? (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 h-9 px-2 rounded-full hover:bg-gray-50 transition"
            >
              <div className="h-7 w-7 overflow-hidden rounded-full bg-gradient-to-br from-[#e89c30] to-[#f5c842] flex items-center justify-center text-white text-[11px] font-bold uppercase shadow-sm">
                {user.email.substring(0, 2)}
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-gray-100 bg-white shadow-xl z-50 py-1 overflow-hidden">
                  <Link href="/members" onClick={() => setMenuOpen(false)}>
                    <div className="flex items-center w-full px-4 py-2.5 text-[14px] font-medium text-gray-700 hover:bg-gray-50 hover:text-black">
                      {isBR ? "Área de Membros" : "Members Area"}
                    </div>
                  </Link>
                  {user?.role === "admin" && (
                    <Link href="/admin" onClick={() => setMenuOpen(false)}>
                      <div className="flex items-center gap-2 w-full px-4 py-2.5 text-[14px] font-medium text-[#e89c30] hover:bg-orange-50">
                        <Shield className="h-4 w-4" />
                        {isBR ? "Painel Admin" : "Admin Panel"}
                      </div>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                      setLocation("/");
                    }}
                    className="flex items-center w-full px-4 py-2.5 text-[14px] font-medium text-red-600 hover:bg-red-50"
                  >
                    {isBR ? "Sair" : "Log Out"}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link href="/login" className="flex items-center justify-center h-8 px-4 rounded-full bg-gray-100 text-[13px] font-semibold text-black transition hover:bg-gray-200">
            Login
          </Link>
        )}
      </div>
    </header>
  );
}

// --- Checkout Modal ---
function CheckoutModal({
  isOpen,
  onClose,
  amount,
  paymentMethod = "pix"
}: {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  paymentMethod?: "pix" | "stripe";
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const [, setLocation] = useLocation();
  const checkoutMutation = useCreateCheckout();

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setErrorMsg("");
      checkoutMutation.reset();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password.length < 6) {
      setErrorMsg(
        paymentMethod === "stripe"
          ? "Password must be at least 6 characters."
          : "A senha deve ter no mínimo 6 caracteres."
      );
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(
        paymentMethod === "stripe"
          ? "Passwords do not match."
          : "As senhas não coincidem."
      );
      return;
    }

    try {
      const response = await checkoutMutation.mutateAsync({
        data: {
          email,
          password,
          amount,
          // @ts-ignore
          paymentMethod
        }
      });
      
      // If Stripe, redirect to Checkout Session URL
      // @ts-ignore
      if (paymentMethod === "stripe" && response.checkoutUrl) {
        // @ts-ignore
        window.location.href = response.checkoutUrl;
        return;
      }
      setStep(2);
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ||
        (paymentMethod === "stripe"
          ? "Error generating checkout. Please try again."
          : "Erro ao gerar cobrança. Tente novamente.")
      );
    }
  };

  const copyPix = () => {
    if (checkoutMutation.data?.pix_copy_paste) {
      navigator.clipboard.writeText(checkoutMutation.data.pix_copy_paste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isStripe = paymentMethod === "stripe";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-6 pb-6 pt-8">
          <div className="text-center mb-6">
            <h2 className="text-[20px] font-bold text-black tracking-tight">
              {step === 1
                ? (isStripe ? "Complete your subscription" : "Complete sua assinatura")
                : "Pagamento via Pix"}
            </h2>
            <p className="text-[14px] text-gray-500 mt-1">
              {step === 1
                ? (isStripe
                    ? `Selected package: $${amount.toFixed(2)}`
                    : `Plano selecionado: R$ ${amount.toFixed(2).replace('.', ',')}`)
                : "Escaneie ou copie o código abaixo"}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder={isStripe ? "Your email address" : "Seu melhor e-mail"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] outline-none transition focus:border-[#00aff0] focus:bg-white focus:ring-1 focus:ring-[#00aff0]"
                />
                <input
                  type="password"
                  required
                  placeholder={isStripe ? "Create a password (min. 6 characters)" : "Crie uma senha (min. 6 caracteres)"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] outline-none transition focus:border-[#00aff0] focus:bg-white focus:ring-1 focus:ring-[#00aff0]"
                />
                <input
                  type="password"
                  required
                  placeholder={isStripe ? "Confirm password" : "Confirme sua senha"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] outline-none transition focus:border-[#00aff0] focus:bg-white focus:ring-1 focus:ring-[#00aff0]"
                />
              </div>

              {errorMsg && (
                <div className="rounded-lg bg-red-50 p-3 text-[13px] text-red-600 font-medium">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={checkoutMutation.isPending}
                className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-[15px] font-bold text-white transition disabled:opacity-70 mt-2 ${
                  isStripe
                    ? "bg-[#00aff0] hover:bg-[#009bd6]"
                    : "bg-[#23c55e] hover:bg-[#1fa951]"
                }`}
              >
                {checkoutMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  isStripe ? "Pay with Card" : "Gerar Pix"
                )}
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center space-y-5">
              {checkoutMutation.data?.pix_qr_code && (
                <div className="rounded-xl border border-gray-100 p-2 shadow-sm bg-white">
                  <img
                    src={
                      checkoutMutation.data.pix_qr_code.startsWith("data:")
                        ? checkoutMutation.data.pix_qr_code
                        : `data:image/png;base64,${checkoutMutation.data.pix_qr_code}`
                    }
                    alt="QR Code Pix"
                    className="w-48 h-48 object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}

              <div className="w-full">
                <p className="text-[12px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                  Pix Copia e Cola
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={checkoutMutation.data?.pix_copy_paste || ""}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-[13px] text-gray-600 outline-none font-mono"
                  />
                  <button
                    onClick={copyPix}
                    className="flex shrink-0 h-[42px] px-4 items-center justify-center gap-1.5 rounded-lg bg-[#e89c30] text-[13px] font-bold text-white hover:bg-[#d48a20] transition"
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-[#f59b32]">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-[14px] font-semibold">Aguardando pagamento...</span>
              </div>

              <div className="w-full pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    onClose();
                    setLocation("/login");
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 text-[14px] font-semibold text-black transition hover:bg-gray-50"
                >
                  Já paguei? Fazer login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PAGES
// ============================================================================

// --- Home Page ---
const NOTIFICATIONS = [
  { id: 1, name: "Maria S.", action: "assinou seu perfil!", avatar: "MS" },
  { id: 2, name: "João P.", action: "curtiu uma foto sua", avatar: "JP" },
  { id: 3, name: "Carlos R.", action: "assinou seu perfil!", avatar: "CR" },
  { id: 4, name: "Ana L.", action: "enviou uma mensagem", avatar: "AL" },
  { id: 5, name: "Pedro M.", action: "curtiu seu vídeo", avatar: "PM" },
];

interface Toast {
  id: number;
  name: string;
  action: string;
  avatar: string;
  exiting: boolean;
}

function BrazilianHomePage() {
  const [activeTab, setActiveTab] = useState<"fotos" | "videos">("fotos");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifIndex, setNotifIndex] = useState(0);

  // Checkout modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutAmount, setCheckoutAmount] = useState(21.87);

  const openCheckout = (amount: number) => {
    setCheckoutAmount(amount);
    setIsCheckoutOpen(true);
  };

  useEffect(() => {
    const show = () => {
      const notif = NOTIFICATIONS[notifIndex % NOTIFICATIONS.length];
      const newToast: Toast = { ...notif, id: Date.now(), exiting: false };
      setToasts((prev) => [...prev.slice(-1), newToast]);
      setNotifIndex((i) => i + 1);

      setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === newToast.id ? { ...t, exiting: true } : t))
        );
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
        }, 700);
      }, 3500);
    };

    const timer = setTimeout(show, 1500);
    const interval = setInterval(show, 5000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [notifIndex]);

  return (
    <>
      <main className="min-h-screen bg-white pt-14 pb-12">
        <div className="mx-auto flex max-w-[480px] flex-col gap-3 px-3 py-4">

          {/* Profile Card */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {/* Cover */}
            <div className="relative h-32 w-full">
              <img
                src={coverImg}
                alt="cover"
                className="absolute inset-0 h-full w-full object-cover"
              />
              {/* AO VIVO badge */}
              <div className="absolute -top-0.5 left-3 z-10 mt-3 flex items-center gap-1 rounded-full bg-[#4ade80] px-2.5 py-0.5">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                <span className="text-[13px] font-bold text-black">AO VIVO</span>
              </div>
              {/* Profile avatar centered bottom */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
                <div className="live-border h-[96px] w-[96px] rounded-full border-[3px] border-white overflow-hidden bg-gray-200">
                  <img
                    src={profileImg}
                    alt="Duda Wolfram"
                    className="h-full w-full object-cover"
                  />
                </div>
                {/* ONLINE pill */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex items-center gap-1 bg-orange-400 rounded px-2 py-1 text-white text-[11px] font-bold shadow-lg whitespace-nowrap">
                  🟢 ONLINE
                </div>
              </div>
            </div>

            {/* Profile info */}
            <div className="px-4 pb-5 pt-14">
              <div className="text-center">
                <h1 className="text-[17px] font-bold tracking-[-0.03em] text-black">
                  Duda Wolfram
                </h1>
                <p className="text-[15px] text-gray-500">@duda_wolfram</p>
              </div>

              <div className="mt-4 flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-[16px] font-bold text-black">159</p>
                  <p className="text-[12px] text-gray-600">Seguindo</p>
                </div>
                <div className="text-center">
                  <p className="text-[16px] font-bold text-black">626</p>
                  <p className="text-[12px] text-gray-600">Seguidores</p>
                </div>
                <div className="text-center">
                  <p className="text-[16px] font-bold text-black">364.6K</p>
                  <p className="text-[12px] text-gray-600">Curtidas</p>
                </div>
              </div>

              <p className="mt-3 text-[15px] leading-relaxed text-black text-center">
                Aqui você vai ver meus vídeos transando gostoso, anal, squirt e muito mais 💦 Vem conhecer melhor sua loirinha 😜
              </p>
            </div>
          </div>

          {/* Subscription Offer Card */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#e89c30]" />
                <span className="text-[15px] font-semibold text-black">Oferta de assinatura</span>
              </div>
              <span className="rounded bg-[#e89c30]/10 px-2 py-0.5 text-[12px] font-semibold text-[#e89c30]">
                Termina em 1 dia
              </span>
            </div>

            <p className="text-[14px] text-gray-600">
              Acesso especial com atualizações diárias, conversas reservadas e íntimas.
            </p>

            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
              <span className="text-[14px] font-semibold text-black">Economize 26%</span>
            </div>

            <button
              onClick={() => openCheckout(21.87)}
              className="w-full rounded-xl bg-[#e89c30] py-3.5 text-[15px] font-semibold text-black transition hover:bg-[#d48a20]"
            >
              Assinar agora R$ 21,87
            </button>

            <p className="text-center text-[12px] text-gray-500">
              Preço original <span className="line-through">R$ 29,55</span>
            </p>
          </div>

          {/* Subscription Tiers */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[15px] font-semibold text-black">Assinaturas</span>
              <ChevronUp className="h-4 w-4 text-gray-400" />
            </div>
            <div className="border-t border-gray-100">
              {[
                { label: "1 Mês (26% off)", price: "R$ 21,87", amount: 21.87 },
                { label: "3 meses (42% off)", price: "R$ 43,87", amount: 43.87 },
                { label: "Vitalício (50% off)", price: "R$ 65,98", amount: 65.98 },
              ].map((tier, i) => (
                <button
                  key={i}
                  onClick={() => openCheckout(tier.amount)}
                  className="flex w-full items-center justify-between px-4 py-3.5 transition hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <span className="text-[15px] text-black">{tier.label}</span>
                  <span className="text-[15px] font-semibold text-black">{tier.price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content tabs */}
          <div className="flex overflow-hidden rounded-2xl border border-gray-200 bg-white mt-2">
            <button
              onClick={() => setActiveTab("fotos")}
              className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-3.5 text-[15px] font-semibold transition ${activeTab === "fotos"
                  ? "text-[#e89c30] border-b-2 border-[#e89c30]"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <Images className={`h-[18px] w-[18px] ${activeTab === "fotos" ? "text-[#e89c30]" : "text-gray-400"}`} />
              Fotos
            </button>
            <button
              onClick={() => setActiveTab("videos")}
              className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-3.5 text-[15px] font-semibold transition ${activeTab === "videos"
                  ? "text-[#e89c30] border-b-2 border-[#e89c30]"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <Play className={`h-[18px] w-[18px] ${activeTab === "videos" ? "text-[#e89c30]" : "text-gray-400"}`} />
              Vídeos
            </button>
          </div>

          <p className="px-1 text-[12px] text-gray-500">513 Postagens · 1.323 Mídias</p>

          {/* Post Card 1 */}
          <PostCard likeCount={124} onUnlock={() => openCheckout(21.87)} />

          {/* Post Card 2 */}
          <PostCard likeCount={341} onUnlock={() => openCheckout(21.87)} />

        </div>
      </main>

      {/* Floating Notifications */}
      <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-3 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-2.5 rounded-2xl border border-gray-100 bg-white px-3 py-2.5 shadow-lg ${toast.exiting ? "toast-exit" : "toast-enter"
              }`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#e89c30]/60 to-[#f5c842]/60">
              <span className="text-[10px] font-bold text-white">{toast.avatar}</span>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-black leading-tight">{toast.name}</p>
              <p className="text-[12px] text-gray-500 leading-tight">{toast.action}</p>
            </div>
            <UserCheck className="ml-auto h-4 w-4 text-[#e89c30] shrink-0" />
          </div>
        ))}
      </div>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        amount={checkoutAmount}
        paymentMethod="pix"
      />
    </>
  );
}

function SubscriptionBox({ onSubscribe }: { onSubscribe: (amount: number) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Subscription</p>
      
      <div className="rounded-xl border border-gray-100 bg-white p-3 space-y-3 shadow-2xs">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-[13px] font-bold text-black">Limited offer</h4>
            <p className="text-[11px] text-gray-500 mt-0.5">50% off for the first 31 days!</p>
          </div>
        </div>

        <div className="flex gap-2.5 bg-gray-50 rounded-lg p-2.5 border border-gray-100">
          <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 border border-gray-200">
            <img src={profileImg} alt="Duda Wolfram avatar" className="w-full h-full object-cover" />
          </div>
          <p className="text-[11px] text-gray-600 leading-normal">
            MY BIGGEST SALE EVER!!! only for the next 100 subscribers (9)/100 remaining 🚨 #1 on ONLYFANS for a reason 😜
          </p>
        </div>

        <button
          onClick={() => onSubscribe(5.00)}
          className="w-full flex items-center justify-between px-4 py-3.5 rounded-full bg-[#00aff0] hover:bg-[#009bd6] text-[14px] font-bold text-white transition shadow-sm"
        >
          <span>SUBSCRIBE</span>
          <span>$5 for 31 days</span>
        </button>
        
        <p className="text-center text-[11px] text-gray-400 mt-1">Normal Price $10/month</p>
      </div>
    </div>
  );
}

function InternationalHomePage() {
  const [activeTab, setActiveTab] = useState<"posts" | "media">("posts");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutAmount, setCheckoutAmount] = useState(5.00);

  const openCheckout = (amount: number) => {
    setCheckoutAmount(amount);
    setIsCheckoutOpen(true);
  };

  return (
    <>
      <main className="min-h-screen bg-gray-50 pt-14 pb-12">
        <div className="mx-auto max-w-[950px] px-4 py-6 grid grid-cols-1 md:grid-cols-[1fr_340px] gap-6">
          
          {/* Main Column */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            
            {/* Cover Banner Section */}
            <div className="relative h-48 sm:h-64 md:h-80 w-full overflow-hidden select-none">
              <img
                src={coverImg}
                alt="Duda Wolfram cover"
                className="w-full h-full object-cover"
              />
              
              {/* Subtle top gradient shadow for text contrast */}
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />

              {/* Overlaid Header controls on top of cover */}
              <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3 sm:p-4 text-white">
                <div className="flex items-center gap-3">
                  <button className="h-9 w-9 flex items-center justify-center rounded-full text-white hover:bg-white/10 transition shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                  <div>
                    <h2 className="text-[15px] sm:text-[17px] font-bold text-white flex items-center gap-1 leading-none drop-shadow-md">
                      Duda Wolfram
                      <BadgeCheck className="h-4.5 w-4.5 text-[#00aff0] fill-current shrink-0" />
                    </h2>
                    {/* OnlyFans icon stats row overlaid at top left */}
                    <p className="text-[11px] sm:text-[12px] text-white/95 mt-1 font-medium flex items-center gap-1.5 drop-shadow-sm">
                      <Images className="h-3 w-3 shrink-0" />
                      <span>443</span>
                      <span>·</span>
                      <Play className="h-3.5 w-3.5 shrink-0" />
                      <span>40</span>
                      <span>·</span>
                      <Heart className="h-3.5 w-3.5 shrink-0" />
                      <span>1.16M</span>
                    </p>
                  </div>
                </div>
                <button className="h-9 w-9 flex items-center justify-center rounded-full text-white hover:bg-white/10 transition">
                  <Ellipsis className="h-5 w-5 rotate-90" />
                </button>
              </div>
            </div>

            {/* Profile Avatar and Info Block below cover */}
            <div className="px-4 pb-5 bg-white relative">
              {/* Profile Avatar overlapping cover border */}
              <div className="flex items-end justify-between -mt-10 sm:-mt-12 md:-mt-14 mb-3 relative z-10">
                <div className="relative h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-full border-4 border-white overflow-hidden bg-gray-200 shadow-sm shrink-0">
                  <img src={profileImg} alt="Duda Wolfram" className="w-full h-full object-cover" />
                  {/* Green active status indicator dot */}
                  <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-[#23c55e] border-[2px] border-white" />
                </div>

                {/* Circular Action Buttons */}
                <div className="flex gap-2.5 pb-2">
                  <button className="h-10 w-10 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 text-[#00aff0] transition shadow-2xs">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  </button>
                  <button className="h-10 w-10 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 text-[#00aff0] transition shadow-2xs">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Creator details, bio, links */}
              <div className="space-y-3 mt-2">
                <div>
                  <h1 className="text-[19px] sm:text-[21px] font-bold text-black flex items-center gap-1 leading-none">
                    Duda Wolfram
                    <BadgeCheck className="h-5.5 w-5.5 text-[#00aff0] fill-current shrink-0" />
                  </h1>
                  <p className="text-[13px] sm:text-[14px] text-gray-500 mt-1.5 flex items-center gap-1.5">
                    <span>@duda_wolfram</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-400 font-medium">Active now</span>
                  </p>
                </div>

                <div className="text-[14px] sm:text-[15px] leading-relaxed text-gray-800 space-y-2">
                  <p>where you see my <span className="font-bold uppercase">NAUGHTY SIDE</span> 😈</p>
                  <p className="text-gray-400 text-[13px] sm:text-[14px]">
                    come find out why im the <span className="text-[#00aff0] font-medium">#1 girl on onlyfans</span> 🫣 📈
                  </p>
                  <button className="text-[#00aff0] font-semibold hover:underline block text-[13px] sm:text-[14px] mt-1">
                    More info
                  </button>
                </div>
              </div>
            </div>

            {/* Subscription Box - Mobile only */}
            <div className="p-4 border-t border-gray-100 md:hidden bg-gray-50/50">
              <SubscriptionBox onSubscribe={openCheckout} />
            </div>

            {/* Subscription Packs */}
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Subscription packages</p>
              <button
                onClick={() => openCheckout(25.50)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-full bg-[#00aff0] hover:bg-[#009bd6] text-[14px] font-bold text-white transition shadow-sm"
              >
                <span>3 MONTHS (15% off)</span>
                <span>$25.50 total</span>
              </button>
            </div>

            {/* Post Tabs */}
            <div className="flex border-t border-gray-100 mt-2">
              <button
                onClick={() => setActiveTab("posts")}
                className={`flex-1 py-3 text-center text-[13px] font-bold transition uppercase tracking-wider ${
                  activeTab === "posts"
                    ? "text-[#00aff0] border-b-2 border-[#00aff0]"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                513 Posts
              </button>
              <button
                onClick={() => setActiveTab("media")}
                className={`flex-1 py-3 text-center text-[13px] font-bold transition uppercase tracking-wider ${
                  activeTab === "media"
                    ? "text-[#00aff0] border-b-2 border-[#00aff0]"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                1,323 Media
              </button>
            </div>

            {/* Locked Feed Block */}
            <div className="bg-gray-50/50 py-16 flex flex-col items-center justify-center border-t border-gray-100">
              <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-3">
                <Lock className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-[14px] font-bold text-black mb-1">Subscription required</p>
              <p className="text-[12px] text-gray-500 px-6 text-center max-w-xs">
                Subscribe to get full access to Duda Wolfram's exclusive photos and videos.
              </p>
            </div>

          </div>

          {/* Sidebar Column (Desktop Only) */}
          <div className="hidden md:block space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-4">
              <SubscriptionBox onSubscribe={openCheckout} />
            </div>
            
            <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-gray-400 justify-center">
              <a href="#" className="hover:underline">onlyfans</a>
              <span>·</span>
              <a href="#" className="hover:underline">Cookie Notice</a>
              <span>·</span>
              <a href="#" className="hover:underline">Terms of Service</a>
            </div>
          </div>

        </div>
      </main>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        amount={checkoutAmount}
        paymentMethod="stripe"
      />
    </>
  );
}

function HomePage() {
  const [isBR, setIsBR] = useState<boolean | null>(null);

  useEffect(() => {
    // Read test country from URL query parameter (e.g. ?country=US)
    const urlParams = new URLSearchParams(window.location.search);
    const testCountry = urlParams.get("country");
    if (testCountry) {
      localStorage.setItem("test_country", testCountry);
      localStorage.removeItem("detected_country");
    }

    const countryToFetch = localStorage.getItem("test_country") || "";
    const fetchUrl = countryToFetch ? `/api/country?country=${countryToFetch}` : "/api/country";

    // 1. Try to fetch the country code from Vercel Geolocation API first
    fetch(fetchUrl)
      .then((res) => res.json())
      .then((data) => {
        const checkBR = data.country?.toLowerCase() === "br";
        localStorage.setItem("detected_country", checkBR ? "br" : "intl");
        setIsBR(checkBR);
        document.title = checkBR ? "Privacy | Duda Wolfram" : "OnlyFans";
      })
      .catch(() => {
        // 2. Fallback to browser language if API check fails (e.g. running Vite locally without Vercel Dev)
        const locale = navigator.language || (navigator.languages && navigator.languages[0]) || "";
        const lowerLocale = locale.toLowerCase();
        const checkBR = lowerLocale.includes("br") || lowerLocale.includes("pt");
        localStorage.setItem("detected_country", checkBR ? "br" : "intl");
        setIsBR(checkBR);
        document.title = checkBR ? "Privacy | Duda Wolfram" : "OnlyFans";
      });
  }, []);

  if (isBR === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#e89c30]" />
      </div>
    );
  }

  return isBR ? <BrazilianHomePage /> : <InternationalHomePage />;
}

function PostCard({ likeCount, onUnlock }: { likeCount: number; onUnlock: () => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      {/* Post header */}
      <div className="flex items-start justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 overflow-hidden rounded-full border border-gray-200">
            <img src={profileImg} alt="Duda Wolfram" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-black">Duda Wolfram</p>
            <p className="text-[12px] text-gray-500">@duda_wolfram</p>
          </div>
        </div>
        <button className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-black transition">
          <Ellipsis className="h-4 w-4" />
        </button>
      </div>

      {/* Locked content */}
      <div className="relative aspect-video w-full cursor-pointer overflow-hidden group" onClick={onUnlock}>
        <img
          src={contentImg}
          alt="locked content"
          className="absolute inset-0 h-full w-full object-cover blur-md scale-110 transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 z-10 bg-black/40 transition-colors group-hover:bg-black/30" />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/40 shadow-xl transition-transform group-hover:scale-110">
            <Lock className="h-6 w-6 text-white drop-shadow-md" />
          </div>
          <span className="text-[15px] font-bold text-white tracking-wide drop-shadow-md">ASSINAR PARA VER</span>
        </div>
        <div className="absolute bottom-3 left-3 z-30 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-sm border border-white/10">
          <Images className="h-4 w-4 text-[#e89c30]" />
          <span className="text-[13px] font-bold text-white">{likeCount}</span>
        </div>
      </div>

      {/* Post footer */}
      <div className="flex items-center gap-4 px-4 py-3">
        <button className="flex items-center gap-1.5 text-gray-500 transition hover:text-red-500">
          <Heart className="h-[18px] w-[18px]" />
          <span className="text-[15px] font-medium">{likeCount}</span>
        </button>
        <button className="flex items-center gap-1.5 text-gray-500 transition hover:text-gray-800">
          <MessageCircle className="h-[18px] w-[18px]" />
        </button>
        <button className="ml-auto flex items-center gap-1.5 text-gray-500 transition hover:text-[#e89c30]">
          <Bookmark className="h-[18px] w-[18px]" />
        </button>
      </div>
    </div>
  );
}

// --- Login Page ---
function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loginMutation = useLogin();
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const isBR = useCountry();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    const statusParam = params.get("status");
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
    if (statusParam === "paid") {
      setSuccessMsg(
        isBR
          ? "Assinatura realizada com sucesso! Faça login para acessar."
          : "Subscription completed successfully! Please sign in to access."
      );
    }
  }, [isBR]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const result = await loginMutation.mutateAsync({
        data: { email, password }
      });
      // @ts-ignore
      if (result.token && result.user) {
        // @ts-ignore
        login(result.token, result.user);
        setLocation("/members");
      }
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message;
      if (!isBR) {
        if (!apiMsg || apiMsg.includes("incorret") || apiMsg.includes("não encontrado")) {
          setErrorMsg("Incorrect email or password.");
        } else {
          setErrorMsg(apiMsg);
        }
      } else {
        setErrorMsg(apiMsg || "E-mail ou senha incorretos.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 pt-14">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <Link href="/">
              {isBR ? (
                <div className="inline-block text-[28px] font-extrabold tracking-[-0.08em] text-black hover:opacity-80 transition cursor-pointer">
                  privacy<span className="text-[#f59b32]">.</span>
                </div>
              ) : (
                <div className="inline-block text-[28px] font-extrabold tracking-normal text-black hover:opacity-80 transition cursor-pointer select-none">
                  only<span className="text-[#00aff0]">fans</span>
                </div>
              )}
            </Link>
            <p className="text-gray-500 text-[14px] mt-2">
              {isBR ? "Acesse sua área de membros" : "Access your members area"}
            </p>
          </div>

          {successMsg && (
            <div className="rounded-lg bg-green-50 p-3 text-[13px] text-green-700 font-medium mb-4">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                {isBR ? "E-mail" : "Email"}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] outline-none transition focus:border-[#e89c30] focus:bg-white focus:ring-1 focus:ring-[#e89c30]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                {isBR ? "Senha" : "Password"}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] outline-none transition focus:border-[#e89c30] focus:bg-white focus:ring-1 focus:ring-[#e89c30]"
              />
            </div>

            {errorMsg && (
              <div className="rounded-lg bg-red-50 p-3 text-[13px] text-red-600 font-medium">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-black py-3.5 text-[15px] font-bold text-white transition hover:bg-gray-800 disabled:opacity-70 mt-2"
            >
              {loginMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : (isBR ? "Entrar" : "Sign In")}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/">
              <div className="text-[14px] font-medium text-[#f59b32] hover:underline cursor-pointer">
                {isBR ? "Não tem conta? Assinar agora" : "Don't have an account? Subscribe now"}
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helpers for Carousel ---
const parseMediaList = (urlStr: string | null | undefined): string[] => {
  if (!urlStr) return [];
  const trimmed = urlStr.trim();
  if (trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed) as string[];
    } catch (e) {
      console.error("Failed to parse media list:", e);
    }
  }
  return [urlStr];
};

// --- Premium Post Card for Members ---
function PremiumPostCard({ content }: { content: any }) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const isBR = useCountry();

  useEffect(() => {
    const fetchStream = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/contents/${content.id}/secure-stream`, {
          headers: getAuthHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          setStreamUrl(data.streamUrl);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStream();
  }, [content.id]);

  const mediaUrls = parseMediaList(streamUrl);
  const hasMultiple = mediaUrls.length > 1;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev < mediaUrls.length - 1 ? prev + 1 : prev));
  };

  const getMediaType = (url: string) => {
    return url.includes("video") || url.endsWith(".mp4") || url.endsWith(".mov") || url.endsWith(".webm") || url.includes("data:video") ? "video" : "image";
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm mt-4">
      {/* Post header */}
      <div className="flex items-start justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 overflow-hidden rounded-full border border-gray-200 bg-gradient-to-br from-[#e89c30] to-[#f5c842] flex items-center justify-center text-white text-[12px] font-bold uppercase shadow-sm">
            DW
          </div>
          <div>
            <p className="text-[14px] font-semibold text-black">Duda Wolfram</p>
            <p className="text-[12px] text-gray-500">@duda_wolfram</p>
          </div>
        </div>
      </div>

      {/* Unlocked Content Area */}
      <div className="relative w-full bg-black flex items-center justify-center overflow-hidden aspect-square select-none">
        {loading ? (
          <div className="flex flex-col items-center gap-2 aspect-square justify-center w-full bg-gray-900 text-white">
            <Loader2 className="h-6 w-6 animate-spin text-[#e89c30]" />
            <span className="text-[12px] text-gray-400">
              {isBR ? "Carregando mídia..." : "Loading media..."}
            </span>
          </div>
        ) : mediaUrls.length > 0 ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Active Media */}
            {getMediaType(mediaUrls[activeIndex]) === "video" ? (
              <video
                key={mediaUrls[activeIndex]}
                src={mediaUrls[activeIndex]}
                className="w-full h-full object-contain bg-black"
                controls
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                playsInline
              />
            ) : (
              <img
                src={mediaUrls[activeIndex]}
                alt={`${content.title} - ${activeIndex + 1}`}
                className="w-full h-full object-contain"
              />
            )}

            {/* Left/Right Navigation Arrows */}
            {hasMultiple && activeIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition shadow-lg border border-white/10 cursor-pointer"
              >
                <ChevronDown className="h-4 w-4 rotate-90" />
              </button>
            )}
            {hasMultiple && activeIndex < mediaUrls.length - 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition shadow-lg border border-white/10 cursor-pointer"
              >
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </button>
            )}

            {/* Dots Indicator */}
            {hasMultiple && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1 bg-black/40 px-2.5 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                {mediaUrls.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-1.5 w-1.5 rounded-full transition-all ${
                      idx === activeIndex ? "bg-[#e89c30] scale-120" : "bg-white/60"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Index Counter */}
            {hasMultiple && (
              <div className="absolute top-3 right-3 z-10 bg-black/60 px-2 py-1 rounded-full text-[11px] font-bold text-white tracking-wide border border-white/10">
                {activeIndex + 1}/{mediaUrls.length}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 text-center text-gray-400 aspect-square justify-center w-full bg-gray-50">
            <Lock className="h-6 w-6" />
            <span className="text-[12px]">
              {isBR ? "Conteúdo indisponível" : "Content unavailable"}
            </span>
          </div>
        )}
      </div>

      {/* Post details */}
      <div className="px-4 py-3 border-t border-gray-100">
        <h3 className="text-[15px] font-bold text-black">{content.title}</h3>
        {content.description && (
          <p className="text-[13px] text-gray-600 mt-1 leading-relaxed">{content.description}</p>
        )}
        <p className="text-[11px] text-gray-400 mt-2">
          {isBR ? "Publicado em " : "Published on "}
          {new Date(content.createdAt).toLocaleDateString(isBR ? "pt-BR" : "en-US")}
        </p>
      </div>

    </div>
  );
}

// --- Members Page ---
function MembersPage() {
  const { user, token } = useAuth();
  const isBR = useCountry();

  if (!token || !user) {
    return <Redirect to="/login" />;
  }

  const { data, isLoading } = useGetMyAccess();
  const { data: contents, isLoading: loadingContents } = useListContents();

  return (
    <div className="min-h-screen bg-gray-100 pt-14 pb-12">
      <div className="mx-auto max-w-[480px] px-4 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#e89c30]" />
            <p className="text-gray-500 text-sm mt-4">
              {isBR ? "Carregando seus acessos..." : "Loading your subscription details..."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data?.hasAccess ? (
              <div className="mt-2">
                <h2 className="text-[18px] font-bold text-black tracking-tight mb-4">
                  {isBR ? "Feed Exclusivo" : "Exclusive Feed"}
                </h2>

                {loadingContents ? (
                  <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <Loader2 className="h-6 w-6 animate-spin text-[#e89c30]" />
                    <p className="text-gray-400 text-[12px] mt-2">
                      {isBR ? "Carregando feed..." : "Loading feed..."}
                    </p>
                  </div>
                ) : !contents?.length ? (
                  <div className="p-10 text-center bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <Film className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm font-medium">
                      {isBR ? "Nenhum conteúdo publicado ainda." : "No content published yet."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contents.map((content: any) => (
                      <PremiumPostCard key={content.id} content={content} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-[18px] font-bold text-black mb-2">
                  {isBR ? "Nenhum acesso ativo" : "No active subscription"}
                </h3>
                <p className="text-[15px] text-gray-500 mb-6">
                  {isBR
                    ? "Aguardando confirmação do pagamento ou sua assinatura expirou."
                    : "Awaiting payment confirmation or your subscription has expired."}
                </p>
                <Link href="/">
                  <button className="rounded-xl bg-black px-6 py-3 text-[14px] font-bold text-white transition hover:bg-gray-800">
                    {isBR ? "Voltar para início" : "Back to home"}
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// ============================================================================
// ADMIN PAGE
// ============================================================================

type AdminTab = "dashboard" | "orders" | "users" | "contents";

function AdminPage() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [showNewContent, setShowNewContent] = useState(false);

  if (!token || !user) return <Redirect to="/login" />;
  if (user.role !== "admin") return <Redirect to="/members" />;

  return (
    <div className="min-h-screen bg-gray-50 pt-14">
      {/* Admin top bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-2">
        <Shield className="h-4 w-4 text-[#e89c30]" />
        <span className="text-[14px] font-bold text-black">Painel Administrativo</span>
        <span className="ml-auto text-[12px] text-gray-400 font-medium">{user.email}</span>
      </div>

      {/* Tabs nav */}
      <div className="bg-white border-b border-gray-100 px-4 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {(
            [
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "orders", label: "Pedidos", icon: ShoppingCart },
              { id: "users", label: "Usuários", icon: Users },
              { id: "contents", label: "Conteúdos", icon: Film },
            ] as { id: AdminTab; label: string; icon: React.ElementType }[]
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-[14px] font-semibold border-b-2 transition whitespace-nowrap ${activeTab === id
                  ? "border-[#e89c30] text-[#e89c30]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {activeTab === "dashboard" && <AdminDashboard />}
        {activeTab === "orders" && <AdminOrders />}
        {activeTab === "users" && <AdminUsers />}
        {activeTab === "contents" && (
          <AdminContents showNew={showNewContent} setShowNew={setShowNewContent} />
        )}
      </div>
    </div>
  );
}

// --- Admin Dashboard ---
function AdminDashboard() {
  const { data, isLoading } = useGetAdminStats();

  const cards = [
    {
      label: "Total de Pedidos",
      value: data?.totalOrders ?? 0,
      sub: `${data?.paidOrders ?? 0} pagos`,
      icon: ShoppingCart,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "Receita Total",
      value: `R$ ${((data?.totalRevenue ?? 0) / 100).toFixed(2).replace(".", ",")}`,
      sub: "apenas pagos",
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Usuários",
      value: data?.totalUsers ?? 0,
      sub: `${data?.totalAccesses ?? 0} com acesso ativo`,
      icon: Users,
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
    {
      label: "Conteúdos",
      value: data?.totalContents ?? 0,
      sub: "cadastrados",
      icon: Film,
      color: "text-[#e89c30]",
      bg: "bg-orange-50",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#e89c30]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-[20px] font-bold text-black tracking-tight">Visão Geral</h2>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${card.bg}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <p className="text-[22px] font-bold text-black leading-none">{card.value}</p>
            <p className="text-[12px] font-semibold text-gray-500 leading-tight">{card.label}</p>
            <p className="text-[11px] text-gray-400">{card.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Admin Orders ---
function AdminOrders() {
  const { data, isLoading } = useListAdminOrders();

  const statusColor: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    expired: "bg-gray-100 text-gray-500",
    failed: "bg-red-100 text-red-600",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#e89c30]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-bold text-black tracking-tight">Pedidos</h2>
        <span className="text-[13px] text-gray-500">{data?.length ?? 0} total</span>
      </div>
      <div className="space-y-2">
        {!data?.length ? (
          <EmptyState icon={ShoppingCart} message="Nenhum pedido encontrado." />
        ) : (
          data.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-black truncate">{order.email}</p>
                  <p className="text-[12px] text-gray-400 font-mono mt-0.5 truncate">{order.externalId}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${statusColor[order.status] ?? "bg-gray-100 text-gray-500"
                    }`}
                >
                  {order.status}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className="text-[15px] font-bold text-black">
                  R$ {((order.amount ?? 0) / 100).toFixed(2).replace(".", ",")}
                </span>
                <span className="text-[12px] text-gray-400">
                  {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// --- Admin Users ---
function AdminUsers() {
  const { data, isLoading } = useListAdminUsers();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#e89c30]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-bold text-black tracking-tight">Usuários</h2>
        <span className="text-[13px] text-gray-500">{data?.length ?? 0} total</span>
      </div>
      <div className="space-y-2">
        {!data?.length ? (
          <EmptyState icon={Users} message="Nenhum usuário cadastrado." />
        ) : (
          data.map((u) => (
            <div key={u.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-[#e89c30]/70 to-[#f5c842]/70 flex items-center justify-center text-white text-[13px] font-bold uppercase shadow-sm">
                {u.email.substring(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-black truncate">{u.email}</p>
                <p className="text-[12px] text-gray-400 mt-0.5">
                  Desde {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${u.role === "admin"
                    ? "bg-orange-100 text-[#e89c30]"
                    : "bg-gray-100 text-gray-500"
                  }`}
              >
                {u.role}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// --- Admin Contents ---
interface MultiFileDropZoneProps {
  id: string;
  previewUrls: string[];
  uploading: boolean;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onFilesSelect: (files: File[]) => void;
  onRemove: (index: number) => void;
  placeholderText: string;
  isRequired?: boolean;
}

function MultiFileDropZone({
  previewUrls,
  uploading,
  dragOver,
  setDragOver,
  onFilesSelect,
  onRemove,
  placeholderText,
}: MultiFileDropZoneProps) {
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragOver(true);
    } else if (e.type === "dragleave") {
      setDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelect(Array.from(e.dataTransfer.files));
    }
  };

  const getMediaType = (url: string) => {
    return url.includes("video") || url.endsWith(".mp4") || url.endsWith(".mov") || url.endsWith(".webm") || url.includes("data:video") ? "video" : "image";
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`relative flex-1 flex flex-col border-2 border-dashed rounded-xl transition bg-white min-h-[140px] p-3 ${
        dragOver ? "border-[#e89c30] bg-orange-50/20" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{placeholderText}</span>
        <label className="cursor-pointer text-[11px] font-bold text-[#e89c30] hover:text-[#d48a20] transition select-none">
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onFilesSelect(Array.from(e.target.files));
              }
            }}
          />
          + Adicionar mídia
        </label>
      </div>

      {previewUrls.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          {uploading ? (
            <Loader2 className="h-6 w-6 text-[#e89c30] animate-spin mb-2" />
          ) : (
            <Upload className="h-6 w-6 text-gray-400 mb-2" />
          )}
          <p className="text-[12px] font-semibold text-gray-700">Arraste arquivos ou clique em "+ Adicionar mídia"</p>
          <p className="text-[10px] text-gray-400 mt-1">Imagens e vídeos permitidos</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto max-h-[160px] pr-1">
          <div className="grid grid-cols-3 gap-2">
            {previewUrls.map((url, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-100 group bg-black">
                {getMediaType(url) === "video" ? (
                  <video
                    src={url}
                    className="w-full h-full object-cover"
                    controls={false}
                    muted
                  />
                ) : (
                  <img src={url} className="w-full h-full object-cover" alt={`Preview ${idx}`} />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                  <button
                    type="button"
                    onClick={() => onRemove(idx)}
                    className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-lg cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="absolute top-1 left-1 bg-black/60 text-white px-1.5 py-0.5 rounded text-[9px] font-bold select-none">
                  {idx + 1}
                </span>
              </div>
            ))}
            {uploading && (
              <div className="aspect-square rounded-lg border border-dashed border-orange-300 flex items-center justify-center bg-orange-50/10">
                <Loader2 className="h-5 w-5 text-[#e89c30] animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminContents({
  showNew,
  setShowNew,
}: {
  showNew: boolean;
  setShowNew: (v: boolean) => void;
}) {
  const { data, isLoading, refetch } = useListAdminContents();
  const createMutation = useCreateContent();
  const updateMutation = useUpdateContent();
  const deleteMutation = useDeleteContent();

  const [editingContent, setEditingContent] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const isEdit = !!editingContent;

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "album",
    price: "",
    teaserUrl: "",
    privateFolderKey: "",
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  // Upload states
  const [teaserPreviews, setTeaserPreviews] = useState<string[]>([]);
  const [uploadingTeaser, setUploadingTeaser] = useState(false);
  const [dragOverTeaser, setDragOverTeaser] = useState(false);

  const [privatePreviews, setPrivatePreviews] = useState<string[]>([]);
  const [uploadingPrivate, setUploadingPrivate] = useState(false);
  const [dragOverPrivate, setDragOverPrivate] = useState(false);

  const resetForm = () => {
    setForm({ title: "", description: "", type: "album", price: "", teaserUrl: "", privateFolderKey: "" });
    setTeaserPreviews([]);
    setUploadingTeaser(false);
    setPrivatePreviews([]);
    setUploadingPrivate(false);
    setFormError("");
    setFormSuccess(false);
  };

  const handleClose = () => {
    setShowNew(false);
    setEditingContent(null);
    resetForm();
  };

  const handleEditClick = (content: any) => {
    setEditingContent(content);
    const teasers = parseMediaList(content.teaserUrl);
    const privates = parseMediaList(content.privateFolderKey);

    setForm({
      title: content.title || "",
      description: content.description || "",
      type: content.type || "album",
      price: content.price != null ? (content.price / 100).toString() : "",
      teaserUrl: content.teaserUrl || "",
      privateFolderKey: content.privateFolderKey || "",
    });
    setTeaserPreviews(teasers);
    setPrivatePreviews(privates);
  };

  const handleFilesChange = async (files: File[], isTeaser: boolean) => {
    if (isTeaser) {
      setUploadingTeaser(true);
    } else {
      setUploadingPrivate(true);
    }

    try {
      const supabaseUrl = "https://tswqkbfetbsayjcavuoc.supabase.co";
      const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzd3FrYmZldGJzYXlqY2F2dW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzOTE3MjksImV4cCI6MjA5NDk2NzcyOX0.CqCDzFEg_3Blgf-0nTHSMDnuNwzsKK65LNZsjJ7rnec";
      const bucketName = "Duda-bucket";

      const uploadedUrls: string[] = [];

      for (const file of files) {
        const localPreviewUrl = URL.createObjectURL(file);
        
        // Show local preview immediately in loading state
        if (isTeaser) {
          setTeaserPreviews(prev => [...prev, localPreviewUrl]);
        } else {
          setPrivatePreviews(prev => [...prev, localPreviewUrl]);
          // Auto-detect type
          const isVideo = file.type.startsWith("video/");
          setForm(prev => ({ ...prev, type: isVideo ? "video" : "album" }));
        }

        const ext = file.name.split('.').pop() || 'bin';
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${ext}`;
        const filePath = `uploads/${uniqueName}`;

        const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${filePath}`;

        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${anonKey}`,
            "apikey": anonKey,
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || "Erro no upload para o Supabase");
        }

        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;
        uploadedUrls.push(publicUrl);

        // Swap local preview for Supabase URL
        if (isTeaser) {
          setTeaserPreviews(prev => prev.map(u => u === localPreviewUrl ? publicUrl : u));
        } else {
          setPrivatePreviews(prev => prev.map(u => u === localPreviewUrl ? publicUrl : u));
        }
      }

      // Update form arrays
      if (isTeaser) {
        setForm(prev => {
          const current = parseMediaList(prev.teaserUrl);
          const updated = [...current, ...uploadedUrls];
          return { ...prev, teaserUrl: JSON.stringify(updated) };
        });
      } else {
        setForm(prev => {
          const current = parseMediaList(prev.privateFolderKey);
          const updated = [...current, ...uploadedUrls];
          return { ...prev, privateFolderKey: JSON.stringify(updated) };
        });
      }
    } catch (err: any) {
      console.error(err);
      setFormError(isTeaser
        ? `Erro ao subir mídias de teaser: ${err.message || err}`
        : `Erro ao subir mídias exclusivas: ${err.message || err}`
      );
      // Clean up local previews that failed
      if (isTeaser) {
        setTeaserPreviews(prev => prev.filter(u => u.startsWith("http")));
      } else {
        setPrivatePreviews(prev => prev.filter(u => u.startsWith("http")));
      }
    } finally {
      if (isTeaser) {
        setUploadingTeaser(false);
      } else {
        setUploadingPrivate(false);
      }
    }
  };

  const handleRemoveMedia = (index: number, isTeaser: boolean) => {
    if (isTeaser) {
      setTeaserPreviews(prev => {
        const updated = prev.filter((_, idx) => idx !== index);
        setForm(formPrev => ({ ...formPrev, teaserUrl: updated.length > 0 ? JSON.stringify(updated) : "" }));
        return updated;
      });
    } else {
      setPrivatePreviews(prev => {
        const updated = prev.filter((_, idx) => idx !== index);
        setForm(formPrev => ({ ...formPrev, privateFolderKey: updated.length > 0 ? JSON.stringify(updated) : "" }));
        return updated;
      });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess(false);

    if (!form.title) {
      setFormError("O campo título é obrigatório.");
      return;
    }
    
    const privateUrls = parseMediaList(form.privateFolderKey);
    if (privateUrls.length === 0) {
      setFormError("O conteúdo exclusivo é obrigatório.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        data: {
          title: form.title,
          description: form.description || undefined,
          type: form.type as "album" | "video",
          price: form.price ? Number(form.price) : undefined,
          teaserUrl: form.teaserUrl || undefined,
          privateFolderKey: form.privateFolderKey || undefined,
        },
      });
      setFormSuccess(true);
      refetch();
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch {
      setFormError("Erro ao criar conteúdo. Verifique os dados e tente novamente.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess(false);

    if (!form.title) {
      setFormError("O campo título é obrigatório.");
      return;
    }
    
    const privateUrls = parseMediaList(form.privateFolderKey);
    if (privateUrls.length === 0) {
      setFormError("O conteúdo exclusivo é obrigatório.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        data: {
          id: editingContent.id,
          title: form.title,
          description: form.description || undefined,
          type: form.type as "album" | "video",
          price: form.price ? Number(form.price) : undefined,
          teaserUrl: form.teaserUrl || undefined,
          privateFolderKey: form.privateFolderKey || undefined,
        },
      });
      setFormSuccess(true);
      refetch();
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch {
      setFormError("Erro ao atualizar conteúdo. Verifique os dados e tente novamente.");
    }
  };

  const showModal = showNew || isEdit;
  const isPending = createMutation.isPending || updateMutation.isPending;
  const isSubmitDisabled = uploadingTeaser || uploadingPrivate || isPending || !form.title || parseMediaList(form.privateFolderKey).length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-bold text-black tracking-tight">Conteúdos</h2>
        <button
          onClick={() => setShowNew(!showNew)}
          className="flex items-center gap-1.5 rounded-xl bg-[#e89c30] px-3 py-2 text-[13px] font-bold text-white hover:bg-[#d48a20] transition"
        >
          <Plus className="h-4 w-4" />
          Novo
        </button>
      </div>

      {/* Instagram-style creation/edition dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity cursor-default"
            onClick={() => {
              if (!uploadingTeaser && !uploadingPrivate && !isPending) {
                handleClose();
              }
            }}
          />

          {/* Instagram-style dialog container */}
          <div className="relative w-full max-w-[850px] h-[550px] bg-white rounded-2xl shadow-2xl z-10 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="h-12 border-b border-gray-100 flex items-center justify-between px-4 shrink-0 bg-white">
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-500 hover:text-black transition"
              >
                <X className="h-5 w-5" />
              </button>
              <span className="text-[15px] font-bold text-black">
                {isEdit ? "Editar publicação" : "Criar nova publicação"}
              </span>
              <button
                onClick={isEdit ? handleSave : handleCreate}
                disabled={isSubmitDisabled}
                className="text-[14px] font-bold text-[#e89c30] hover:text-[#d48a20] disabled:opacity-40 transition"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEdit ? "Salvar" : "Compartilhar")}
              </button>
            </div>

            {/* Two Column Layout */}
            <div className="flex-1 flex overflow-hidden">

              {/* Left Side: Upload zones (Media Previews) */}
              <div className="flex-1 bg-gray-50 border-r border-gray-100 p-5 overflow-y-auto flex flex-col gap-4">

                {/* Teaser Upload Slot */}
                <div className="flex-1 flex flex-col min-h-0">
                  <MultiFileDropZone
                    id="teaser-drop"
                    previewUrls={teaserPreviews}
                    uploading={uploadingTeaser}
                    dragOver={dragOverTeaser}
                    setDragOver={setDragOverTeaser}
                    onFilesSelect={(files) => handleFilesChange(files, true)}
                    onRemove={(index) => handleRemoveMedia(index, true)}
                    placeholderText="1. Capa Grátis / Teaser (Público)"
                  />
                </div>

                {/* Premium Content Upload Slot */}
                <div className="flex-1 flex flex-col min-h-0">
                  <MultiFileDropZone
                    id="private-drop"
                    previewUrls={privatePreviews}
                    uploading={uploadingPrivate}
                    dragOver={dragOverPrivate}
                    setDragOver={setDragOverPrivate}
                    onFilesSelect={(files) => handleFilesChange(files, false)}
                    onRemove={(index) => handleRemoveMedia(index, false)}
                    placeholderText="2. Conteúdo Exclusivo (Premium) *"
                    isRequired
                  />
                </div>
              </div>

              {/* Right Side: Form details (Legenda, Título, Preço) */}
              <div className="w-[340px] flex flex-col bg-white p-5 overflow-y-auto shrink-0 justify-between">

                <div className="space-y-4">
                  {/* Admin Row */}
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-[#e89c30] to-[#f5c842] flex items-center justify-center text-white text-[11px] font-bold uppercase shadow-sm">
                      AD
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-black">Administrador</p>
                      <p className="text-[11px] text-gray-400">@admin</p>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Título *</label>
                    <input
                      required
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[14px] outline-none focus:border-[#e89c30] focus:bg-white transition"
                      placeholder="Título da publicação"
                    />
                  </div>

                  {/* Description (Caption style) */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Legenda / Descrição</label>
                    <textarea
                      rows={4}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[14px] outline-none focus:border-[#e89c30] focus:bg-white transition resize-none"
                      placeholder="Escreva uma legenda descritiva..."
                    />
                  </div>

                  {/* Row with Price and Type */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Preço (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[14px] outline-none focus:border-[#e89c30] focus:bg-white transition"
                        placeholder="29,90"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Tipo Detectado</label>
                      <select
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[14px] outline-none focus:border-[#e89c30] focus:bg-white transition"
                      >
                        <option value="album">Álbum (Fotos)</option>
                        <option value="video">Vídeo</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Feedback section at the bottom */}
                <div className="pt-4 mt-auto border-t border-gray-100 bg-white">
                  {formError && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-[12px] text-red-600 font-medium mb-3">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span className="truncate">{formError}</span>
                    </div>
                  )}
                  {formSuccess && (
                    <div className="flex items-center gap-2 rounded-lg bg-green-50 p-2.5 text-[12px] text-green-700 font-medium mb-3">
                      <BadgeCheck className="h-4 w-4 shrink-0" />
                      {isEdit ? "Publicação salva com sucesso!" : "Publicação compartilhada!"}
                    </div>
                  )}

                  <button
                    onClick={isEdit ? handleSave : handleCreate}
                    disabled={isSubmitDisabled}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-black py-3 text-[14px] font-bold text-white transition hover:bg-gray-800 disabled:opacity-40"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEdit ? "Salvar Alterações" : "Publicar Conteúdo")}
                  </button>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeletingId(null)} />
          <div className="relative w-full max-w-[400px] bg-white rounded-2xl p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-[16px] font-bold text-black">Excluir conteúdo?</h3>
            <p className="text-[14px] text-gray-500 mt-2">
              Tem certeza que deseja excluir esta publicação? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-[14px] font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  try {
                    await deleteMutation.mutateAsync({ params: { id: deletingId } });
                    refetch();
                    setDeletingId(null);
                  } catch (err) {
                    console.error(err);
                  }
                }}
                disabled={deleteMutation.isPending}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-[14px] font-semibold text-white hover:bg-red-700 transition flex items-center justify-center gap-1.5"
              >
                {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contents list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#e89c30]" />
        </div>
      ) : !data?.length ? (
        <EmptyState icon={Film} message="Nenhum conteúdo cadastrado ainda." />
      ) : (
        <div className="space-y-2">
          {data.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3">
              <div
                className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${c.type === "video" ? "bg-purple-50" : "bg-orange-50"
                  }`}
              >
                {c.type === "video" ? (
                  <Play className="h-5 w-5 text-purple-500" />
                ) : (
                  <Images className="h-5 w-5 text-[#e89c30]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-black truncate">{c.title}</p>
                {c.description && (
                  <p className="text-[12px] text-gray-400 mt-0.5 line-clamp-1">{c.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${c.type === "video" ? "bg-purple-100 text-purple-600" : "bg-orange-100 text-[#e89c30]"
                    }`}>
                    {c.type === "video" ? "Vídeo" : "Álbum"}
                  </span>
                  {c.price != null && (
                    <span className="text-[12px] font-semibold text-black">
                      R$ {(c.price / 100).toFixed(2).replace(".", ",")}
                    </span>
                  )}
                  <span className="text-[11px] text-gray-400 ml-auto">
                    #{c.id} · {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 self-center">
                <button
                  type="button"
                  onClick={() => handleEditClick(c)}
                  className="p-2 text-gray-400 hover:text-[#e89c30] hover:bg-orange-50 rounded-xl transition cursor-pointer"
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingId(c.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Shared empty state ---
function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-10 flex flex-col items-center justify-center gap-3 text-center">
      <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center">
        <Icon className="h-7 w-7 text-gray-300" />
      </div>
      <p className="text-[14px] text-gray-500 font-medium">{message}</p>
    </div>
  );
}

// ============================================================================
// APP ROOT
// ============================================================================

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-white">
          <Header />
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/login" component={LoginPage} />
            <Route path="/members" component={MembersPage} />
            <Route path="/admin" component={AdminPage} />
            <Route>
              <Redirect to="/" />
            </Route>
          </Switch>
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}
