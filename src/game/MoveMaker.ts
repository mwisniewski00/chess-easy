import { ChessPieces, Colors } from "../types/common";
import { GameState } from "../types/game";
import { MoveIndexes } from "./MoveIndexes";
import {
  cloneGameState,
  fenSymbolsToPiecesMapping,
  indexesToField,
} from "../utils";

export class MoveMaker {
  gameState: GameState;
  enPassantPossibility: string;
  movesNext: Colors;
  castlingAvailability: string;

  constructor(
    gameState: GameState,
    enPassantPossibility: string,
    movesNext: Colors,
    castlingAvailability: string,
  ) {
    this.gameState = cloneGameState(gameState);
    this.enPassantPossibility = enPassantPossibility.slice();
    this.movesNext = movesNext;
    this.castlingAvailability = castlingAvailability.slice();
  }

  private handleEnPassantCapture(moveIndexes: MoveIndexes) {
    const movingPiece =
      this.gameState[moveIndexes.from.row][moveIndexes.from.column];
    if (
      movingPiece?.piece === ChessPieces.PAWN &&
      moveIndexes.to.field === this.enPassantPossibility
    ) {
      const colorMultiplier = this.movesNext === Colors.BLACK ? 1 : -1;
      this.gameState[moveIndexes.to.row + 1 * colorMultiplier][
        moveIndexes.to.column
      ] = null;
    }
  }

  private handleCastling(moveIndexes: MoveIndexes) {
    const movingPiece =
      this.gameState[moveIndexes.from.row][moveIndexes.from.column];
    const fieldToLand =
      this.gameState[moveIndexes.to.row][moveIndexes.to.column];
    const castlingRowIndex = this.movesNext === Colors.WHITE ? 0 : 7;
    let newKingIndex: number | null = null;
    let newRookIndex: number | null = null;
    let oldRookIndex: number | null = null;
    if (fieldToLand?.color === movingPiece?.color) {
      if (moveIndexes.from.column === 0 || moveIndexes.to.column === 0) {
        newKingIndex = 2;
        newRookIndex = 3;
        oldRookIndex = 0;
      }
      if (moveIndexes.from.column === 7 || moveIndexes.to.column === 7) {
        newKingIndex = 6;
        newRookIndex = 5;
        oldRookIndex = 7;
      }
      if (newKingIndex && newRookIndex && oldRookIndex !== null) {
        this.gameState[castlingRowIndex][newKingIndex] =
          this.gameState[castlingRowIndex][4];
        this.gameState[castlingRowIndex][4] = null;
        this.gameState[castlingRowIndex][newRookIndex] =
          this.gameState[castlingRowIndex][oldRookIndex];
        this.gameState[castlingRowIndex][oldRookIndex] = null;
      }
      movingPiece?.color && this.removeCastlingFromColor(movingPiece?.color);
      return true;
    } else {
      this.revalidateCastlingAvailability(moveIndexes);
      return false;
    }
  }

  public static isPromotionMove(
    gameState: GameState,
    moveIndexes: MoveIndexes,
    movesNext: Colors,
  ) {
    const movingPiece =
      gameState[moveIndexes.from.row][moveIndexes.from.column];
    const promotionRow = movesNext === Colors.BLACK ? 0 : 7;
    return (
      movingPiece?.piece === ChessPieces.PAWN &&
      moveIndexes.to.row === promotionRow
    );
  }

  private getNewPiece(moveIndexes: MoveIndexes, promotion: string) {
    if (
      MoveMaker.isPromotionMove(this.gameState, moveIndexes, this.movesNext)
    ) {
      return fenSymbolsToPiecesMapping[
        this.movesNext === Colors.BLACK
          ? promotion
          : promotion.toLocaleUpperCase()
      ];
    }
    return this.gameState[moveIndexes.from.row][moveIndexes.from.column];
  }

  private removeCastlingFromColor(color: Colors) {
    const castleRegexToRemove = color === Colors.BLACK ? /[^A-Z]/g : /[^a-z]/g;
    this.castlingAvailability = this.castlingAvailability.replace(
      castleRegexToRemove,
      "",
    );
  }

  private revalidateCastlingAvailability(moveIndexes: MoveIndexes) {
    const piece_moving =
      this.gameState[moveIndexes.from.row][moveIndexes.from.column];
    if (piece_moving?.piece === ChessPieces.KING) {
      this.removeCastlingFromColor(piece_moving.color);
    }
    this.removeCastilngIfRookStateChange(
      moveIndexes.from.column,
      moveIndexes.from.row,
    );
    this.removeCastilngIfRookStateChange(
      moveIndexes.to.column,
      moveIndexes.to.row,
    );
  }

  private removeCastilngIfRookStateChange(
    column_index: number,
    row_index: number,
  ) {
    const piece = this.gameState[row_index][column_index];
    if (
      [0, 7].includes(column_index) &&
      [0, 7].includes(row_index) &&
      piece?.piece === ChessPieces.ROOK
    ) {
      const castleSideToRemove = column_index === 0 ? "q" : "k";
      const castleToRemove =
        piece.color === Colors.WHITE
          ? castleSideToRemove.toLocaleUpperCase()
          : castleSideToRemove;
      this.castlingAvailability = this.castlingAvailability.replace(
        castleToRemove,
        "",
      );
    }
  }

  private handleEnPassantPossibility(moveIndexes: MoveIndexes) {
    const movingPiece =
      this.gameState[moveIndexes.from.row][moveIndexes.from.column];
    const rowDifference = Math.abs(moveIndexes.from.row - moveIndexes.to.row);
    if (movingPiece?.piece === ChessPieces.PAWN && rowDifference === 2) {
      const colorMultiplier = this.movesNext === Colors.BLACK ? 1 : -1;
      const enPassantField = indexesToField(
        moveIndexes.to.row + 1 * colorMultiplier,
        moveIndexes.to.column,
      );
      this.enPassantPossibility = enPassantField;
    } else {
      this.enPassantPossibility = "-";
    }
  }

  public move(from: string, to: string, promotion: string = "q") {
    const moveIndexes = new MoveIndexes(from, to);
    const initialValues = {
      enPassantPossibility: this.enPassantPossibility,
      castlingAvailability: this.castlingAvailability,
      gameState: cloneGameState(this.gameState),
    };
    this.handleEnPassantCapture(moveIndexes);
    this.handleEnPassantPossibility(moveIndexes);
    if (!this.handleCastling(moveIndexes)) {
      const newPiece = this.getNewPiece(moveIndexes, promotion);
      this.gameState[moveIndexes.to.row][moveIndexes.to.column] = newPiece;
      this.gameState[moveIndexes.from.row][moveIndexes.from.column] = null;
    }
    const newValues = {
      gameState: this.gameState,
      enPassantPossibility: this.enPassantPossibility,
      castlingAvailability: this.castlingAvailability,
    };
    this.castlingAvailability = initialValues.castlingAvailability;
    this.gameState = initialValues.gameState;
    this.enPassantPossibility = initialValues.enPassantPossibility;
    return newValues;
  }
}
