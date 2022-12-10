import { ChessPieces, Colors } from "../types/common";
import {
  GameState,
  GameStateObject,
  GameStateRow,
  PossibleMoves,
} from "../types/game";
import FenValidator from "./FenValidator";
import { MovesGenerator } from "./MovesGenerator";
import { mapColumnIndexToLetter } from "../utils";
import { MoveMaker } from "./MoveMaker";
import { MoveIndexes } from "./MoveIndexes";

type FenFieldSymbol =
  | "p"
  | "r"
  | "n"
  | "b"
  | "q"
  | "k"
  | "P"
  | "R"
  | "N"
  | "B"
  | "Q"
  | "K";

export const fenSymbolsToPiecesMapping = {
  p: { color: Colors.BLACK, piece: ChessPieces.PAWN },
  r: { color: Colors.BLACK, piece: ChessPieces.ROOK },
  n: { color: Colors.BLACK, piece: ChessPieces.KNIGHT },
  b: { color: Colors.BLACK, piece: ChessPieces.BISHOP },
  q: { color: Colors.BLACK, piece: ChessPieces.QUEEN },
  k: { color: Colors.BLACK, piece: ChessPieces.KING },
  P: { color: Colors.WHITE, piece: ChessPieces.PAWN },
  R: { color: Colors.WHITE, piece: ChessPieces.ROOK },
  N: { color: Colors.WHITE, piece: ChessPieces.KNIGHT },
  B: { color: Colors.WHITE, piece: ChessPieces.BISHOP },
  Q: { color: Colors.WHITE, piece: ChessPieces.QUEEN },
  K: { color: Colors.WHITE, piece: ChessPieces.KING },
};

class Game {
  fen: string;
  gameState: GameState;
  movesNext: Colors;
  castlingAvailability: string;
  enPassantPossibility: string;
  halfMoveClock: number;
  fullMoveNumber: number;
  possibleMoves: PossibleMoves;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isInsufficientMaterial: boolean;
  private START_GAME_FEN =
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  constructor(fen?: string) {
    this.fen = fen || this.START_GAME_FEN;
    this.fenToGameState(this.fen);
    this.getAllPossibleMoves();
  }

  private parseGameStateRowFen = (gameRowFen: string) => {
    const symbols = gameRowFen.split("");
    return symbols.reduce((acc: GameStateRow, curr: string) => {
      const numberValue = Number(curr);
      return isNaN(numberValue)
        ? [...acc, fenSymbolsToPiecesMapping[curr as FenFieldSymbol]]
        : [...acc, ...(Array(numberValue).fill(null) as GameStateRow)];
    }, []);
  };

  private parseGameStateFen(gameStateFen: string): GameState {
    const rows = gameStateFen.split("/").reverse();
    const result = rows.map(this.parseGameStateRowFen) as GameState;
    return result;
  }

  private fenToGameState(fen: string) {
    if (!FenValidator.validateFen(fen)) {
      throw new Error("Fen string invalid");
    }
    const [
      gameState,
      movesNext,
      castlingAvailability,
      enPassantPossibility,
      halfMoveClock,
      fullMoveCounter,
    ] = fen.split(" ");
    this.movesNext = movesNext === "w" ? Colors.WHITE : Colors.BLACK;
    this.castlingAvailability = castlingAvailability;
    this.enPassantPossibility = enPassantPossibility;
    this.halfMoveClock = Number(halfMoveClock);
    this.fullMoveNumber = Number(fullMoveCounter);
    this.gameState = this.parseGameStateFen(gameState);
  }

  private getAllPossibleMoves() {
    const movesGenerator = new MovesGenerator(this.gameState);
    const {
      allMoves,
      isCheck,
      isCheckmate,
      isStalemate,
      isInsufficientMaterial,
    } = movesGenerator.getAllPossibleMoves(
      this.movesNext,
      this.castlingAvailability,
      this.enPassantPossibility,
    );
    this.isCheck = isCheck;
    this.isCheckmate = isCheckmate;
    this.isStalemate = isStalemate;
    this.isInsufficientMaterial = isInsufficientMaterial;
    this.possibleMoves = allMoves;
  }

  public getGameStateObject(): GameStateObject {
    const gameStateObject = {};
    this.gameState.forEach((row, row_index) => {
      row.forEach((field, column_index) => {
        const piecePosition = `${mapColumnIndexToLetter(column_index)}${
          row_index + 1
        }`;
        if (field) {
          gameStateObject[piecePosition] = field;
        }
      });
    });
    return gameStateObject;
  }

  public isPromotionMove(from: string, to: string) {
    const moveIndexes = new MoveIndexes(from, to);
    return MoveMaker.isPromotionMove(
      this.gameState,
      moveIndexes,
      this.movesNext,
    );
  }

  public isDraw() {
    if (this.isStalemate) {
      return { isDraw: true, reason: "Stalemate" };
    }
    if (this.isInsufficientMaterial) {
      return { isDraw: true, reason: "Insufficient Material" };
    }
    return { isDraw: false };
  }

  public move(from: string, to: string, promotion: string = "q") {
    if (this.possibleMoves[from].includes(to)) {
      const moveMaker = new MoveMaker(
        this.gameState,
        this.enPassantPossibility,
        this.movesNext,
        this.castlingAvailability,
      );
      const { gameState, enPassantPossibility, castlingAvailability } =
        moveMaker.move(from, to, promotion);
      this.gameState = gameState;
      this.enPassantPossibility = enPassantPossibility;
      this.castlingAvailability = castlingAvailability;
      this.movesNext =
        this.movesNext === Colors.WHITE ? Colors.BLACK : Colors.WHITE;
      this.getAllPossibleMoves();
      return true;
    }
    return false;
  }
}

export default Game;
