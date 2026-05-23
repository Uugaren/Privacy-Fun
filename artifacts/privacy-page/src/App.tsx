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
  setAuthTokenGetter,
} from "@workspace/api-client-react";

// Register global token getter so every API call automatically includes auth
setAuthTokenGetter(() => localStorage.getItem("privacy_token"));

import profileImg from "./assets/profile-img.png";
import coverImg from "./assets/cover-img.png";
import contentImg from "./assets/content-img.png";

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
export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("privacy_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ============================================================================
// COMPONENTS
// ============================================================================

// --- Header ---
function Header() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between bg-white border-b border-gray-100 px-4">
      <Link href="/" className="text-[20px] font-extrabold tracking-[-0.08em] text-black">
        privacy<span className="text-[#f59b32]">.</span>
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
                      Área de Membros
                    </div>
                  </Link>
                  {user?.role === "admin" && (
                    <Link href="/admin" onClick={() => setMenuOpen(false)}>
                      <div className="flex items-center gap-2 w-full px-4 py-2.5 text-[14px] font-medium text-[#e89c30] hover:bg-orange-50">
                        <Shield className="h-4 w-4" />
                        Painel Admin
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
                    Sair
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
  amount 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  amount: number;
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
      setErrorMsg("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("As senhas não coincidem.");
      return;
    }

    try {
      await checkoutMutation.mutateAsync({
        data: {
          email,
          password,
          amount
        }
      });
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || "Erro ao gerar cobrança. Tente novamente.");
    }
  };

  const copyPix = () => {
    if (checkoutMutation.data?.pix_copy_paste) {
      navigator.clipboard.writeText(checkoutMutation.data.pix_copy_paste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
              {step === 1 ? "Complete sua assinatura" : "Pagamento via Pix"}
            </h2>
            <p className="text-[14px] text-gray-500 mt-1">
              {step === 1 ? `Plano selecionado: R$ ${amount.toFixed(2).replace('.', ',')}` : "Escaneie ou copie o código abaixo"}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="Seu melhor e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] outline-none transition focus:border-[#e89c30] focus:bg-white focus:ring-1 focus:ring-[#e89c30]"
                />
                <input
                  type="password"
                  required
                  placeholder="Crie uma senha (min. 6 caracteres)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] outline-none transition focus:border-[#e89c30] focus:bg-white focus:ring-1 focus:ring-[#e89c30]"
                />
                <input
                  type="password"
                  required
                  placeholder="Confirme sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                disabled={checkoutMutation.isPending}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#23c55e] py-3.5 text-[15px] font-bold text-white transition hover:bg-[#1fa951] disabled:opacity-70 mt-2"
              >
                {checkoutMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Gerar Pix"
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

function HomePage() {
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
                    alt="Emilly Faria"
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
                  Emilly Faria
                </h1>
                <p className="text-[15px] text-gray-500">@millyfaria4</p>
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
                Só fica quem tem coragem de desvendar cada segredinho da sua Loirinha.... vem? 😜
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

            <button 
              onClick={() => openCheckout(148.87)}
              className="w-full rounded-xl border border-gray-200 bg-white py-3.5 text-[15px] font-semibold text-black transition hover:bg-gray-50"
            >
              ★ Ligar agora para Milly?
            </button>
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
                { label: "Chamada de vídeo (1h)", price: "R$ 148,87", amount: 148.87 },
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
              className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-3.5 text-[15px] font-semibold transition ${
                activeTab === "fotos"
                  ? "text-[#e89c30] border-b-2 border-[#e89c30]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Images className={`h-[18px] w-[18px] ${activeTab === "fotos" ? "text-[#e89c30]" : "text-gray-400"}`} />
              Fotos
            </button>
            <button
              onClick={() => setActiveTab("videos")}
              className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-3.5 text-[15px] font-semibold transition ${
                activeTab === "videos"
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
            className={`flex items-center gap-2.5 rounded-2xl border border-gray-100 bg-white px-3 py-2.5 shadow-lg ${
              toast.exiting ? "toast-exit" : "toast-enter"
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
      />
    </>
  );
}

function PostCard({ likeCount, onUnlock }: { likeCount: number; onUnlock: () => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      {/* Post header */}
      <div className="flex items-start justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 overflow-hidden rounded-full border border-gray-200">
            <img src={profileImg} alt="Emilly Faria" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-black">Emilly Faria</p>
            <p className="text-[12px] text-gray-500">@millyfaria4</p>
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
  
  const loginMutation = useLogin();
  const { login } = useAuth();
  const [, setLocation] = useLocation();

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
      setErrorMsg(err?.response?.data?.message || "E-mail ou senha incorretos.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 pt-14">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <Link href="/">
              <div className="inline-block text-[28px] font-extrabold tracking-[-0.08em] text-black hover:opacity-80 transition cursor-pointer">
                privacy<span className="text-[#f59b32]">.</span>
              </div>
            </Link>
            <p className="text-gray-500 text-[14px] mt-2">Acesse sua área de membros</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] outline-none transition focus:border-[#e89c30] focus:bg-white focus:ring-1 focus:ring-[#e89c30]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Senha</label>
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
              {loginMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/">
              <div className="text-[14px] font-medium text-[#f59b32] hover:underline cursor-pointer">
                Não tem conta? Assinar agora
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Premium Post Card for Members ---
function PremiumPostCard({ content }: { content: any }) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const isVideo = content.type === "video" || (streamUrl && (streamUrl.includes(".mp4") || streamUrl.includes(".mov") || streamUrl.includes(".webm")));

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm mt-4">
      {/* Post header */}
      <div className="flex items-start justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 overflow-hidden rounded-full border border-gray-200 bg-gradient-to-br from-[#e89c30] to-[#f5c842] flex items-center justify-center text-white text-[12px] font-bold uppercase shadow-sm">
            EF
          </div>
          <div>
            <p className="text-[14px] font-semibold text-black">Emilly Faria</p>
            <p className="text-[12px] text-gray-500">@millyfaria4</p>
          </div>
        </div>
      </div>

      {/* Unlocked Content Area */}
      <div className="relative aspect-video w-full bg-gray-50 flex items-center justify-center overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-[#e89c30]" />
            <span className="text-[12px] text-gray-400">Carregando mídia...</span>
          </div>
        ) : streamUrl ? (
          isVideo ? (
            <video
              src={streamUrl}
              className="w-full h-full object-cover"
              controls
              playsInline
            />
          ) : (
            <img
              src={streamUrl}
              alt={content.title}
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 text-center text-gray-400">
            <Lock className="h-6 w-6" />
            <span className="text-[12px]">Conteúdo indisponível</span>
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
          Publicado em {new Date(content.createdAt).toLocaleDateString("pt-BR")}
        </p>
      </div>

    </div>
  );
}

// --- Members Page ---
function MembersPage() {
  const { user, token } = useAuth();
  
  if (!token || !user) {
    return <Redirect to="/login" />;
  }

  const { data, isLoading } = useGetMyAccess();
  const { data: contents, isLoading: loadingContents } = useListContents();

  return (
    <div className="min-h-screen bg-gray-50 pt-14 pb-12">
      <div className="mx-auto max-w-[480px] px-4 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#e89c30]" />
            <p className="text-gray-500 text-sm mt-4">Carregando seus acessos...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data?.hasAccess ? (
              <div className="mt-2">
                <h2 className="text-[18px] font-bold text-black tracking-tight mb-4">Feed Exclusivo</h2>
                
                {loadingContents ? (
                  <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <Loader2 className="h-6 w-6 animate-spin text-[#e89c30]" />
                    <p className="text-gray-400 text-[12px] mt-2">Carregando feed...</p>
                  </div>
                ) : !contents?.length ? (
                  <div className="p-10 text-center bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <Film className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm font-medium">Nenhum conteúdo publicado ainda.</p>
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
                <h3 className="text-[18px] font-bold text-black mb-2">Nenhum acesso ativo</h3>
                <p className="text-[15px] text-gray-500 mb-6">
                  Aguardando confirmação do pagamento ou sua assinatura expirou.
                </p>
                <Link href="/">
                  <button className="rounded-xl bg-black px-6 py-3 text-[14px] font-bold text-white transition hover:bg-gray-800">
                    Voltar para início
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
              className={`flex items-center gap-1.5 px-4 py-3.5 text-[14px] font-semibold border-b-2 transition whitespace-nowrap ${
                activeTab === id
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
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                    statusColor[order.status] ?? "bg-gray-100 text-gray-500"
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
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  u.role === "admin"
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
interface FileDropZoneProps {
  id: string;
  previewUrl: string;
  uploading: boolean;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  placeholderText: string;
  isRequired?: boolean;
}

function FileDropZone({
  previewUrl,
  uploading,
  dragOver,
  setDragOver,
  onFileSelect,
  onRemove,
  placeholderText,
}: FileDropZoneProps) {
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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const isVideoPreview = previewUrl.includes("video") || previewUrl.endsWith(".mp4") || previewUrl.endsWith(".mov") || previewUrl.endsWith(".webm") || previewUrl.includes("data:video");

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`relative flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition overflow-hidden min-h-[140px] bg-white ${
        dragOver ? "border-[#e89c30] bg-orange-50/20" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      {previewUrl ? (
        <div className="absolute inset-0 w-full h-full group">
          {isVideoPreview ? (
            <video 
              src={previewUrl} 
              className="w-full h-full object-cover" 
              controls={false}
              muted
              loop
              autoPlay
            />
          ) : (
            <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
          )}
          
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition gap-2">
            {uploading ? (
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            ) : (
              <button
                type="button"
                onClick={onRemove}
                className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-lg"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <label className="cursor-pointer flex flex-col items-center text-center p-4 w-full h-full justify-center">
          <input
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onFileSelect(e.target.files[0]);
              }
            }}
          />
          <Upload className="h-6 w-6 text-gray-400 mb-2" />
          <p className="text-[12px] font-semibold text-gray-700">{placeholderText}</p>
          <p className="text-[10px] text-gray-400 mt-1">Arrastar e soltar ou clique para escolher</p>
        </label>
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
  const { data, isLoading, refetch } = useListContents();
  const createMutation = useCreateContent();

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

  // Upload state
  const [, setTeaserFile] = useState<File | null>(null);
  const [teaserPreview, setTeaserPreview] = useState<string>("");
  const [uploadingTeaser, setUploadingTeaser] = useState(false);
  const [dragOverTeaser, setDragOverTeaser] = useState(false);

  const [, setPrivateFile] = useState<File | null>(null);
  const [privatePreview, setPrivatePreview] = useState<string>("");
  const [uploadingPrivate, setUploadingPrivate] = useState(false);
  const [dragOverPrivate, setDragOverPrivate] = useState(false);

  const resetForm = () => {
    setForm({ title: "", description: "", type: "album", price: "", teaserUrl: "", privateFolderKey: "" });
    setTeaserFile(null);
    setTeaserPreview("");
    setUploadingTeaser(false);
    setPrivateFile(null);
    setPrivatePreview("");
    setUploadingPrivate(false);
    setFormError("");
    setFormSuccess(false);
  };

  const handleFileChange = async (file: File, isTeaser: boolean) => {
    // 1. Show preview instantly
    const previewUrl = URL.createObjectURL(file);
    if (isTeaser) {
      setTeaserFile(file);
      setTeaserPreview(previewUrl);
      setUploadingTeaser(true);
    } else {
      setPrivateFile(file);
      setPrivatePreview(previewUrl);
      setUploadingPrivate(true);
      
      // Auto-detect type
      const isVideo = file.type.startsWith("video/");
      setForm(prev => ({ ...prev, type: isVideo ? "video" : "album" }));
    }

    // 2. Upload directly to Supabase Storage
    try {
      const supabaseUrl = "https://tswqkbfetbsayjcavuoc.supabase.co";
      const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzd3FrYmZldGJzYXlqY2F2dW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzOTE3MjksImV4cCI6MjA5NDk2NzcyOX0.CqCDzFEg_3Blgf-0nTHSMDnuNwzsKK65LNZsjJ7rnec";
      const bucketName = "Duda-bucket";
      
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
        body: file, // Send raw file binary directly!
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Erro no upload para o Supabase");
      }

      // Generate the public URL
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;
      
      // Update form URL state
      if (isTeaser) {
        setForm(prev => ({ ...prev, teaserUrl: publicUrl }));
      } else {
        setForm(prev => ({ ...prev, privateFolderKey: publicUrl }));
      }
    } catch (err: any) {
      console.error(err);
      setFormError(isTeaser 
        ? `Erro ao subir a imagem de teaser: ${err.message || err}` 
        : `Erro ao subir o conteúdo exclusivo: ${err.message || err}`
      );
    } finally {
      if (isTeaser) {
        setUploadingTeaser(false);
      } else {
        setUploadingPrivate(false);
      }
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
    if (!form.privateFolderKey) {
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
        resetForm();
        setShowNew(false);
      }, 1500);
    } catch {
      setFormError("Erro ao criar conteúdo. Verifique os dados e tente novamente.");
    }
  };

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

      {/* Instagram-style creation dialog */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity cursor-default" 
            onClick={() => {
              if (!uploadingTeaser && !uploadingPrivate && !createMutation.isPending) {
                setShowNew(false);
                resetForm();
              }
            }}
          />
          
          {/* Instagram-style dialog container */}
          <div className="relative w-full max-w-[850px] h-[550px] bg-white rounded-2xl shadow-2xl z-10 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="h-12 border-b border-gray-100 flex items-center justify-between px-4 shrink-0 bg-white">
              <button
                type="button"
                onClick={() => {
                  setShowNew(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-black transition"
              >
                <X className="h-5 w-5" />
              </button>
              <span className="text-[15px] font-bold text-black">Criar nova publicação</span>
              <button
                onClick={handleCreate}
                disabled={uploadingTeaser || uploadingPrivate || createMutation.isPending || !form.title || !form.privateFolderKey}
                className="text-[14px] font-bold text-[#e89c30] hover:text-[#d48a20] disabled:opacity-40 transition"
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Compartilhar"}
              </button>
            </div>

            {/* Two Column Layout */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* Left Side: Upload zones (Media Previews) */}
              <div className="flex-1 bg-gray-50 border-r border-gray-100 p-5 overflow-y-auto flex flex-col gap-4">
                
                {/* Teaser Upload Slot */}
                <div className="flex-1 flex flex-col min-h-0">
                  <span className="text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                    1. Capa Grátis / Teaser (Público)
                  </span>
                  <FileDropZone
                    id="teaser-drop"
                    previewUrl={teaserPreview}
                    uploading={uploadingTeaser}
                    dragOver={dragOverTeaser}
                    setDragOver={setDragOverTeaser}
                    onFileSelect={(file) => handleFileChange(file, true)}
                    onRemove={() => {
                      setTeaserPreview("");
                      setTeaserFile(null);
                      setForm(prev => ({ ...prev, teaserUrl: "" }));
                    }}
                    placeholderText="Imagem ou vídeo de capa grátis"
                  />
                </div>

                {/* Premium Content Upload Slot */}
                <div className="flex-1 flex flex-col min-h-0">
                  <span className="text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                    2. Conteúdo Exclusivo (Premium) *
                  </span>
                  <FileDropZone
                    id="private-drop"
                    previewUrl={privatePreview}
                    uploading={uploadingPrivate}
                    dragOver={dragOverPrivate}
                    setDragOver={setDragOverPrivate}
                    onFileSelect={(file) => handleFileChange(file, false)}
                    onRemove={() => {
                      setPrivatePreview("");
                      setPrivateFile(null);
                      setForm(prev => ({ ...prev, privateFolderKey: "" }));
                    }}
                    placeholderText="Foto ou vídeo exclusivo (bloqueado)"
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
                      Publicação compartilhada!
                    </div>
                  )}

                  <button
                    onClick={handleCreate}
                    disabled={uploadingTeaser || uploadingPrivate || createMutation.isPending || !form.title || !form.privateFolderKey}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-black py-3 text-[14px] font-bold text-white transition hover:bg-gray-800 disabled:opacity-40"
                  >
                    {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publicar Conteúdo"}
                  </button>
                </div>

              </div>

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
            <div key={c.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-start gap-3">
              <div
                className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${
                  c.type === "video" ? "bg-purple-50" : "bg-orange-50"
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
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    c.type === "video" ? "bg-purple-100 text-purple-600" : "bg-orange-100 text-[#e89c30]"
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
