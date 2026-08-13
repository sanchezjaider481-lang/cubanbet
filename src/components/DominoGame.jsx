import React, { useState, useEffect, useRef, useCallback } from "react";
import { Home, HelpCircle, User, Bot, X } from "lucide-react";

/* ============================================================
   DOMINÓ CUBANO — Versión Definitiva
   ============================================================ */

const buildDeck = () => {
  const deck = [];
  for (let a = 0; a <= 6; a++) {
    for (let b = a; b <= 6; b++) deck.push([a, b]);
  }
  return deck; 
};

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const pipSum = (hand) => hand.reduce((s, [a, b]) => s + a + b, 0);
const isDouble = (t) => t[0] === t[1];
const hasValue = (tile, v) => tile[0] === v || tile[1] === v;

const PLAYER_ORDER = ["tu", "der", "norte", "izq"];
const NAMES = { tu: "Tú", der: "Bot Der", norte: "Bot Norte", izq: "Bot Izq" };

const nextPlayer = (current) => {
  const i = PLAYER_ORDER.indexOf(current);
  return PLAYER_ORDER[(i + 1) % PLAYER_ORDER.length];
};

const PIP_PATTERNS = {
  0: [],
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function Half({ value }) {
  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-0.5 p-0.5 w-full h-full">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="flex items-center justify-center">
          {PIP_PATTERNS[value]?.includes(i) && (
            <span className="w-1.5 h-1.5 rounded-full bg-stone-800" />
          )}
        </div>
      ))}
    </div>
  );
}

function BoardTile({ tile }) {
  const [a, b] = tile;
  const double = isDouble(tile);

  if (double) {
    return (
      <div className="flex-shrink-0 flex flex-col w-8 h-14 rounded-md overflow-hidden border border-stone-400 bg-gradient-to-b from-amber-50 to-amber-100 shadow-md">
        <Half value={a} />
        <div className="h-px bg-stone-400/70" />
        <Half value={b} />
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 flex flex-row w-14 h-8 rounded-md overflow-hidden border border-stone-400 bg-gradient-to-br from-amber-50 to-amber-100 shadow-md">
      <Half value={a} />
      <div className="w-px bg-stone-400/70" />
      <Half value={b} />
    </div>
  );
}

function TileV({ a, b, onClick, disabled, playable }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-shrink-0 flex flex-col w-11 h-20 sm:w-12 sm:h-24 rounded-lg overflow-hidden border shadow-md transition-all duration-150
        bg-gradient-to-b from-amber-50 to-amber-100 cursor-pointer
        ${
          playable
            ? "border-emerald-500 ring-2 ring-emerald-400 -translate-y-2 active:translate-y-0"
            : "border-stone-400 opacity-80"
        }
        ${disabled && !playable ? "cursor-default opacity-60" : ""}
      `}
    >
      <Half value={a} />
      <div className="h-px bg-stone-400/70" />
      <Half value={b} />
    </button>
  );
}

function PlayerBadge({ label, points, isTurn, isBot, tileCount, align = "row" }) {
  return (
    <div
      className={`flex ${align === "col" ? "flex-col" : "flex-row"} items-center gap-1.5 px-3 py-1.5 rounded-full
      bg-gradient-to-b from-red-900 to-red-950 border-2 shadow-lg
      ${isTurn ? "border-amber-300 shadow-amber-400/50" : "border-red-950/60"}
      `}
    >
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center ${
          isTurn ? "bg-amber-300 text-red-950" : "bg-amber-100/90 text-red-900"
        }`}
      >
        {isBot ? <Bot size={14} /> : <User size={14} />}
      </div>
      <div className="text-center leading-tight">
        <div className="text-[10px] font-semibold text-amber-100/90">{label}</div>
        <div className="text-xs font-bold text-amber-50">{points} PTS</div>
      </div>
      {typeof tileCount === "number" && (
        <div className="text-[10px] font-bold text-amber-200/80 ml-1">{tileCount}🁢</div>
      )}
    </div>
  );
}

export default function DominoGame() {
  const [state, setState] = useState(() => makeInitialState());
  const [showHelp, setShowHelp] = useState(false);
  const [showHome, setShowHome] = useState(false);
  const [pendingTile, setPendingTile] = useState(null);
  
  const stateRef = useRef(state);
  stateRef.current = state;
  const timeoutRef = useRef(null);

  function makeInitialState() {
    return {
      hands: { tu: [], der: [], norte: [], izq: [] },
      board: [], 
      leftEnd: null,
      rightEnd: null,
      turn: "tu",
      scores: { tu: 0, der: 0, norte: 0, izq: 0 },
      passCount: 0,
      status: "playing",
      message: "Repartiendo fichas...",
      lastWinner: null,
      round: 1,
    };
  }

  const startRound = useCallback((prevScores = null, prevWinner = null, roundNum = 1) => {
    const deck = shuffle(buildDeck());
    const hands = {
      tu: deck.slice(0, 7),
      der: deck.slice(7, 14),
      norte: deck.slice(14, 21),
      izq: deck.slice(21, 28),
    };

    let starter = prevWinner;
    if (!starter) {
      outer: for (let d = 6; d >= 0; d--) {
        for (const p of PLAYER_ORDER) {
          if (hands[p].some((t) => t[0] === d && t[1] === d)) {
            starter = p;
            break outer;
          }
        }
      }
    }

    setState({
      hands,
      board: [],
      leftEnd: null,
      rightEnd: null,
      turn: starter || "tu",
      scores: prevScores || { tu: 0, der: 0, norte: 0, izq: 0 },
      passCount: 0,
      status: "playing",
      message: `Comienza ${NAMES[starter || "tu"]}. Ronda ${roundNum}.`,
      lastWinner: null,
      round: roundNum,
    });
    setPendingTile(null);
  }, []);

  useEffect(() => {
    startRound();
  }, [startRound]);

  const applyMove = (s, player, tileIdx, side) => {
    if (!s.hands[player] || !s.hands[player][tileIdx]) return s;
    
    const hand = [...s.hands[player]];
    const tile = hand[tileIdx];
    hand.splice(tileIdx, 1);

    let newBoard = [...s.board];
    let newLeft = s.leftEnd;
    let newRight = s.rightEnd;

    if (s.board.length === 0) {
      newBoard = [[tile[0], tile[1]]];
      newLeft = tile[0];
      newRight = tile[1];
    } else if (side === "left") {
      const match = s.leftEnd;
      const other = tile[0] === match ? tile[1] : tile[0];
      newBoard = [[other, match], ...newBoard];
      newLeft = other;
    } else {
      const match = s.rightEnd;
      const other = tile[0] === match ? tile[1] : tile[0];
      newBoard = [...newBoard, [match, other]];
      newRight = other;
    }

    const newHands = { ...s.hands, [player]: hand };

    if (hand.length === 0) {
      const points = PLAYER_ORDER.filter((p) => p !== player).reduce(
        (sum, p) => sum + pipSum(newHands[p]),
        0
      );
      const newScores = { ...s.scores, [player]: s.scores[player] + points };
      return {
        ...s,
        hands: newHands,
        board: newBoard,
        leftEnd: newLeft,
        rightEnd: newRight,
        status: "over",
        scores: newScores,
        lastWinner: player,
        message: `¡${NAMES[player]} hizo dominó! +${points} puntos.`,
      };
    }

    return {
      ...s,
      hands: newHands,
      board: newBoard,
      leftEnd: newLeft,
      rightEnd: newRight,
      passCount: 0,
      turn: nextPlayer(player),
      message: `${NAMES[player]} jugó ficha.`,
    };
  };

  const applyPass = (s, player) => {
    const passCount = s.passCount + 1;
    if (passCount >= 4) {
      let winner = PLAYER_ORDER[0];
      let minPips = Infinity;
      PLAYER_ORDER.forEach((p) => {
        const sum = pipSum(s.hands[p]);
        if (sum < minPips) {
          minPips = sum;
          winner = p;
        }
      });
      const points = PLAYER_ORDER.filter((p) => p !== winner).reduce(
        (sum, p) => sum + pipSum(s.hands[p]),
        0
      );
      const newScores = { ...s.scores, [winner]: s.scores[winner] + points };
      return {
        ...s,
        status: "over",
        passCount,
        scores: newScores,
        lastWinner: winner,
        message: `Juego trancado. Gana ${NAMES[winner]}. +${points} pts.`,
      };
    }
    return {
      ...s,
      passCount,
      turn: nextPlayer(player),
      message: `${NAMES[player]} pasó.`,
    };
  };

  const playableSidesFor = (tile, s) => {
    if (s.board.length === 0) return { left: true, right: true, any: true };
    const left = hasValue(tile, s.leftEnd);
    const right = hasValue(tile, s.rightEnd);
    return { left, right, any: left || right };
  };

  const userHasPlayable = () => {
    const s = stateRef.current;
    return s.hands.tu.some((t) => playableSidesFor(t, s).any);
  };

  const handleTileClick = (idx) => {
    const s = stateRef.current;
    if (s.turn !== "tu" || s.status !== "playing") return;
    const tile = s.hands.tu[idx];
    const sides = playableSidesFor(tile, s);
    if (!sides.any) return;

    if (s.board.length === 0) {
      setState(applyMove(s, "tu", idx, "left"));
      return;
    }

    if (sides.left && sides.right && s.leftEnd !== s.rightEnd) {
      setPendingTile({ idx, tile });
    } else {
      const side = sides.left ? "left" : "right";
      setState(applyMove(s, "tu", idx, side));
    }
  };

  const handleChooseSide = (side) => {
    if (!pendingTile) return;
    const s = stateRef.current;
    setState(applyMove(s, "tu", pendingTile.idx, side));
    setPendingTile(null);
  };

  const handlePass = () => {
    const s = stateRef.current;
    if (s.turn !== "tu" || s.status !== "playing") return;
    if (userHasPlayable()) return;
    setState(applyPass(s, "tu"));
  };

  useEffect(() => {
    if (state.status !== "playing" || state.turn === "tu") return;

    const player = state.turn;
    timeoutRef.current = setTimeout(() => {
      const s = stateRef.current;
      if (s.status !== "playing" || s.turn !== player) return;

      const hand = s.hands[player];

      if (s.board.length === 0) {
        let bestIdx = 0;
        let bestScore = -1;
        hand.forEach((t, i) => {
          const score = (isDouble(t) ? 100 : 0) + t[0] + t[1];
          if (score > bestScore) {
            bestScore = score;
            bestIdx = i;
          }
        });
        setState(applyMove(s, player, bestIdx, "left"));
        return;
      }

      const options = hand
        .map((t, i) => ({
          i,
          t,
          left: hasValue(t, s.leftEnd),
          right: hasValue(t, s.rightEnd),
        }))
        .filter((o) => o.left || o.right);

      if (options.length === 0) {
        setState(applyPass(s, player));
        return;
      }

      options.sort((a, b) => {
        const da = isDouble(a.t) ? 1 : 0;
        const db = isDouble(b.t) ? 1 : 0;
        if (db !== da) return db - da;
        return b.t[0] + b.t[1] - (a.t[0] + a.t[1]);
      });

      const choice = options[0];
      const side = choice.left ? "left" : "right";
      setState(applyMove(s, player, choice.i, side));
    }, 700);

    return () => clearTimeout(timeoutRef.current);
  }, [state.turn, state.status]);

  const nextRound = () => startRound(state.scores, state.lastWinner, state.round + 1);
  const newGame = () => {
    startRound(null, null, 1);
    setShowHome(false);
  };

  const canPass = state.turn === "tu" && state.status === "playing" && !userHasPlayable() && state.board.length > 0;
  const userTurn = state.turn === "tu" && state.status === "playing";

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-green-700 via-green-800 to-green-900 flex flex-col select-none overflow-hidden">
      <div className="flex items-center justify-between px-3 pt-3">
        <div className="flex gap-2">
          <button
            onClick={() => setShowHome(true)}
            className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-amber-100 cursor-pointer"
          >
            <Home size={16} />
          </button>
          <button
            onClick={() => setShowHelp(true)}
            className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-amber-100 cursor-pointer"
          >
            <HelpCircle size={16} />
          </button>
        </div>
        <PlayerBadge
          label="BOT NORTE"
          points={state.scores.norte}
          isTurn={state.turn === "norte" && state.status === "playing"}
          isBot
          tileCount={state.hands.norte.length}
        />
        <div className="w-8" />
      </div>

      <div className="flex-1 flex items-center px-1 py-2 min-h-0">
        <div className="flex flex-col items-center gap-1 mr-1">
          <PlayerBadge
            label="BOT IZQ"
            points={state.scores.izq}
            isTurn={state.turn === "izq" && state.status === "playing"}
            isBot
            align="col"
            tileCount={state.hands.izq.length}
          />
        </div>

        <div className="flex-1 h-full flex items-center justify-center min-w-0">
          <div className="w-full max-h-44 overflow-x-auto overflow-y-hidden rounded-xl bg-green-900/40 border-2 border-green-950/65 shadow-inner px-4 py-3 flex items-center">
            {state.board.length === 0 ? (
              <p className="text-center text-green-100/60 text-xs italic mx-auto">
                Esperando la primera ficha...
              </p>
            ) : (
              <div className="flex flex-row items-center gap-1 w-max mx-auto">
                {state.board.map((tile, i) => (
                  <BoardTile key={i} tile={tile} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 ml-1">
          <PlayerBadge
            label="BOT DER"
            points={state.scores.der}
            isTurn={state.turn === "der" && state.status === "playing"}
            isBot
            align="col"
            tileCount={state.hands.der.length}
          />
        </div>
      </div>

      <div className="px-4">
        <div className="text-center text-[11px] sm:text-xs text-amber-100/90 bg-black/25 rounded-full py-1 px-3 mx-auto w-fit max-w-full truncate">
          {state.message}
        </div>
      </div>

      <div className="pb-3 pt-2 px-2">
        <div className="flex items-center justify-between mb-2 px-2">
          <PlayerBadge
            label="TÚ"
            points={state.scores.tu}
            isTurn={userTurn}
            tileCount={state.hands.tu.length}
          />
          <div className="flex gap-2">
            {state.status === "over" ? (
              <button
                onClick={nextRound}
                className="px-4 py-2 rounded-full bg-amber-400 text-red-950 text-xs font-bold shadow-lg cursor-pointer"
              >
                Nueva ronda
              </button>
            ) : (
              <button
                onClick={handlePass}
                disabled={!canPass}
                className={`px-4 py-2 rounded-full text-xs font-bold shadow-lg transition-colors ${
                  canPass
                    ? "bg-amber-400 text-red-950 cursor-pointer"
                    : "bg-black/30 text-amber-100/40 cursor-not-allowed"
                }`}
              >
                Pasar
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="flex flex-row gap-1.5 justify-center min-w-max px-2 pb-1">
            {state.hands.tu.map((t, i) => {
              const sides = playableSidesFor(t, state);
              const playable = userTurn && sides.any;
              return (
                <TileV
                  key={i}
                  a={t[0]}
                  b={t[1]}
                  onClick={() => handleTileClick(i)}
                  disabled={!playable}
                  playable={playable}
                />
              );
            })}
          </div>
        </div>
      </div>

      {pendingTile && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-amber-50 rounded-2xl p-5 w-full max-w-xs shadow-2xl text-center">
            <h3 className="text-sm font-bold text-red-950 mb-2">¿En qué extremo colocarla?</h3>
            <div className="flex gap-2 justify-center mt-4">
              <button
                onClick={() => handleChooseSide("left")}
                className="flex-1 py-2 rounded-xl bg-red-900 text-amber-100 text-xs font-bold shadow cursor-pointer"
              >
                Izquierda ({state.leftEnd})
              </button>
              <button
                onClick={() => handleChooseSide("right")}
                className="flex-1 py-2 rounded-xl bg-red-900 text-amber-100 text-xs font-bold shadow cursor-pointer"
              >
                Derecha ({state.rightEnd})
              </button>
            </div>
            <button
              onClick={() => setPendingTile(null)}
              className="mt-3 text-xs text-stone-500 underline cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {showHelp && (
        <Modal onClose={() => setShowHelp(false)} title="Reglas">
          <p className="text-sm text-stone-700">Toca las fichas resaltadas para jugar. Si no tienes jugada, el botón "Pasar" se activará automáticamente.</p>
        </Modal>
      )}

      {showHome && (
        <Modal onClose={() => setShowHome(false)} title="¿Reiniciar juego?">
          <div className="flex gap-2 justify-end mt-4">
            <button onClick={() => setShowHome(false)} className="px-3 py-1.5 rounded bg-stone-200 text-stone-700 text-xs cursor-pointer">Cancelar</button>
            <button onClick={newGame} className="px-3 py-1.5 rounded bg-red-800 text-white text-xs cursor-pointer">Reiniciar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-amber-50 rounded-2xl p-4 w-full max-w-sm shadow-2xl relative">
        <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 cursor-pointer">
          <X size={14} />
        </button>
        <h2 className="text-base font-bold text-red-950 mb-3 pr-6">{title}</h2>
        {children}
      </div>
    </div>
  );
}
