import { useState, useEffect } from "react";
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
} from "lucide-react";
import profileImg from "./assets/profile-img.png";
import coverImg from "./assets/cover-img.png";
import contentImg from "./assets/content-img.png";

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

export default function App() {
  const [activeTab, setActiveTab] = useState<"fotos" | "videos">("fotos");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifIndex, setNotifIndex] = useState(0);

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
    <div className="min-h-screen bg-white">
      <header className="fixed inset-x-0 top-0 z-50 flex h-12 items-center justify-between bg-white border-b border-gray-100 px-4">
        <a href="/" className="text-[20px] font-extrabold tracking-[-0.08em] text-black">
          privacy<span className="text-[#f59b32]">.</span>
        </a>
        <div className="flex items-center gap-3">
          <button className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-black">
            <Bell className="h-[18px] w-[18px]" />
          </button>
          <div className="h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-[#e89c30]/40 to-[#f5f5f5] flex items-center justify-center">
            <span className="text-[10px] font-bold text-[#e89c30]">EF</span>
          </div>
        </div>
      </header>

      <main className="min-h-screen bg-white pt-12">
        <div className="mx-auto flex max-w-[480px] flex-col gap-3 px-3 py-4 pb-12">

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

            <button className="w-full rounded-xl bg-[#e89c30] py-3.5 text-[15px] font-semibold text-black transition hover:bg-[#d48a20]">
              Assinar agora R$ 21,87
            </button>

            <p className="text-center text-[12px] text-gray-500">
              Preço original <span className="line-through">R$ 29,55</span>
            </p>

            <button className="w-full rounded-xl border border-gray-200 bg-white py-3.5 text-[15px] font-semibold text-black transition hover:bg-gray-50">
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
                { label: "1 Mês (26% off)", price: "R$ 21,87" },
                { label: "3 meses (42% off)", price: "R$ 43,87" },
                { label: "Vitalício (50% off)", price: "R$ 65,98" },
                { label: "Chamada de vídeo (1h)", price: "R$ 148,87" },
              ].map((tier, i) => (
                <button
                  key={i}
                  className="flex w-full items-center justify-between px-4 py-3.5 transition hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <span className="text-[15px] text-black">{tier.label}</span>
                  <span className="text-[15px] font-semibold text-black">{tier.price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content tabs */}
          <div className="flex overflow-hidden rounded-2xl border border-gray-200 bg-white">
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
          <PostCard likeCount={124} />

          {/* Post Card 2 */}
          <PostCard likeCount={341} />

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
    </div>
  );
}

function PostCard({ likeCount }: { likeCount: number }) {
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
      <div className="relative aspect-video w-full cursor-pointer">
        <img
          src={contentImg}
          alt="locked content"
          className="absolute inset-0 h-full w-full object-cover blur-sm scale-105"
        />
        <div className="absolute inset-0 z-10 bg-black/50" />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
            <Lock className="h-5 w-5 text-white" />
          </div>
          <span className="text-[15px] font-semibold text-white">Assinar para ver</span>
        </div>
        <div className="absolute bottom-3 left-3 z-30 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur-sm">
          <Images className="h-3.5 w-3.5 text-[#e89c30]" />
          <span className="text-[12px] font-semibold text-white">{likeCount}</span>
        </div>
      </div>

      {/* Post footer */}
      <div className="flex items-center gap-4 px-4 py-3">
        <button className="flex items-center gap-1.5 text-gray-500 transition hover:text-gray-700">
          <Heart className="h-[18px] w-[18px]" />
          <span className="text-[15px]">{likeCount}</span>
        </button>
        <button className="flex items-center gap-1.5 text-gray-500 transition hover:text-gray-700">
          <MessageCircle className="h-[18px] w-[18px]" />
        </button>
        <button className="ml-auto flex items-center gap-1.5 text-gray-500 transition hover:text-gray-700">
          <Bookmark className="h-[18px] w-[18px]" />
        </button>
      </div>
    </div>
  );
}
