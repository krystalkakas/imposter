export type GamePhase = 'LOBBY' | 'ROLE_REVEAL' | 'HINTING' | 'VOTING' | 'IMPOSTOR_GUESS' | 'RESULT';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  role?: 'CIVILIAN' | 'IMPOSTOR';
  isHost: boolean;
  isReady: boolean;
  isEliminated: boolean;
  hint?: string;
  voteCount: number;
  hasVoted: boolean;
  score: number;
}

export interface GameState {
  roomId: string;
  phase: GamePhase;
  players: Player[];
  topic?: string;
  keyword?: string;
  currentTurnIndex: number;
  currentRound: number;
  maxRounds: number;
  winner?: 'CIVILIANS' | 'IMPOSTOR';
  eliminatedPlayerId?: string;
  lastGuess?: string;
  skipVotes: number;
  usedKeywords: string[];
}

export interface ServerToClientEvents {
  room_state: (state: GameState) => void;
  error: (message: string) => void;
  toast: (message: string) => void;
}

export interface ClientToServerEvents {
  join_room: (data: { roomId: string; name: string }) => void;
  create_room: (data: { name: string }) => void;
  update_settings: (settings: { rounds: number; turnTime: number }) => void;
  start_game: () => void;
  submit_hint: (hint: string) => void;
  cast_vote: (targetId: string) => void;
  impostor_guess: (keyword: string) => void;
  play_again: () => void;
}
