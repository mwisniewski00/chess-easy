import { ChessPieces, Colors } from "./common";

export interface GameStateField {
  color: Colors;
  piece: ChessPieces;
}

export type GameStateRow = (GameStateField | null)[];

export type GameState = GameStateRow[];

export type GameStateObject = {
  [key: string]: GameStateField;
};

export type PossibleMoves = {
  [key: string]: string[];
};
