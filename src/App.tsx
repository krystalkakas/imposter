/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Play, 
  Plus, 
  Info, 
  Copy, 
  Check, 
  Clock, 
  Send, 
  Trophy, 
  Home, 
  RotateCcw,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameState, Player } from './types';

export default function App() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [hintInput, setHintInput] = useState('');
  const [guessInput, setGuessInput] = useState('');
  const [copied, setCopied] = useState(false);

  const socketToPlayerId = useRef<string | null>(null);
  const currentPlayer = gameState?.players.find(p => p.id === socketToPlayerId.current);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onopen = () => {
      console.log('Connected to server');
    };

    ws.onmessage = (event) => {
      const { type, payload } = JSON.parse(event.data);
      if (type === 'room_state') {
        setGameState(payload);
      } else if (type === 'error') {
        setError(payload);
        setTimeout(() => setError(null), 3000);
      }
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  const send = (type: string, payload: any = {}) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type, payload }));
    }
  };

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setError('Vui lòng nhập tên!');
      return;
    }
    send('create_room', { name: playerName });
    
    const listener = (event: MessageEvent) => {
      const { type, payload } = JSON.parse(event.data);
      if (type === 'room_state') {
        socketToPlayerId.current = payload.players[0].id;
        socket?.removeEventListener('message', listener);
      }
    };
    socket?.addEventListener('message', listener);
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      setError('Vui lòng nhập tên!');
      return;
    }
    if (!roomIdInput.trim()) {
      setError('Vui lòng nhập mã phòng!');
      return;
    }
    send('join_room', { roomId: roomIdInput, name: playerName });
    
    const listener = (event: MessageEvent) => {
      const { type, payload } = JSON.parse(event.data);
      if (type === 'room_state') {
        // Find the player with our name who isn't the host (usually us)
        const me = payload.players.find((p: Player) => p.name === playerName && !p.isHost);
        if (me) socketToPlayerId.current = me.id;
        socket?.removeEventListener('message', listener);
      }
    };
    socket?.addEventListener('message', listener);
  };

  const handleStartGame = () => {
    send('start_game');
  };

  const handleSubmitHint = () => {
    if (!hintInput.trim()) return;
    send('submit_hint', { hint: hintInput });
    setHintInput('');
  };

  const handleVote = (targetId: string) => {
    if (currentPlayer?.hasVoted || currentPlayer?.isEliminated) return;
    send('cast_vote', { targetId });
  };

  const handleGuess = () => {
    if (!guessInput.trim()) return;
    send('impostor_guess', { keyword: guessInput });
    setGuessInput('');
  };

  const handlePlayAgain = () => {
    send('play_again');
  };

  const handleCancelGame = () => {
    send('cancel_game');
  };

  const handleUpdateMaxRounds = (val: number) => {
    send('update_settings', { maxRounds: val });
  };

  const copyRoomId = () => {
    if (gameState) {
      navigator.clipboard.writeText(gameState.roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (gameState?.phase === 'RESULT' && gameState.winner) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: gameState.winner === 'CIVILIANS' ? ['#06b6d4', '#ffffff'] : ['#8b5cf6', '#ffffff']
      });
    }
  }, [gameState?.phase, gameState?.winner]);

  // Views
  const renderHome = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 max-w-[500px] mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl sm:text-6xl font-display font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          KẺ MẠO DANH
        </h1>
        <p className="text-slate-400">Ai là người đang nói dối?</p>
      </motion.div>

      <div className="w-full space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400 ml-1">Tên của bạn</label>
          <input 
            type="text" 
            placeholder="Nhập tên hiển thị..."
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-lg"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 pt-4">
          <button 
            onClick={handleCreateRoom}
            className="flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={24} />
            Tạo phòng mới
          </button>

          <div className="relative">
            <input 
              type="text" 
              placeholder="Mã phòng (6 ký tự)"
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all text-lg uppercase"
            />
            <button 
              onClick={handleJoinRoom}
              className="absolute right-2 top-2 bottom-2 bg-secondary hover:bg-secondary/90 text-white font-bold px-6 rounded-xl transition-all"
            >
              Vào
            </button>
          </div>
        </div>

        <button 
          onClick={() => setShowRules(true)}
          className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-colors py-4"
        >
          <Info size={20} />
          Luật chơi
        </button>
      </div>

      <AnimatePresence>
        {showRules && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-[500px] w-full max-h-[80vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-display font-bold mb-6 text-secondary">Luật Chơi</h2>
              <div className="space-y-4 text-slate-300">
                <p><span className="text-white font-bold">1. Vai trò:</span> Mỗi phòng có 1 Kẻ mạo danh, còn lại là Dân thường.</p>
                <p><span className="text-white font-bold">2. Từ khóa:</span> Dân thường nhận được từ khóa bí mật. Kẻ mạo danh chỉ biết chủ đề.</p>
                <p><span className="text-white font-bold">3. Gợi ý:</span> Lần lượt mỗi người đưa ra một gợi ý ngắn liên quan đến từ khóa.</p>
                <p><span className="text-white font-bold">4. Bỏ phiếu:</span> Sau khi tất cả đưa gợi ý, cả phòng bỏ phiếu chọn ra kẻ mạo danh.</p>
                <p><span className="text-white font-bold">5. Cơ hội cuối:</span> Nếu kẻ mạo danh bị loại, họ có 1 cơ hội đoán từ khóa để lật ngược thế cờ.</p>
                <p><span className="text-white font-bold">6. Thắng cuộc:</span> Kẻ mạo danh thắng nếu không bị loại HOẶC đoán đúng từ khóa. Dân thường thắng nếu loại đúng kẻ mạo danh VÀ hắn đoán sai.</p>
              </div>
              <button 
                onClick={() => setShowRules(false)}
                className="w-full mt-8 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all"
              >
                Đã hiểu
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderLobby = () => (
    <div className="flex flex-col min-h-screen p-6 max-w-[900px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-1">Mã phòng</h2>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-display font-bold text-white tracking-wider">{gameState?.roomId}</span>
            <button 
              onClick={copyRoomId}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all text-slate-400 hover:text-white"
            >
              {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
            </button>
          </div>
        </div>
          <div className="text-right ml-6">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-1">Người chơi</h2>
            <span className="text-3xl font-display font-bold text-white">{gameState?.players.length}/10</span>
          </div>
      </div>

      <div className="flex-1 bg-slate-800/30 border border-slate-800 rounded-3xl p-6 mb-8 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {gameState?.players.map((player) => (
            <motion.div 
              key={player.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center p-4 bg-slate-900/50 rounded-2xl border border-slate-800 relative"
            >
              <div className="text-4xl mb-2 animate-float">{player.avatar}</div>
              <span className="font-medium text-center truncate w-full">{player.name}</span>
              <span className="text-xs text-primary font-bold mt-1">{player.score} điểm</span>
              {player.isHost && (
                <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-1 rounded-full uppercase">Chủ</span>
              )}
            </motion.div>
          ))}
          {Array.from({ length: Math.max(0, 3 - (gameState?.players.length || 0)) }).map((_, i) => (
            <div key={i} className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-800 rounded-2xl text-slate-700">
              <Users size={32} />
            </div>
          ))}
        </div>
      </div>

      {currentPlayer?.isHost ? (
        <div className="space-y-6">
          <div className="bg-slate-800/30 p-6 rounded-3xl border border-slate-800">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Cài đặt trò chơi</h3>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-bold">Số vòng tối đa</span>
                <span className="text-xs text-slate-500">Buộc phải vote khi hết vòng</span>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleUpdateMaxRounds(Math.max(1, (gameState?.maxRounds || 10) - 1))}
                  className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
                >
                  -
                </button>
                <span className="text-xl font-bold w-8 text-center">{gameState?.maxRounds}</span>
                <button 
                  onClick={() => handleUpdateMaxRounds(Math.min(20, (gameState?.maxRounds || 10) + 1))}
                  className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
                >
                  +
                </button>
              </div>
            </div>
          </div>
          <button 
            onClick={handleStartGame}
            disabled={(gameState?.players.length || 0) < 3}
            className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-5 rounded-2xl transition-all shadow-lg shadow-primary/20 text-xl"
          >
            <Play size={24} />
            Bắt đầu trò chơi
          </button>
        </div>
      ) : (
        <div className="text-center p-8 bg-slate-800/30 rounded-3xl border border-slate-800">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-400">Đang chờ chủ phòng bắt đầu...</p>
        </div>
      )}
    </div>
  );

  const renderRoleReveal = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 max-w-[500px] mx-auto">
      <h2 className="text-2xl font-display font-bold mb-12 text-center">Vai trò của bạn</h2>
      
      <div className="w-full aspect-[3/4]">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full h-full bg-slate-800 rounded-[2rem] flex flex-col items-center justify-center p-8 border-4 border-primary/50 shadow-2xl"
        >
          {currentPlayer?.role === 'IMPOSTOR' ? (
            <>
              <h3 className="text-3xl font-display font-bold text-primary mb-4 uppercase">Kẻ Mạo Danh</h3>
              <div className="text-8xl mb-8 animate-float">🕵️</div>
              <p className="text-slate-400 mb-2 uppercase text-sm font-bold tracking-widest">Chủ đề</p>
              <p className="text-3xl font-bold text-white bg-primary/20 px-8 py-3 rounded-2xl border border-primary/30 shadow-inner">{gameState?.topic}</p>
              <p className="mt-12 text-center text-slate-400 text-sm italic leading-relaxed">
                Bạn không biết từ khóa chính xác.<br/>Hãy lắng nghe gợi ý của người khác và hòa nhập!
              </p>
            </>
          ) : (
            <>
              <h3 className="text-3xl font-display font-bold text-secondary mb-4 uppercase">Dân Thường</h3>
              <div className="text-8xl mb-8 animate-float">👨‍🌾</div>
              <p className="text-slate-400 mb-2 uppercase text-sm font-bold tracking-widest">Từ khóa của bạn</p>
              <p className="text-4xl font-bold text-white bg-secondary/20 px-8 py-3 rounded-2xl border border-secondary/30 shadow-inner">{gameState?.keyword}</p>
              <p className="mt-12 text-center text-slate-400 text-sm italic leading-relaxed">
                Hãy đưa ra gợi ý đủ để đồng đội hiểu<br/>nhưng đừng quá lộ liễu cho kẻ mạo danh!
              </p>
            </>
          )}
        </motion.div>
      </div>

      <p className="mt-12 text-slate-500 text-center animate-pulse">Trò chơi sẽ bắt đầu sau vài giây...</p>
    </div>
  );

  const renderHinting = () => {
    const isMyTurn = gameState?.players[gameState.currentTurnIndex].id === currentPlayer?.id;
    const currentTurnPlayer = gameState?.players[gameState.currentTurnIndex];

    return (
      <div className="flex flex-col min-h-screen p-6 max-w-[900px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="text-4xl">{currentTurnPlayer?.avatar}</div>
            <div>
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-widest">Lượt của</h2>
              <p className="text-xl font-bold text-white">{currentTurnPlayer?.name}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-widest">Vòng chơi</h2>
            <p className="text-xl font-bold text-white">{gameState?.currentRound}/{gameState?.maxRounds}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-hidden">
          <div className="md:col-span-2 flex flex-col gap-4 overflow-y-auto pr-2 pb-20">
            {gameState?.players.map((player) => (
              <div 
                key={player.id}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  player.isEliminated ? 'opacity-40 grayscale' :
                  player.id === currentTurnPlayer?.id 
                    ? 'bg-primary/10 border-primary shadow-lg shadow-primary/5' 
                    : 'bg-slate-800/30 border-slate-800'
                }`}
              >
                <div className="text-3xl">{player.avatar}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm">{player.name} {player.isEliminated && '(Đã bị loại)'}</span>
                    {player.hint && !player.isEliminated && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold uppercase">Đã xong</span>}
                  </div>
                  <p className={`text-lg ${player.hint ? 'text-white' : 'text-slate-600 italic'}`}>
                    {player.isEliminated ? '---' : (player.hint || 'Đang suy nghĩ...')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Thông tin của bạn</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Vai trò</p>
                  <p className={`font-bold ${currentPlayer?.role === 'IMPOSTOR' ? 'text-primary' : 'text-secondary'}`}>
                    {currentPlayer?.role === 'IMPOSTOR' ? 'Kẻ Mạo Danh' : 'Dân Thường'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">{currentPlayer?.role === 'IMPOSTOR' ? 'Chủ đề' : 'Từ khóa'}</p>
                  <p className="font-bold text-xl">
                    {currentPlayer?.role === 'IMPOSTOR' ? gameState?.topic : gameState?.keyword}
                  </p>
                </div>
              </div>
            </div>

            {isMyTurn && !currentPlayer?.hint && !currentPlayer?.isEliminated && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex flex-col gap-3"
              >
                <textarea 
                  placeholder="Nhập gợi ý của bạn..."
                  value={hintInput}
                  onChange={(e) => setHintInput(e.target.value)}
                  className="w-full bg-slate-900 border border-primary/50 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none h-32"
                />
                <button 
                  onClick={handleSubmitHint}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-primary/20"
                >
                  <Send size={20} />
                  Gửi gợi ý
                </button>
              </motion.div>
            )}

            {currentPlayer?.isHost && (
              <button 
                onClick={handleCancelGame}
                className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-4 rounded-2xl border border-red-500/30 transition-all mt-auto"
              >
                <X size={20} />
                Hủy trận đấu
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderVoting = () => (
    <div className="flex flex-col min-h-screen p-6 max-w-[900px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="text-left">
          <h2 className="text-4xl font-display font-bold mb-2 text-primary">Bỏ phiếu!</h2>
          <p className="text-slate-400">Ai là kẻ mạo danh?</p>
        </div>
        <div className="text-right">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-widest">Vòng chơi</h2>
          <p className="text-xl font-bold text-white">{gameState?.currentRound}/{gameState?.maxRounds}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {gameState?.players.map((player) => (
          <button 
            key={player.id}
            disabled={currentPlayer?.hasVoted || player.id === currentPlayer?.id || player.isEliminated}
            onClick={() => handleVote(player.id)}
            className={`flex flex-col items-center gap-2 p-6 rounded-3xl border transition-all relative overflow-hidden group ${
              player.id === currentPlayer?.id ? 'opacity-50 grayscale' : ''
            } ${
              currentPlayer?.hasVoted ? 'cursor-default' : 'hover:border-primary hover:bg-primary/5'
            } bg-slate-800/30 border-slate-800`}
          >
            <div className="text-5xl group-hover:scale-110 transition-transform mb-2">{player.avatar}</div>
            <div className="text-center">
              <p className="font-bold text-lg">{player.name}</p>
              <p className="text-xs text-slate-500 italic truncate max-w-[150px]">"{player.hint}"</p>
            </div>
            {player.hasVoted && (
              <div className="absolute top-2 right-2 text-green-400">
                <Check size={16} />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700">
              {gameState?.phase === 'VOTING' ? null : (
                <motion.div 
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${(player.voteCount / (gameState?.players.length || 1)) * 100}%` }}
                />
              )}
            </div>
          </button>
        ))}

        <button 
          disabled={currentPlayer?.hasVoted || currentPlayer?.isEliminated}
          onClick={() => handleVote('skip')}
          className={`flex flex-col items-center justify-center gap-2 p-6 rounded-3xl border transition-all relative overflow-hidden group ${
            currentPlayer?.hasVoted ? 'cursor-default' : 'hover:border-white hover:bg-white/5'
          } bg-slate-800/30 border-slate-800 border-dashed`}
        >
          <div className="text-5xl mb-2">🏳️</div>
          <div className="text-center">
            <p className="font-bold text-lg">Bỏ phiếu trắng</p>
            <p className="text-xs text-slate-500 italic">Không loại ai vòng này</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700">
            {gameState?.phase === 'VOTING' ? null : (
              <motion.div 
                className="h-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${(gameState?.skipVotes || 0) / (gameState?.players.length || 1) * 100}%` }}
              />
            )}
          </div>
        </button>
      </div>

      <div className="mt-auto flex flex-col gap-4">
        <div className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700 text-center">
          <p className="text-slate-400 mb-2 uppercase text-xs font-bold tracking-widest">Tiến độ bỏ phiếu</p>
          <div className="flex justify-center gap-2">
            {gameState?.players.filter(p => !p.isEliminated).map((p) => (
              <div key={p.id} className={`w-3 h-3 rounded-full ${p.hasVoted ? 'bg-green-500' : 'bg-slate-700'}`} />
            ))}
          </div>
        </div>

        {currentPlayer?.isHost && (
          <button 
            onClick={handleCancelGame}
            className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-4 rounded-2xl border border-red-500/30 transition-all"
          >
            <X size={20} />
            Hủy trận đấu
          </button>
        )}
      </div>
    </div>
  );

  const renderImpostorGuess = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 max-w-[500px] mx-auto text-center">
      <div className="text-6xl mb-8 animate-bounce">🕵️</div>
      <h2 className="text-3xl font-display font-bold mb-4 text-primary">Kẻ mạo danh đã bị lộ!</h2>
      <p className="text-slate-400 mb-12">Nhưng họ vẫn còn một cơ hội cuối cùng. Nếu đoán đúng từ khóa, kẻ mạo danh sẽ thắng!</p>

      {currentPlayer?.role === 'IMPOSTOR' ? (
        <div className="w-full space-y-4">
          <div className="space-y-2 text-left">
            <label className="text-sm font-medium text-slate-400 ml-1">Đoán từ khóa</label>
            <input 
              type="text" 
              placeholder="Nhập từ khóa bạn nghĩ..."
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              className="w-full bg-slate-800/50 border border-primary/50 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-lg"
            />
          </div>
          <button 
            onClick={handleGuess}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-primary/20 text-lg"
          >
            Xác nhận dự đoán
          </button>
        </div>
      ) : (
        <div className="p-8 bg-slate-800/30 rounded-3xl border border-slate-800 w-full">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-400">Đang chờ kẻ mạo danh đoán từ khóa...</p>
        </div>
      )}

      {currentPlayer?.isHost && (
        <button 
          onClick={handleCancelGame}
          className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-4 rounded-2xl border border-red-500/30 transition-all mt-12"
        >
          <X size={20} />
          Hủy trận đấu
        </button>
      )}
    </div>
  );

  const renderResult = () => {
    const isWin = (currentPlayer?.role === 'IMPOSTOR' && gameState?.winner === 'IMPOSTOR') || 
                 (currentPlayer?.role === 'CIVILIAN' && gameState?.winner === 'CIVILIANS');
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 max-w-[600px] mx-auto text-center">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8"
        >
          {gameState?.winner === 'IMPOSTOR' ? (
            <div className="text-8xl mb-4">🕵️🏆</div>
          ) : (
            <div className="text-8xl mb-4">👨‍🌾🏆</div>
          )}
        </motion.div>

        <h2 className={`text-5xl font-display font-bold mb-4 ${isWin ? 'text-green-400' : 'text-red-400'}`}>
          {isWin ? 'BẠN ĐÃ THẮNG!' : 'BẠN ĐÃ THUA!'}
        </h2>
        <p className="text-2xl text-white mb-12">
          {gameState?.winner === 'IMPOSTOR' ? 'Kẻ mạo danh đã chiến thắng!' : 'Dân thường đã chiến thắng!'}
        </p>

        <div className="w-full grid grid-cols-2 gap-4 mb-12">
          <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
            <p className="text-xs text-slate-500 uppercase font-bold mb-2">Chủ đề</p>
            <p className="text-xl font-bold">{gameState?.topic}</p>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
            <p className="text-xs text-slate-500 uppercase font-bold mb-2">Từ khóa</p>
            <p className="text-xl font-bold text-secondary">{gameState?.keyword}</p>
          </div>
        </div>

        {gameState?.lastGuess && (
          <div className="mb-12 p-4 bg-primary/10 border border-primary/30 rounded-2xl w-full">
            <p className="text-sm text-slate-400 mb-1">Kẻ mạo danh đã đoán:</p>
            <p className="text-xl font-bold italic">"{gameState.lastGuess}"</p>
          </div>
        )}

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          {currentPlayer?.isHost && (
            <button 
              onClick={handlePlayAgain}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl transition-all"
            >
              <RotateCcw size={20} />
              Về phòng chờ
            </button>
          )}
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all"
          >
            <Home size={20} />
            Trang chủ
          </button>
        </div>
      </div>
    );
  };

  // Error Toast
  const renderError = () => (
    <AnimatePresence>
      {error && (
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-red-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3"
        >
          <AlertCircle size={20} />
          <span className="font-medium">{error}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!gameState) return (
    <>
      {renderHome()}
      {renderError()}
    </>
  );

  return (
    <div className="min-h-screen bg-bg text-white selection:bg-primary/30">
      {gameState.phase === 'LOBBY' && renderLobby()}
      {gameState.phase === 'ROLE_REVEAL' && renderRoleReveal()}
      {gameState.phase === 'HINTING' && renderHinting()}
      {gameState.phase === 'VOTING' && renderVoting()}
      {gameState.phase === 'IMPOSTOR_GUESS' && renderImpostorGuess()}
      {gameState.phase === 'RESULT' && renderResult()}
      {renderError()}
    </div>
  );
}
