import { ChessPieces, Colors } from "./types/common";
import { GameState, GameStateField, GameStateRow } from "./types/game";

export function mapColumnIndexToLetter(column: number) {
  return String.fromCharCode(column + 97);
}

export function mapLetterToColumnIndex(letter: string) {
  return letter.charCodeAt(0) - 97;
}

export function indexesToField(row: number, column: number) {
  return `${mapColumnIndexToLetter(column)}${row + 1}`;
}

export function fieldToIndexes(field: string) {
  const column = mapLetterToColumnIndex(field[0]);
  const row = Number(field[1]) - 1;
  return [column, row];
}

export function cloneGameState(gameState: GameState) {
  const newGameState = [] as GameState;
  gameState.forEach(row => {
    const newRow: GameStateRow = [];
    row.forEach(element => {
      if (!element) {
        newRow.push(null);
      } else {
        newRow.push({ ...element });
      }
    });
    newGameState.push(newRow);
  });
  return newGameState;
}

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

export const fieldToFenSymbol = (field: GameStateField) => {
  return Object.keys(fenSymbolsToPiecesMapping).find(
    key =>
      fenSymbolsToPiecesMapping[key].piece === field.piece &&
      fenSymbolsToPiecesMapping[key].color === field.color,
  );
};
