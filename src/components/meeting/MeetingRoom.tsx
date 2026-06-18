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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="relative aspect-video overflow-hidden border-2 border-border bg-black">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
          <span className="absolute left-2 top-2 border-2 border-border bg-surface px-2 py-1 text-xs font-bold uppercase-wide">
            {status === "connected" ? "Stranger" : "Waiting…"}
          </span>
          {status === "searching" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted">
              <Loader2 className="animate-spin text-accent" size={32} />
              <span className="text-sm uppercase-wide">Finding a peer…</span>
            </div>
          ) : null}
        </div>

        <div className="relative aspect-video overflow-hidden border-2 border-border bg-black">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover [transform:scaleX(-1)]"
          />
          <span className="absolute left-2 top-2 border-2 border-accent bg-surface px-2 py-1 text-xs font-bold uppercase-wide text-accent">
            You
          </span>
        </div>
      </div>

      {friendMsg ? <Notice>{friendMsg}</Notice> : null}

      <div className="flex flex-wrap items-center gap-3">
        {!active ? (
          <Button
            onClick={start}
            size="lg"
            disabled={!isMeetingConfigured || status === "requesting"}
          >
            {status === "requesting" ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Starting…
              </>
            ) : (
              <>
                <Play size={18} /> Start
              </>
            )}
          </Button>
        ) : (
          <>
            <Button onClick={next} variant="outline" size="lg">
              <SkipForward size={18} /> Next
            </Button>
            <Button onClick={stop} variant="danger" size="lg">
              <Square size={18} /> Stop
            </Button>
            <Button onClick={toggleMic} variant="ghost" aria-label="Toggle mic">
              {micOn ? <Mic size={18} /> : <MicOff size={18} className="text-danger" />}
            </Button>
            <Button onClick={toggleCam} variant="ghost" aria-label="Toggle camera">
              {camOn ? (
                <VideoIcon size={18} />
              ) : (
                <VideoOff size={18} className="text-danger" />
              )}
            </Button>
            <Button
              onClick={addFriend}
              variant="lime"
              disabled={status !== "connected"}
            >
              <UserPlus size={18} /> Add friend
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
