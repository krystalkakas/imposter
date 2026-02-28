import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { KEYWORD_DATA } from "./src/constants";
import { GameState, Player, GamePhase } from "./src/types";
import path from "path";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// In-memory store for rooms
const rooms: Map<string, GameState> = new Map();
// Map to track which socket belongs to which player/room
const socketToPlayer: Map<WebSocket, { roomId: string; playerId: string }> = new Map();

function generateRoomId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

function getRandomAvatar() {
  const emojis = ["🦊", "🐱", "🐶", "🐭", "🐹", "🐰", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🐣"];
  return emojis[Math.floor(Math.random() * emojis.length)];
}

function broadcast(roomId: string) {
  const state = rooms.get(roomId);
  if (!state) return;

  const message = JSON.stringify({ type: "room_state", payload: state });
  for (const [socket, info] of socketToPlayer.entries()) {
    if (info.roomId === roomId && socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    }
  }
}

function sendToSocket(socket: WebSocket, type: string, payload: any) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type, payload }));
  }
}

async function startServer() {
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });

  const wss = new WebSocketServer({ server });

  wss.on("connection", (socket) => {
    socket.on("message", (data) => {
      try {
        const { type, payload } = JSON.parse(data.toString());

        switch (type) {
          case "create_room": {
            const roomId = generateRoomId();
            const playerId = Math.random().toString(36).substring(2, 9);
            const player: Player = {
              id: playerId,
              name: payload.name || "Người chơi",
              avatar: getRandomAvatar(),
              isHost: true,
              isReady: true,
              isEliminated: false,
              voteCount: 0,
              hasVoted: false,
              score: 0,
            };

            const state: GameState = {
              roomId,
              phase: "LOBBY",
              players: [player],
              currentTurnIndex: 0,
              currentRound: 0,
              maxRounds: 10,
              skipVotes: 0,
            };

            rooms.set(roomId, state);
            socketToPlayer.set(socket, { roomId, playerId });
            sendToSocket(socket, "room_state", state);
            break;
          }

          case "join_room": {
            const roomId = payload.roomId.toUpperCase();
            const state = rooms.get(roomId);
            if (!state) {
              sendToSocket(socket, "error", "Phòng không tồn tại!");
              return;
            }
            if (state.phase !== "LOBBY") {
              sendToSocket(socket, "error", "Trận đấu đã bắt đầu!");
              return;
            }
            if (state.players.length >= 10) {
              sendToSocket(socket, "error", "Phòng đã đầy!");
              return;
            }

            const playerId = Math.random().toString(36).substring(2, 9);
            const player: Player = {
              id: playerId,
              name: payload.name || "Người chơi",
              avatar: getRandomAvatar(),
              isHost: false,
              isReady: true,
              isEliminated: false,
              voteCount: 0,
              hasVoted: false,
              score: 0,
            };

            state.players.push(player);
            socketToPlayer.set(socket, { roomId, playerId });
            broadcast(roomId);
            break;
          }

          case "update_settings": {
            const info = socketToPlayer.get(socket);
            if (!info) return;
            const state = rooms.get(info.roomId);
            if (!state || !state.players.find(p => p.id === info.playerId)?.isHost) return;

            if (payload.maxRounds) {
              state.maxRounds = payload.maxRounds;
            }
            broadcast(info.roomId);
            break;
          }

          case "cancel_game": {
            const info = socketToPlayer.get(socket);
            if (!info) return;
            const state = rooms.get(info.roomId);
            if (!state || !state.players.find(p => p.id === info.playerId)?.isHost) return;

            state.phase = "LOBBY";
            state.players.forEach(p => {
              p.isEliminated = false;
              p.hint = undefined;
              p.voteCount = 0;
              p.hasVoted = false;
              p.role = undefined;
            });
            broadcast(info.roomId);
            break;
          }

          case "start_game": {
            const info = socketToPlayer.get(socket);
            if (!info) return;
            const state = rooms.get(info.roomId);
            if (!state || !state.players.find(p => p.id === info.playerId)?.isHost) return;
            if (state.players.length < 3) {
              sendToSocket(socket, "error", "Cần tối thiểu 3 người chơi!");
              return;
            }

            // Setup game
            const topicData = KEYWORD_DATA[Math.floor(Math.random() * KEYWORD_DATA.length)];
            const keyword = topicData.keywords[Math.floor(Math.random() * topicData.keywords.length)];
            
            state.topic = topicData.topic;
            state.keyword = keyword;
            state.phase = "ROLE_REVEAL";
            state.currentRound = 1;
            state.currentTurnIndex = Math.floor(Math.random() * state.players.length);
            state.winner = undefined;
            state.eliminatedPlayerId = undefined;
            state.lastGuess = undefined;
            state.skipVotes = 0;

            // Assign roles
            const impostorIndex = Math.floor(Math.random() * state.players.length);
            state.players.forEach((p, i) => {
              p.role = i === impostorIndex ? "IMPOSTOR" : "CIVILIAN";
              p.isEliminated = false;
              p.hint = undefined;
              p.voteCount = 0;
              p.hasVoted = false;
            });

            broadcast(info.roomId);

            // Auto transition from role reveal to hinting after 5s
            setTimeout(() => {
              const currentState = rooms.get(info.roomId);
              if (currentState && currentState.phase === "ROLE_REVEAL") {
                currentState.phase = "HINTING";
                broadcast(info.roomId);
              }
            }, 5000);
            break;
          }

          case "submit_hint": {
            const info = socketToPlayer.get(socket);
            if (!info) return;
            const state = rooms.get(info.roomId);
            if (!state || state.phase !== "HINTING") return;

            const currentPlayer = state.players[state.currentTurnIndex];
            if (currentPlayer.id !== info.playerId) return;

            currentPlayer.hint = payload.hint;
            
            // Move to next turn
            let nextIndex = (state.currentTurnIndex + 1) % state.players.length;
            while (state.players[nextIndex].isEliminated) {
              nextIndex = (nextIndex + 1) % state.players.length;
            }
            
            // Check if all players have given hints
            const allHintsGiven = state.players.filter(p => !p.isEliminated).every(p => p.hint !== undefined);
            
            if (allHintsGiven) {
              state.phase = "VOTING";
            } else {
              state.currentTurnIndex = nextIndex;
            }
            
            broadcast(info.roomId);
            break;
          }

          case "cast_vote": {
            const info = socketToPlayer.get(socket);
            if (!info) return;
            const state = rooms.get(info.roomId);
            if (!state || state.phase !== "VOTING") return;

            const voter = state.players.find(p => p.id === info.playerId);
            if (!voter || voter.hasVoted) return;

            if (payload.targetId === "skip") {
              voter.hasVoted = true;
              state.skipVotes++;
            } else {
              const target = state.players.find(p => p.id === payload.targetId);
              if (!target) return;
              voter.hasVoted = true;
              target.voteCount++;
            }

            const allVoted = state.players.every(p => p.hasVoted);
            if (allVoted) {
              // Check if skip votes reach threshold (at least 50%)
              const threshold = state.players.filter(p => !p.isEliminated).length / 2;
              if (state.skipVotes >= threshold && state.currentRound < state.maxRounds) {
                // Skip elimination, go back to hinting
                state.phase = "HINTING";
                state.currentRound++;
                
                // Find first non-eliminated player to start the turn
                let firstIndex = 0;
                while (state.players[firstIndex].isEliminated) {
                  firstIndex++;
                }
                state.currentTurnIndex = firstIndex;
                
                state.skipVotes = 0;
                state.players.forEach(p => {
                  p.hint = undefined;
                  p.voteCount = 0;
                  p.hasVoted = false;
                });
              } else {
                // Find most voted player
                let maxVotes = -1;
                let eliminated: Player | null = null;
                
                state.players.filter(p => !p.isEliminated).forEach(p => {
                  if (p.voteCount > maxVotes) {
                    maxVotes = p.voteCount;
                    eliminated = p;
                  }
                });

                if (eliminated) {
                  (eliminated as Player).isEliminated = true;
                  state.eliminatedPlayerId = (eliminated as Player).id;
                  
                  if ((eliminated as Player).role === "IMPOSTOR") {
                    state.phase = "IMPOSTOR_GUESS";
                  } else {
                    // Check if any impostor left
                    const impostorLeft = state.players.some(p => p.role === "IMPOSTOR" && !p.isEliminated);
                    if (!impostorLeft) {
                      state.phase = "RESULT";
                      state.winner = "CIVILIANS";
                      state.players.forEach(p => {
                        if (p.role === "CIVILIAN") p.score += 1;
                      });
                    } else {
                      // Impostor wins if civilian is eliminated (in this simplified 1-impostor version)
                      // Actually, usually game continues until impostor is found or civilians are too few.
                      // But the previous code said:
                      state.phase = "RESULT";
                      state.winner = "IMPOSTOR";
                      // Update scores
                      const impostor = state.players.find(p => p.role === "IMPOSTOR");
                      if (impostor) impostor.score += 3;
                    }
                  }
                } else if (state.currentRound >= state.maxRounds) {
                   // If no one was eliminated and we are at max rounds, it's a draw or impostor wins?
                   // Usually if civilians can't find the impostor, impostor wins.
                   state.phase = "RESULT";
                   state.winner = "IMPOSTOR";
                   const impostor = state.players.find(p => p.role === "IMPOSTOR");
                   if (impostor) impostor.score += 3;
                }
              }
            }
            broadcast(info.roomId);
            break;
          }

          case "impostor_guess": {
            const info = socketToPlayer.get(socket);
            if (!info) return;
            const state = rooms.get(info.roomId);
            if (!state || state.phase !== "IMPOSTOR_GUESS") return;

            const impostor = state.players.find(p => p.id === info.playerId);
            if (!impostor || impostor.role !== "IMPOSTOR") return;

            state.lastGuess = payload.keyword;
            const isCorrect = payload.keyword.trim().toLowerCase() === state.keyword?.trim().toLowerCase();
            
            state.winner = isCorrect ? "IMPOSTOR" : "CIVILIANS";
            
            // Update scores
            if (state.winner === "IMPOSTOR") {
              const impostor = state.players.find(p => p.role === "IMPOSTOR");
              if (impostor) impostor.score += 3;
            } else {
              state.players.forEach(p => {
                if (p.role === "CIVILIAN") p.score += 1;
              });
            }

            state.phase = "RESULT";
            broadcast(info.roomId);
            break;
          }

          case "play_again": {
            const info = socketToPlayer.get(socket);
            if (!info) return;
            const state = rooms.get(info.roomId);
            if (!state) return;

            state.phase = "LOBBY";
            state.players.forEach(p => {
              p.isEliminated = false;
              p.hint = undefined;
              p.voteCount = 0;
              p.hasVoted = false;
              p.role = undefined;
            });
            broadcast(info.roomId);
            break;
          }
        }
      } catch (err) {
        console.error("WS Error:", err);
      }
    });

    socket.on("close", () => {
      const info = socketToPlayer.get(socket);
      if (info) {
        const state = rooms.get(info.roomId);
        if (state) {
          state.players = state.players.filter(p => p.id !== info.playerId);
          if (state.players.length === 0) {
            rooms.delete(info.roomId);
          } else {
            // If host left, assign new host
            if (!state.players.some(p => p.isHost)) {
              state.players[0].isHost = true;
            }
            broadcast(info.roomId);
          }
        }
        socketToPlayer.delete(socket);
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from dist
    app.use(express.static(path.join(process.cwd(), "dist")));
    
    // SPA fallback: serve index.html for any unknown routes
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }
}

startServer();
