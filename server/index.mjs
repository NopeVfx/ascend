import http from "node:http";
import express from "express";
import cors from "cors";
import { ExpressPeerServer } from "peer";
import { WebSocketServer } from "ws";

const PORT = Number(process.env.PORT || 3001);

const app = express();
app.use(cors());
app.get("/health", (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);

// PeerJS (WebRTC signaling) mounted at /peerjs
const peerServer = ExpressPeerServer(server, { path: "/" });
app.use("/peerjs", peerServer);

// Omegle-style matchmaking over a plain WebSocket at /match
const wss = new WebSocketServer({ server, path: "/match" });

/** @type {import('ws').WebSocket | null} */
let waiting = null;

function send(ws, payload) {
  if (ws && ws.readyState === ws.OPEN) ws.send(JSON.stringify(payload));
}

function detach(ws) {
  if (waiting === ws) waiting = null;
  if (ws.partner) {
    const partner = ws.partner;
    ws.partner = null;
    partner.partner = null;
    send(partner, { type: "partner-left" });
  }
}

function tryMatch(ws) {
  if (waiting && waiting !== ws && waiting.readyState === waiting.OPEN) {
    const other = waiting;
    waiting = null;
    ws.partner = other;
    other.partner = ws;
    send(ws, {
      type: "matched",
      partnerPeerId: other.peerId,
      partnerUserId: other.userId ?? null,
      initiator: true,
    });
    send(other, {
      type: "matched",
      partnerPeerId: ws.peerId,
      partnerUserId: ws.userId ?? null,
      initiator: false,
    });
  } else {
    waiting = ws;
    send(ws, { type: "waiting" });
  }
}

wss.on("connection", (ws) => {
  ws.peerId = null;
  ws.userId = null;
  ws.partner = null;

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (msg.type === "ready" && msg.peerId) {
      ws.peerId = msg.peerId;
      ws.userId = msg.userId ?? null;
      detach(ws);
      tryMatch(ws);
    } else if (msg.type === "leave") {
      detach(ws);
    }
  });

  ws.on("close", () => detach(ws));
  ws.on("error", () => detach(ws));
});

server.listen(PORT, () => {
  console.log(
    `Ascend signaling server on :${PORT} — PeerJS at /peerjs, matchmaking at /match`,
  );
});
