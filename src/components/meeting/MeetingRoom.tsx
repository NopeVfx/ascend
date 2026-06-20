"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type PeerType from "peerjs";
import type { MediaConnection } from "peerjs";
import {
  Loader2,
  Mic,
  MicOff,
  Play,
  SkipForward,
  Square,
  UserPlus,
  Video as VideoIcon,
  VideoOff,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { env, isMeetingConfigured } from "@/lib/env";
import { cn } from "@/lib/utils";

type Status =
  | "idle"
  | "requesting"
  | "searching"
  | "connected"
  | "stopped"
  | "error";

interface MatchedMessage {
  type: "matched";
  partnerPeerId: string;
  partnerUserId: string | null;
  initiator: boolean;
}

type ServerMessage =
  | MatchedMessage
  | { type: "waiting" }
  | { type: "partner-left" };

function peerOptions() {
  if (env.peerHost) {
    return {
      host: env.peerHost,
      port: env.peerPort ? Number(env.peerPort) : env.peerSecure ? 443 : 80,
      path: env.peerPath,
      secure: env.peerSecure,
    };
  }
  return undefined; // PeerJS public cloud
}

export function MeetingRoom() {
  const { user, supabase } = useAuth();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const peerRef = useRef<PeerType | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const runningRef = useRef(false);

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [partnerUserId, setPartnerUserId] = useState<string | null>(null);
  const [friendMsg, setFriendMsg] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const setRemote = useCallback((stream: MediaStream | null) => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
  }, []);

  const endCall = useCallback(() => {
    callRef.current?.close();
    callRef.current = null;
    setRemote(null);
    setPartnerUserId(null);
    setFriendMsg(null);
  }, [setRemote]);

  const enqueue = useCallback(() => {
    const ws = wsRef.current;
    const peer = peerRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !peer) return;
    setStatus("searching");
    ws.send(
      JSON.stringify({ type: "ready", peerId: peer.id, userId: user?.id ?? null }),
    );
  }, [user?.id]);

  const handleMatched = useCallback(
    (msg: MatchedMessage) => {
      const peer = peerRef.current;
      const stream = localStreamRef.current;
      if (!peer || !stream) return;
      setPartnerUserId(msg.partnerUserId);
      setFriendMsg(null);
      if (msg.initiator) {
        const call = peer.call(msg.partnerPeerId, stream);
        callRef.current = call;
        call.on("stream", (remote) => {
          setRemote(remote);
          setStatus("connected");
        });
        call.on("close", () => {
          if (runningRef.current) {
            endCall();
            enqueue();
          }
        });
      }
      // Non-initiator answers via peer.on("call") registered at start.
    },
    [endCall, enqueue, setRemote],
  );

  const teardown = useCallback(() => {
    runningRef.current = false;
    try {
      wsRef.current?.close();
    } catch {}
    wsRef.current = null;
    callRef.current?.close();
    callRef.current = null;
    peerRef.current?.destroy();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    setRemote(null);
    setPartnerUserId(null);
  }, [setRemote]);

  useEffect(() => () => teardown(), [teardown]);

  async function start() {
    setError(null);
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setMicOn(true);
      setCamOn(true);

      const { default: Peer } = await import("peerjs");
      const peer = new Peer(peerOptions() ?? {});
      peerRef.current = peer;
      runningRef.current = true;

      peer.on("call", (incoming) => {
        const local = localStreamRef.current;
        if (!local) return;
        callRef.current = incoming;
        incoming.answer(local);
        incoming.on("stream", (remote) => {
          setRemote(remote);
          setStatus("connected");
        });
        incoming.on("close", () => {
          if (runningRef.current) {
            endCall();
            enqueue();
          }
        });
      });

      peer.on("error", (err) => {
        setError(`Peer error: ${err.type}`);
      });

      peer.on("open", () => {
        const ws = new WebSocket(env.matchmakingUrl as string);
        wsRef.current = ws;
        ws.onopen = () => enqueue();
        ws.onmessage = (event) => {
          const msg = JSON.parse(event.data) as ServerMessage;
          if (msg.type === "matched") handleMatched(msg);
          else if (msg.type === "partner-left" && runningRef.current) {
            endCall();
            enqueue();
          }
        };
        ws.onerror = () => setError("Matchmaking connection failed.");
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Camera/microphone permission denied.");
      } else {
        setError(err instanceof Error ? err.message : "Could not start.");
      }
      setStatus("error");
      teardown();
    }
  }

  function next() {
    endCall();
    enqueue();
  }

  function stop() {
    teardown();
    setStatus("stopped");
  }

  function toggleMic() {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    }
  }

  function toggleCam() {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setCamOn(track.enabled);
    }
  }

  async function addFriend() {
    if (!user || !supabase) {
      setFriendMsg("Please log in to add friends.");
      return;
    }
    if (!partnerUserId) {
      setFriendMsg("This user isn't logged in, so they can't be added.");
      return;
    }
    const { error } = await supabase.from("friendships").insert({
      requester_id: user.id,
      addressee_id: partnerUserId,
      status: "pending",
    });
    setFriendMsg(error ? `Could not send request: ${error.message}` : "Friend request sent.");
  }

  const active = status === "searching" || status === "connected";

  return (
    <div className="space-y-4">
      {!isMeetingConfigured ? (
        <Notice tone="warn" title="Meeting room not configured">
          Set <code>NEXT_PUBLIC_MATCHMAKING_URL</code> (and optionally{" "}
          <code>NEXT_PUBLIC_PEER_HOST</code>) and run the signaling server (
          <code>npm run server</code>). See the README.
        </Notice>
      ) : null}

      {error ? <Notice tone="warn">{error}</Notice> : null}

      {!active ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-border rounded-2xl bg-surface glow-border text-center mt-8">
          <div className="p-5 bg-accent/10 rounded-full mb-6">
            <VideoIcon size={48} className="text-accent" />
          </div>
          <h2 className="text-2xl font-black uppercase-wide mb-3">Ready to meet people?</h2>
          <p className="text-muted max-w-md mb-8">
            Click start below to enable your camera and microphone, and instantly connect with random peers for live advice.
          </p>
          <Button
            onClick={start}
            size="lg"
            className="w-full sm:w-auto btn-bubbly rounded-xl text-lg px-10 py-5 glow-border-hover"
            disabled={!isMeetingConfigured || status === "requesting"}
          >
            {status === "requesting" ? (
              <>
                <Loader2 className="animate-spin" size={24} /> Starting…
              </>
            ) : (
              <>
                <Play size={24} /> Start Meeting
              </>
            )}
          </Button>
        </div>
      ) : null}

      {active && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md p-4 md:p-6 lg:p-8">
          {friendMsg ? (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-top-4 fade-in w-full max-w-md px-4">
              <Notice>{friendMsg}</Notice>
            </div>
          ) : null}
          
          <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 relative z-10 w-full max-w-7xl mx-auto mt-2">
            
            {/* Remote Video */}
            <div className="flex-1 relative rounded-3xl overflow-hidden border-2 border-border bg-black/50 glow-border shadow-2xl flex flex-col justify-center">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />
              <span className="absolute left-4 top-4 rounded-xl border-2 border-border/50 bg-black/60 backdrop-blur-sm px-3 py-1.5 text-xs font-bold uppercase-wide text-white">
                {status === "connected" ? "Stranger" : "Waiting…"}
              </span>
              {status === "searching" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70 bg-black/40">
                  <Loader2 className="animate-spin text-accent" size={40} />
                  <span className="text-sm font-bold uppercase-wide tracking-wider">Finding a peer…</span>
                </div>
              ) : null}
            </div>

            {/* Local Video */}
            <div className="flex-1 relative rounded-3xl overflow-hidden border-2 border-accent/50 bg-black/50 glow-border shadow-2xl flex flex-col justify-center">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 h-full w-full object-cover [transform:scaleX(-1)]"
              />
              <span className="absolute left-4 top-4 rounded-xl border-2 border-accent/50 bg-accent/20 backdrop-blur-sm px-3 py-1.5 text-xs font-bold uppercase-wide text-accent-fg">
                You
              </span>
            </div>

          </div>

          {/* Controls */}
          <div className="mt-4 md:mt-6 flex flex-wrap items-center justify-center gap-3 md:gap-4 bg-surface/80 backdrop-blur-xl border-2 border-border p-3 md:p-4 rounded-2xl glow-border relative z-10 w-fit mx-auto shadow-2xl">
            <Button onClick={next} variant="outline" size="lg" className="btn-bubbly rounded-xl glow-border-hover">
              <SkipForward size={20} /> <span className="hidden sm:inline">Skip</span>
            </Button>
            
            <Button 
              onClick={stop} 
              variant="danger" 
              size="lg" 
              className="btn-bubbly rounded-xl shadow-[0_0_15px_rgba(255,0,0,0.3)] hover:shadow-[0_0_25px_rgba(255,0,0,0.5)] border-red-500/50 hover:border-red-500"
            >
              <Square size={20} /> <span className="hidden sm:inline">Exit</span>
            </Button>
            
            <div className="w-px h-8 bg-border/50 mx-1 md:mx-2" />
            
            <Button 
              onClick={toggleMic} 
              variant="ghost" 
              size="lg"
              className={cn("btn-bubbly rounded-xl", !micOn && "bg-red-500/10 text-red-500 hover:bg-red-500/20")} 
              aria-label="Toggle mic"
            >
              {micOn ? <Mic size={24} /> : <MicOff size={24} />}
            </Button>
            
            <Button 
              onClick={toggleCam} 
              variant="ghost" 
              size="lg"
              className={cn("btn-bubbly rounded-xl", !camOn && "bg-red-500/10 text-red-500 hover:bg-red-500/20")} 
              aria-label="Toggle camera"
            >
              {camOn ? <VideoIcon size={24} /> : <VideoOff size={24} />}
            </Button>
            
            <div className="w-px h-8 bg-border/50 mx-1 md:mx-2" />
            
            <Button
              onClick={addFriend}
              variant="lime"
              size="lg"
              className="btn-bubbly rounded-xl glow-border-hover border-lime/50"
              disabled={status !== "connected"}
            >
              <UserPlus size={20} /> <span className="hidden sm:inline">Add friend</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
