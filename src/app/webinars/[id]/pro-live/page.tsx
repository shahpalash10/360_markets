"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  MonitorOff,
  Activity,
  ShieldCheck,
  Zap,
  Settings
} from "lucide-react";

export default function ProMasterclassHostPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [webinar, setWebinar] = useState<any>(null);
  const [webrtcState, setWebrtcState] = useState("DISCONNECTED");
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamPaused, setIsCamPaused] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    async function fetchWebinar() {
      if (!id) return;
      const { data, error } = await supabase
        .from("webinars")
        .select("*")
        .eq("id", id)
        .single();
      
      if (data) setWebinar(data);
    }
    fetchWebinar();
  }, [id]);

  useEffect(() => {
    startLocalMedia();
    return () => {
      cleanupStreams();
    };
  }, []);

  const startLocalMedia = async () => {
    try {
      setWebrtcState("INITIALIZING MEDIA...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setWebrtcState("CONNECTED / READY");
      setupAudioAnalyzer(stream);
    } catch (err) {
      console.error("Error accessing media devices", err);
      setWebrtcState("MEDIA ERROR");
    }
  };

  const setupAudioAnalyzer = (stream: MediaStream) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    
    if (stream.getAudioTracks().length === 0) return;

    const source = audioContext.createMediaStreamSource(stream);
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 256;
    source.connect(analyzer);
    analyzerRef.current = analyzer;

    const dataArray = new Uint8Array(analyzer.frequencyBinCount);

    const updateAudioLevel = () => {
      if (!analyzerRef.current) return;
      analyzerRef.current.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      
      setAudioLevel(Math.min(100, (avg / 255) * 100 * 1.5));
      
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    };
    
    updateAudioLevel();
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCam = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCamPaused(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = null;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = stream;
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
        }
        setIsScreenSharing(true);

        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          screenStreamRef.current = null;
          if (screenVideoRef.current) {
            screenVideoRef.current.srcObject = null;
          }
        };
      } catch (err) {
        console.error("Error sharing screen", err);
      }
    }
  };

  const cleanupStreams = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
  };

  // Generate volume bars
  const volumeBars = Array.from({ length: 10 }).map((_, i) => {
    const threshold = i * 10;
    const isActive = audioLevel > threshold && !isMicMuted;
    return (
      <div 
        key={i} 
        className={`w-1 h-3 transition-colors duration-100 ${isActive ? 'bg-[#8BE000]' : 'bg-[#222222]'}`}
      />
    );
  });

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col font-mono selection:bg-[#8BE000] selection:text-black">
      {/* Header */}
      <div className="bg-[#111111] border-b border-[#222] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/webinars" className="text-xs text-neutral-500 hover:text-white transition-colors">
            ← EXIT STUDIO
          </Link>
          <div className="h-4 w-[1px] bg-[#333]" />
          <div>
            <h1 className="text-sm font-semibold text-white flex items-center gap-2 uppercase tracking-wider">
              {webinar ? webinar.title : "LOADING WEBINAR..."}
              <span className="bg-[#8BE000]/10 text-[#8BE000] border border-[#8BE000]/30 font-bold text-[10px] px-2 py-0.5 tracking-widest flex items-center gap-1">
                <Zap className="w-3 h-3" /> HOST STUDIO
              </span>
            </h1>
            <p className="text-xs text-neutral-500 mt-1 uppercase">
              {webinar ? `ID: ${webinar.id} | INSTRUCTOR: ${webinar.instructor_name || user?.name || "HOST"}` : "INITIALIZING STREAM..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#080808] border border-[#222]">
            <Activity className="w-3.5 h-3.5 text-[#8BE000]" />
            <span className="text-neutral-400">STATE:</span>
            <span className={webrtcState === "CONNECTED / READY" ? "text-[#8BE000] font-bold" : "text-amber-500 font-bold"}>
              {webrtcState}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#080808] border border-[#222]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#8BE000]" />
            <span className="text-neutral-400">STUN/TURN:</span>
            <span className="text-[#8BE000] font-bold">ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="flex-1 p-6 flex gap-6 overflow-hidden">
        
        {/* Left Column - Previews */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* Screen Share Preview */}
          <div className="flex-1 bg-[#111111] border border-[#222] relative flex flex-col overflow-hidden">
            <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between items-center">
              <span className="text-xs font-bold tracking-widest text-[#8BE000] flex items-center gap-2">
                <MonitorOff className="w-4 h-4" /> SCREEN SHARE PREVIEW
              </span>
              {isScreenSharing && (
                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 font-bold animate-pulse">
                  LIVE
                </span>
              )}
            </div>
            {isScreenSharing ? (
              <video 
                ref={screenVideoRef}
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600 bg-black/40">
                <MonitorOff className="w-12 h-12 mb-3 opacity-20" />
                <span className="text-xs uppercase tracking-widest">Screen Sharing Inactive</span>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="bg-[#111111] border border-[#222] p-4 flex items-center justify-between">
            <div className="flex gap-3">
              <button 
                onClick={toggleMic}
                className={`flex items-center gap-2 px-6 py-3 border transition-colors text-sm uppercase font-bold ${
                  isMicMuted 
                    ? "bg-red-500/10 border-red-500/50 text-red-500 hover:bg-red-500/20" 
                    : "bg-[#080808] border-[#333] text-white hover:border-[#555]"
                }`}
              >
                {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isMicMuted ? "Unmute Mic" : "Mute Mic"}
              </button>

              <button 
                onClick={toggleCam}
                className={`flex items-center gap-2 px-6 py-3 border transition-colors text-sm uppercase font-bold ${
                  isCamPaused 
                    ? "bg-amber-500/10 border-amber-500/50 text-amber-500 hover:bg-amber-500/20" 
                    : "bg-[#080808] border-[#333] text-white hover:border-[#555]"
                }`}
              >
                {isCamPaused ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                {isCamPaused ? "Resume Cam" : "Pause Cam"}
              </button>
            </div>

            <button 
              onClick={toggleScreenShare}
              className={`flex items-center gap-2 px-8 py-3 border transition-colors text-sm uppercase font-bold ${
                isScreenSharing
                  ? "bg-red-500 text-white border-red-500 hover:bg-red-600"
                  : "bg-[#8BE000] text-black border-[#8BE000] hover:bg-[#7bc400]"
              }`}
            >
              <ScreenShare className="w-4 h-4" />
              {isScreenSharing ? "Stop Sharing" : "Share Screen"}
            </button>
          </div>
        </div>

        {/* Right Column - Camera & Telemetry */}
        <div className="w-80 flex flex-col gap-6">
          {/* Camera Preview */}
          <div className="bg-[#111111] border border-[#222] flex flex-col">
            <div className="p-3 border-b border-[#222] flex justify-between items-center">
              <span className="text-[10px] font-bold tracking-widest text-neutral-400">CAMERA FEED</span>
              <Settings className="w-3.5 h-3.5 text-neutral-600" />
            </div>
            <div className="relative aspect-video bg-black">
              <video 
                ref={localVideoRef}
                autoPlay 
                playsInline 
                muted
                className={`w-full h-full object-cover ${isCamPaused ? 'opacity-0' : 'opacity-100'}`}
              />
              {isCamPaused && (
                <div className="absolute inset-0 flex items-center justify-center flex-col text-neutral-600">
                  <VideoOff className="w-8 h-8 mb-2 opacity-30" />
                  <span className="text-[10px] uppercase tracking-widest">Camera Paused</span>
                </div>
              )}
            </div>
          </div>

          {/* Audio Telemetry */}
          <div className="bg-[#111111] border border-[#222] p-4 flex flex-col gap-4">
            <span className="text-[10px] font-bold tracking-widest text-neutral-400">AUDIO INPUT LEVEL</span>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {volumeBars}
              </div>
              <span className="text-[10px] text-neutral-500 ml-auto">
                {isMicMuted ? "MUTED" : `${Math.round(audioLevel)}%`}
              </span>
            </div>
          </div>

          {/* Session Info */}
          <div className="flex-1 bg-[#111111] border border-[#222] p-4 flex flex-col gap-4">
             <span className="text-[10px] font-bold tracking-widest text-neutral-400">SESSION DETAILS</span>
             {webinar ? (
               <div className="space-y-3">
                 <div>
                   <div className="text-[10px] text-neutral-600 mb-1">DESCRIPTION</div>
                   <div className="text-xs text-neutral-300 line-clamp-4">{webinar.description || "No description provided."}</div>
                 </div>
                 <div>
                   <div className="text-[10px] text-neutral-600 mb-1">START TIME</div>
                   <div className="text-xs text-neutral-300">{new Date(webinar.start_time).toLocaleString()}</div>
                 </div>
               </div>
             ) : (
               <div className="text-xs text-neutral-600 animate-pulse">Loading data...</div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
