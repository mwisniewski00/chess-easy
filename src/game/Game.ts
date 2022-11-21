import { ChessPieces, Colors } from "../types/common";
import {
  GameState,
  GameStateObject,
  GameStateRow,
  PossibleMoves,
} from "../types/game";
import FenValidator from "./FenValidator";
import { MovesGenerator } from "./MovesGenerator";
import { mapColumnIndexToLetter, mapLetterToColumnIndex } from "../utils";

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

const fenSymbolsToPiecesMapping = {
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
  private START_GAME_FEN =
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1";

  constructor(fen?: string) {
    this.fen = fen || this.START_GAME_FEN;
    this.fenToGameState(this.fen);
    this.possibleMoves = this.getAllPossibleMoves();
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
    const rows = gameStateFen.split("/");
    return rows.map(this.parseGameStateRowFen) as GameState;
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
    return movesGenerator.getAllPossibleMoves();
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

  public move(from: string, to: string) {
    if (this.possibleMoves[from].includes(to)) {
      const [from_column, from_row] = from.split("");
      const [to_column, to_row] = to.split("");
      const from_column_index = mapLetterToColumnIndex(from_column);
      const from_row_index = Number(from_row) - 1;
      const to_column_index = mapLetterToColumnIndex(to_column);
      const to_row_index = Number(to_row) - 1;
      this.gameState[to_row_index][to_column_index] =
        this.gameState[from_row_index][from_column_index];
      delete this.gameState[from_row_index][from_column_index];
      this.possibleMoves = this.getAllPossibleMoves();
      return true;
    }
    return false;
  }
}

export default Game;
