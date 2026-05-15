import React, { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Bell, Heart, MessageCircle, Bookmark, Lock, Images, Play, Sparkles, ChevronUp, Ellipsis } from "lucide-react";

import profileImg from "@assets/privacy/profile-img.png";
import coverImg from "@assets/privacy/cover-img.png";
import contentImg from "@assets/privacy/content-img.png";

const queryClient = new QueryClient();

const notifications = [
  "Maria assinou seu perfil!",
  "João curtiu uma foto",
  "Lucas enviou uma mensagem",
];

function Home() {
  const [activeTab, setActiveTab] = useState<"fotos" | "videos">("fotos");
  const [currentNotifIndex, setCurrentNotifIndex] = useState(0);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowNotif(true);
      setTimeout(() => {
        setShowNotif(false);
        setTimeout(() => {
          setCurrentNotifIndex((prev) => (prev + 1) % notifications.length);
        }, 500); // Wait for fade out
      }, 3000); // Show duration
    }, 5000); // Cycle duration

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center">
      {/* Fixed Header */}
      <header className="fixed top-0 z-50 flex w-full h-12 items-center justify-between border-b border-gray-100 bg-white px-4 md:px-6">
        <div className="flex items-center">
          <span className="font-display text-[20px] font-extrabold tracking-[-0.08em] text-black">
            privacy<span className="text-[#f59b32]">.</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
            <Bell className="h-4 w-4" />
          </button>
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-orange-400 to-white" />
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-[480px] flex-col gap-3 px-3 py-4 pt-16 pb-12 flex">
        {/* Card 1: Profile Card */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="relative h-32 w-full sm:h-[128px]">
            <img src={coverImg} alt="Cover" className="h-full w-full object-cover" />
            <div className="absolute -top-2.5 left-3 z-10 rounded-full bg-[#4ade80] px-2.5 py-0.5 text-[13px] font-bold text-black">
              AO VIVO
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
              <div className="live-border relative h-24 w-24 rounded-full border-[3px] border-white bg-gray-200">
                <img src={profileImg} alt="Profile" className="h-full w-full rounded-full object-cover" />
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 whitespace-nowrap rounded bg-orange-400 px-2 py-1 text-[11px] font-bold text-white shadow-lg">
                🟢 ONLINE
              </div>
            </div>
          </div>
          
          <div className="px-4 pb-5 pt-10 text-center sm:text-left flex flex-col items-center sm:items-start">
            <h1 className="text-[17px] font-bold tracking-[-0.03em] text-black">Emilly Faria</h1>
            <p className="text-[15px] text-gray-500">@millyfaria4</p>
            
            <div className="mt-4 flex items-center justify-center sm:justify-start gap-4">
              <div className="flex flex-col items-center sm:items-start">
                <span className="font-bold text-black">159</span>
                <span className="text-[12px] text-gray-600">Seguindo</span>
              </div>
              <div className="flex flex-col items-center sm:items-start">
                <span className="font-bold text-black">626</span>
                <span className="text-[12px] text-gray-600">Seguidores</span>
              </div>
              <div className="flex flex-col items-center sm:items-start">
                <span className="font-bold text-black">364.6K</span>
                <span className="text-[12px] text-gray-600">Curtidas</span>
              </div>
            </div>
            
            <p className="mt-3 text-[15px] leading-relaxed text-black text-center sm:text-left">
              Só fica quem tem coragem de desvendar cada segredinho da sua Loirinha.... vem? 😜
            </p>
          </div>
        </div>

        {/* Card 2: Subscription Offer Card */}
        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h2 className="text-[15px] font-semibold text-black">Oferta de assinatura</h2>
              <Sparkles className="h-4 w-4 text-[#e89c30]" />
            </div>
            <div className="rounded bg-[#e89c30]/10 px-2 py-0.5 text-[12px] font-semibold text-[#e89c30]">
              Termina em 1 dia
            </div>
          </div>
          <p className="text-[14px] text-gray-600">
            Acesso especial com atualizações diárias, conversas reservadas e íntimas.
          </p>
          <div className="inline-block rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-[14px] font-semibold text-black">
            Economize 26%
          </div>
          <button className="w-full rounded-xl bg-[#e89c30] py-3.5 text-[15px] font-semibold text-black hover:bg-[#d68a25]">
            Assinar agora R$ 21,87
          </button>
          <div className="text-center text-[12px] text-gray-500">
            Preço original <span className="line-through">R$ 29,55</span>
          </div>
          <button className="w-full rounded-xl border border-gray-200 bg-white py-3.5 text-[15px] font-semibold text-black hover:bg-gray-50">
            ★ Ligar agora para Milly?
          </button>
        </div>

        {/* Card 3: Subscription Tiers */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="font-semibold text-black">Assinaturas</h2>
            <ChevronUp className="h-4 w-4 text-gray-400" />
          </div>
          <div className="h-[1px] w-full bg-gray-100" />
          <div className="flex flex-col">
            {[
              { label: "1 Mês (26% off)", price: "R$ 21,87" },
              { label: "3 meses (42% off)", price: "R$ 43,87" },
              { label: "Vitalício (50% off)", price: "R$ 65,98" },
              { label: "Chamada de vídeo (1h)", price: "R$ 148,87" },
            ].map((tier, i) => (
              <div
                key={i}
                className="flex cursor-pointer items-center justify-between border-b border-gray-100 px-4 py-3.5 hover:bg-gray-50 last:border-0"
              >
                <span className="text-[14px] text-black">{tier.label}</span>
                <span className="text-[14px] font-semibold text-black">{tier.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col gap-3">
          <div className="flex overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <button
              onClick={() => setActiveTab("fotos")}
              className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-3.5 text-[15px] ${
                activeTab === "fotos"
                  ? "border-b-2 border-[#e89c30] font-semibold text-[#e89c30]"
                  : "font-semibold text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Images className="h-4 w-4" /> Fotos
            </button>
            <button
              onClick={() => setActiveTab("videos")}
              className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-3.5 text-[15px] ${
                activeTab === "videos"
                  ? "border-b-2 border-[#e89c30] font-semibold text-[#e89c30]"
                  : "font-semibold text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Play className="h-4 w-4" /> Vídeos
            </button>
          </div>
          <div className="px-1 text-[12px] text-gray-500">
            513 Postagens · 1.323 Mídias
          </div>

          {/* Post Card 1 */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="flex items-start justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <img src={profileImg} alt="Profile" className="h-9 w-9 rounded-full object-cover" />
                <div className="flex flex-col">
                  <span className="text-[14px] font-semibold text-black">Emilly Faria</span>
                  <span className="text-[12px] text-gray-500">@millyfaria4</span>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <Ellipsis className="h-4 w-4" />
              </button>
            </div>
            <div className="relative aspect-video w-full overflow-hidden">
              <img src={contentImg} alt="Content" className="h-full w-full object-cover blur-sm" />
              <div className="absolute inset-0 z-10 bg-black/40" />
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2">
                <Lock className="h-5 w-5 text-white" />
                <span className="text-[15px] font-semibold text-white">Assinar para ver</span>
              </div>
              <div className="absolute bottom-3 left-3 z-30 flex items-center gap-1 rounded bg-black/50 px-1.5 py-0.5 text-white">
                <Images className="h-3 w-3" />
                <span className="text-[12px]">124</span>
              </div>
            </div>
            <div className="flex items-center gap-4 px-4 py-3">
              <button className="flex items-center gap-1.5 text-gray-500 hover:text-black">
                <Heart className="h-5 w-5" />
                <span className="text-[15px]">124</span>
              </button>
              <button className="text-gray-500 hover:text-black">
                <MessageCircle className="h-5 w-5" />
              </button>
              <button className="ml-auto text-gray-500 hover:text-black">
                <Bookmark className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Post Card 2 */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="flex items-start justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <img src={profileImg} alt="Profile" className="h-9 w-9 rounded-full object-cover" />
                <div className="flex flex-col">
                  <span className="text-[14px] font-semibold text-black">Emilly Faria</span>
                  <span className="text-[12px] text-gray-500">@millyfaria4</span>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <Ellipsis className="h-4 w-4" />
              </button>
            </div>
            <div className="relative aspect-video w-full overflow-hidden">
              <img src={contentImg} alt="Content" className="h-full w-full object-cover blur-sm" />
              <div className="absolute inset-0 z-10 bg-black/40" />
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2">
                <Lock className="h-5 w-5 text-white" />
                <span className="text-[15px] font-semibold text-white">Assinar para ver</span>
              </div>
              <div className="absolute bottom-3 left-3 z-30 flex items-center gap-1 rounded bg-black/50 px-1.5 py-0.5 text-white">
                <Images className="h-3 w-3" />
                <span className="text-[12px]">341</span>
              </div>
            </div>
            <div className="flex items-center gap-4 px-4 py-3">
              <button className="flex items-center gap-1.5 text-gray-500 hover:text-black">
                <Heart className="h-5 w-5" />
                <span className="text-[15px]">341</span>
              </button>
              <button className="text-gray-500 hover:text-black">
                <MessageCircle className="h-5 w-5" />
              </button>
              <button className="ml-auto text-gray-500 hover:text-black">
                <Bookmark className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Notifications */}
      <div className="pointer-events-none fixed bottom-6 left-6 z-40 flex flex-col gap-3">
        {showNotif && (
          <div 
            className="flex items-center gap-2.5 rounded-2xl border border-gray-100 bg-white px-3 py-2.5 shadow-lg"
            style={{ 
              animation: 'fadeUpIn 0.3s ease-out forwards',
            }}
          >
            <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-orange-400 to-yellow-200" />
            <span className="text-[13px] font-medium text-black">
              {notifications[currentNotifIndex]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;