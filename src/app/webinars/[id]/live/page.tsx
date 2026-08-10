"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { PlayCircle, Users, Radio, Send, Lock, Video } from "lucide-react";
import confetti from "canvas-confetti";

interface Webinar {
  id: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  max_attendees: number;
  filled_seats: number;
  price: number;
  meeting_url?: string;
}

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    display_name: string;
    first_name: string;
    last_name: string;
  };
}

export default function WebinarLivePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const webinarId = params.id as string;

  const [webinar, setWebinar] = useState<Webinar | null>(null);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Load webinar details and check enrollment
  useEffect(() => {
    async function loadData() {
      if (!webinarId || !user) return;
      try {
        setLoading(true);

        // 1. Fetch webinar details
        const { data: webinarData, error: webinarError } = await supabase
          .from("webinars")
          .select("*")
          .eq("id", webinarId)
          .single();

        if (webinarError) {
          console.error("Error fetching webinar:", webinarError);
          setLoading(false);
          return;
        }

        setWebinar(webinarData);

        // 2. Check enrollment
        const { data: enrollmentData } = await supabase
          .from("enrollments")
          .select("*")
          .eq("webinar_id", webinarId)
          .eq("user_id", user.id)
          .single();

        if (enrollmentData) {
          setIsEnrolled(true);
        } else {
          setIsEnrolled(false);
        }

        // 3. Load initial chat messages
        const { data: chatData, error: chatError } = await supabase
          .from("webinar_chats")
          .select("*, profiles:profiles(display_name, first_name, last_name)")
          .eq("webinar_id", webinarId)
          .order("created_at", { ascending: true })
          .limit(50);

        if (!chatError && chatData) {
          setMessages(chatData);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading webinar data", err);
        setLoading(false);
      }
    }

    loadData();
  }, [webinarId, user]);

  // Subscribe to real-time chat updates
  useEffect(() => {
    if (!isEnrolled || !webinarId) return;

    const channel = supabase
      .channel(`public:webinar_chats:webinar_id=eq.${webinarId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "webinar_chats",
          filter: `webinar_id=eq.${webinarId}`,
        },
        async (payload) => {
          // Fetch sender profile to show their name
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, first_name, last_name")
            .eq("id", payload.new.user_id)
            .single();

          const incomingMsg: ChatMessage = {
            id: payload.new.id,
            user_id: payload.new.user_id,
            content: payload.new.content,
            created_at: payload.new.created_at,
            profiles: profile || undefined,
          };

          setMessages((prev) => [...prev, incomingMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [webinarId, isEnrolled]);

  // Simulate receiving WebRTC stream
  useEffect(() => {
    if (isEnrolled && videoRef.current) {
      // Create a mock media stream using a canvas
      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext("2d");
      
      let frameCount = 0;
      
      const drawFrame = () => {
        if (!ctx) return;
        
        ctx.fillStyle = "#080808";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid
        ctx.strokeStyle = "#111111";
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += 40) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, canvas.height);
          ctx.stroke();
        }
        for (let i = 0; i < canvas.height; i += 40) {
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(canvas.width, i);
          ctx.stroke();
        }
        
        // Draw mock trading charts
        ctx.strokeStyle = "#8BE000";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2 + Math.sin(frameCount * 0.05) * 50);
        for(let i = 0; i < canvas.width; i+=10) {
           ctx.lineTo(i, canvas.height / 2 + Math.sin((frameCount + i) * 0.05) * 50 + Math.random() * 20 - 10);
        }
        ctx.stroke();

        ctx.fillStyle = "#8BE000";
        ctx.font = "20px monospace";
        ctx.fillText(`HOST SCREEN SHARE CONNECTED`, 40, 60);
        ctx.fillText(`PROTOCOL: WEBRTC (STUN/TURN ACTIVE)`, 40, 100);
        ctx.fillText(`LATENCY: ${Math.floor(Math.random() * 8 + 15)}MS`, 40, 140);
        ctx.fillText(`TIMESTAMP: ${new Date().toISOString()}`, 40, 180);
        
        frameCount++;
        requestAnimationFrame(drawFrame);
      };
      
      drawFrame();
      
      // @ts-ignore
      const stream = canvas.captureStream(30);
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [isEnrolled]);

  const handlePurchase = async () => {
    if (!user || !webinar) return;
    setIsProcessingPayment(true);
    try {
      // Simulate WebRTC secure session key generation & payment
      await new Promise((resolve) => setTimeout(resolve, 1200));
      
      // Insert enrollment record in Supabase
      const { error } = await supabase
        .from("enrollments")
        .insert({
          webinar_id: webinarId,
          user_id: user.id,
        });

      if (error) {
        console.error("Error creating enrollment:", error);
        return;
      }
      
      setIsEnrolled(true);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      console.error("Payment failed", err);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const messageContent = newMessage;
    setNewMessage("");

    // Optimistic update
    const optimisticMsg: ChatMessage = {
      id: Math.random().toString(),
      user_id: user.id,
      content: messageContent,
      created_at: new Date().toISOString(),
      profiles: {
        display_name: user.displayName || user.name || "User",
        first_name: user.firstName || "User",
        last_name: user.lastName || "",
      },
    };
    
    setMessages((prev) => [...prev, optimisticMsg]);

    const { error } = await supabase
      .from("webinar_chats")
      .insert({
        webinar_id: webinarId,
        user_id: user.id,
        content: messageContent,
      });

    if (error) {
      console.error("Error sending message:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center font-mono">
        INITIALIZING SECURE WebRTC CONNECTION...
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#080808] text-white font-mono flex flex-col">
        {/* Header */}
        <header className="border-b border-[#1E1E1E] p-4 flex justify-between items-center bg-[#0B0B0B]">
          <div className="space-y-1">
            <h1 className="text-[#8BE000] text-xl font-bold uppercase tracking-wider">
              {webinar?.title || "MARKET ANALYSIS LIVE"}
            </h1>
            <p className="text-xs text-neutral-400">
              DATE: {webinar?.date} | TIME: {webinar?.start_time} | CAP: {webinar?.max_attendees}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isEnrolled ? "bg-[#8BE000] animate-pulse" : "bg-red-500"}`}></div>
              <span className="text-xs uppercase text-neutral-400">
                {isEnrolled ? "LIVE" : "DISCONNECTED"}
              </span>
            </div>
            <Link href="/webinars" className="text-xs border border-[#2E2E2E] bg-[#161616] px-3.5 py-1.5 hover:text-[#8BE000] transition">
              Exit Room
            </Link>
          </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden h-[calc(100vh-73px)]">
          {/* Main Video Area */}
          <div className="flex-1 relative flex flex-col bg-black justify-center">
            {!isEnrolled ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#080808] z-10 p-4">
                <div className="max-w-md w-full bg-[#111111] border border-[#1E1E1E] p-8 text-center shadow-2xl">
                  <div className="text-[#8BE000] mb-4 flex justify-center">
                    <Lock className="w-12 h-12" />
                  </div>
                  <h2 className="text-xl font-bold mb-2 uppercase tracking-wide">ACCESS RESTRICTED</h2>
                  <p className="text-gray-400 text-xs mb-8 leading-relaxed">
                    ENROLLMENT REQUIRED TO ACCESS SECURE WEBRTC FEED. PURCHASE A TICKET TO UNLOCK THE LIVE SESSION.
                  </p>
                  <button
                    onClick={handlePurchase}
                    disabled={isProcessingPayment}
                    className="w-full bg-[#8BE000] text-black py-4 px-4 font-bold uppercase tracking-wider hover:bg-[#9cf000] transition-colors disabled:opacity-50"
                  >
                    {isProcessingPayment ? "PROCESSING TRANSACTION..." : `AUTHORIZE PAYMENT ($${webinar?.price || 199})`}
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full h-full relative">
                <video 
                  ref={videoRef}
                  className="w-full h-full object-contain bg-black"
                  autoPlay 
                  playsInline 
                  muted
                />
                <div className="absolute bottom-4 left-4 bg-[#111111]/80 p-3 text-xs text-[#8BE000] border border-[#1E1E1E] backdrop-blur-sm">
                  STREAM ID: {webinarId.substring(0, 8)}
                  <br />
                  PROTOCOL: WebRTC (STUN/TURN)
                </div>
              </div>
            )}
          </div>

          {/* Chat Sidebar */}
          <div className="w-full lg:w-96 border-l border-[#1E1E1E] bg-[#0B0B0B] flex flex-col h-full">
            <div className="p-4 border-b border-[#1E1E1E]">
              <h3 className="text-neutral-400 text-sm font-bold uppercase tracking-widest">TERMINAL CHAT</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!isEnrolled ? (
                <div className="text-neutral-600 text-xs italic text-center mt-10">
                  CHAT UNAVAILABLE. ENROLL TO PARTICIPATE.
                </div>
              ) : messages.length === 0 ? (
                <div className="text-neutral-600 text-xs italic text-center mt-10">
                  AWAITING TRANSMISSIONS...
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const senderName = msg.profiles
                    ? msg.profiles.display_name || `${msg.profiles.first_name} ${msg.profiles.last_name || ""}`.trim()
                    : `USER_${msg.user_id.substring(0, 6)}`;
                  return (
                    <div key={idx} className="text-xs border-l border-[#1E1E1E] pl-3 space-y-1">
                      <div className="text-[#8BE000] font-bold flex justify-between">
                        <span>{senderName}</span>
                        <span className="text-neutral-500 text-[10px]">[{new Date(msg.created_at).toLocaleTimeString()}]</span>
                      </div>
                      <div className="text-neutral-300 break-words font-sans">
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-[#1E1E1E] bg-[#080808]">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={isEnrolled ? "TRANSMIT MESSAGE..." : "LOCKED"}
                  disabled={!isEnrolled}
                  className="flex-1 bg-[#111111] border border-[#1E1E1E] text-white px-3 py-2 text-xs focus:outline-none focus:border-[#8BE000] disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!isEnrolled || !newMessage.trim()}
                  className="bg-[#111111] border border-[#1E1E1E] text-[#8BE000] px-4 py-2 text-xs font-bold uppercase hover:bg-[#222222] disabled:opacity-50 disabled:hover:bg-[#111111] transition-colors"
                >
                  SEND
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
