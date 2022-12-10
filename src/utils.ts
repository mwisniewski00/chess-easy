import { GameState, GameStateRow } from "./types/game";

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
