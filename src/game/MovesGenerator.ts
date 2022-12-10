import { GameState, GameStateField } from "../types/game";
import { ChessPieces, Colors } from "../types/common";
import {
  mapColumnIndexToLetter,
  indexesToField,
  mapLetterToColumnIndex,
  fieldToIndexes,
} from "../utils";
import { MoveMaker } from "./MoveMaker";

export class MovesGenerator {
  private gameState: GameState;
  private startingPawnIndexes = { [Colors.BLACK]: 6, [Colors.WHITE]: 1 };
  private enPassantPossibility: string;
  private castlingAvailability: string;
  private movesNext = Colors.WHITE;
  private kingField = "";

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  private getEnemyColor(color: Colors) {
    return color === Colors.WHITE ? Colors.BLACK : Colors.WHITE;
  }

  private getPossiblePawnMoves(
    row: number,
    column: number,
    color: Colors,
  ): string[] {
    const colorMultiplier = color === Colors.BLACK ? -1 : 1;
    const possibleMoves: string[] = [];
    const enemyColor = this.getEnemyColor(color);
    const nextRow = row + colorMultiplier * 1;
    if (nextRow > 7 || nextRow < 0) {
      return [];
    }
    if (!this.gameState[nextRow][column]) {
      possibleMoves.push(indexesToField(nextRow, column));
    }
    const rowPlusTwo = row + colorMultiplier * 2;
    if (
      row === this.startingPawnIndexes[color] &&
      !this.gameState[nextRow][column] &&
      !this.gameState[rowPlusTwo][column]
    ) {
      possibleMoves.push(indexesToField(rowPlusTwo, column));
    }
    if (
      column < 7 &&
      this.gameState[nextRow][column + 1]?.color === enemyColor
    ) {
      possibleMoves.push(indexesToField(nextRow, column + 1));
    }
    if (
      column > 0 &&
      this.gameState[nextRow][column - 1]?.color === enemyColor
    ) {
      possibleMoves.push(indexesToField(nextRow, column - 1));
    }
    if (this.enPassantPossibility !== "-") {
      const [enPassantColumn] = this.enPassantPossibility.split("");
      const enPassantColumnIndex = mapLetterToColumnIndex(enPassantColumn);
      const isPieceColumnNextToEnPassant =
        Math.abs(enPassantColumnIndex - column) === 1;
      const isPieceRowNextToEnPassant =
        color === Colors.WHITE ? row === 4 : row === 3;
      if (isPieceColumnNextToEnPassant && isPieceRowNextToEnPassant) {
        possibleMoves.push(this.enPassantPossibility);
      }
    }
    return possibleMoves;
  }

  private getPossibleFigureMoves(
    row: number,
    column: number,
    color: number,
    patterns: any,
    oneMove: boolean = false,
  ) {
    const possibleMoves: string[] = [];
    const enemyColor = this.getEnemyColor(color);

    for (let n in patterns) {
      let nextRow: number = row + patterns[n][0];
      let nextColumn: number = column + patterns[n][1];
      while (true) {
        if (
          nextRow >= 0 &&
          nextRow <= 7 &&
          nextColumn >= 0 &&
          nextColumn <= 7
        ) {
          if (this.gameState[nextRow][nextColumn]?.color === enemyColor) {
            possibleMoves.push(indexesToField(nextRow, nextColumn));
            break;
          } else if (this.gameState[nextRow][nextColumn]?.color === color) {
            break;
          } else {
            possibleMoves.push(indexesToField(nextRow, nextColumn));
          }
        } else {
          break;
        }
        nextRow += patterns[n][0];
        nextColumn += patterns[n][1];
        if (oneMove) {
          break;
        }
      }
    }

    return possibleMoves;
  }

  private getPossibleMoves(
    row: number,
    column: number,
    field: GameStateField | null,
  ) {
    if (!field) return [];

    switch (field.piece) {
      case ChessPieces.PAWN: {
        return this.getPossiblePawnMoves(row, column, field.color);
      }
      case ChessPieces.KING: {
        if (field.color === this.movesNext) {
          this.kingField = indexesToField(row, column);
        }
        return this.getPossibleFigureMoves(
          row,
          column,
          field.color,
          [
            [0, 1],
            [1, 0],
            [1, 1],
            [-1, -1],
            [0, -1],
            [-1, 0],
            [-1, 1],
            [1, -1],
          ],
          true,
        );
      }
      case ChessPieces.QUEEN: {
        return this.getPossibleFigureMoves(row, column, field.color, [
          [1, 1],
          [1, -1],
          [-1, 1],
          [-1, -1],
          [0, 1],
          [1, 0],
          [-1, 0],
          [0, -1],
        ]);
      }
      case ChessPieces.BISHOP: {
        return this.getPossibleFigureMoves(row, column, field.color, [
          [1, 1],
          [1, -1],
          [-1, 1],
          [-1, -1],
        ]);
      }
      case ChessPieces.ROOK: {
        return this.getPossibleFigureMoves(row, column, field.color, [
          [0, 1],
          [1, 0],
          [-1, 0],
          [0, -1],
        ]);
      }
      case ChessPieces.KNIGHT: {
        return this.getPossibleFigureMoves(
          row,
          column,
          field.color,
          [
            [2, 1],
            [2, -1],
            [-2, 1],
            [-2, -1],
            [1, 2],
            [-1, 2],
            [1, -2],
            [-1, -2],
          ],
          true,
        );
      }
      default: {
        return [];
      }
    }
  }

  private areFieldsBetweenPiecesInRowEmptyAndNotAttacked(
    row: number,
    column1: number,
    column2: number,
    enemyMoves: {},
  ) {
    const fieldsToCheck = this.gameState[row].slice(column1, column2);
    return fieldsToCheck.every(
      (field, index) =>
        !field &&
        !this.isFieldAttacked(indexesToField(row, index + column1), enemyMoves),
    );
  }

  private addCastlingMoves(
    allPossibleMoves: object,
    movesNext: Colors,
    possibleEnemyMoves: {},
  ) {
    const movesToUpdate = { ...allPossibleMoves };
    if (this.castlingAvailability.length) {
      const rowToCheck = movesNext === Colors.WHITE ? 0 : 7;
      const isQueenSidePossible =
        this.castlingAvailability.includes(
          movesNext === Colors.WHITE ? "Q" : "q",
        ) &&
        this.areFieldsBetweenPiecesInRowEmptyAndNotAttacked(
          rowToCheck,
          1,
          4,
          possibleEnemyMoves,
        );
      const isKingSidePossible =
        this.castlingAvailability.includes(
          movesNext === Colors.WHITE ? "K" : "k",
        ) &&
        this.areFieldsBetweenPiecesInRowEmptyAndNotAttacked(
          rowToCheck,
          5,
          7,
          possibleEnemyMoves,
        );

      const rookColumns = [
        ...(isQueenSidePossible ? ["a"] : []),
        ...(isKingSidePossible ? ["h"] : []),
      ];
      const kingField = `e${rowToCheck + 1}`;
      rookColumns.forEach(column => {
        const rookField = `${column}${rowToCheck + 1}`;
        movesToUpdate[rookField] = [
          ...((movesToUpdate[rookField] || []) as string[]),
          kingField,
        ];
        movesToUpdate[kingField] = [
          ...((movesToUpdate[kingField] || []) as string[]),
          rookField,
        ];
      });
    }
    return movesToUpdate;
  }

  private getAllPossibleBasicMoves(moves: Colors) {
    const allPossibleMoves = {};
    this.gameState.forEach((row, row_index) => {
      row.forEach((field, column_index) => {
        const piecePosition = `${mapColumnIndexToLetter(column_index)}${
          row_index + 1
        }`;
        if (field?.color !== moves) {
          allPossibleMoves[piecePosition] = [];
          return;
        }
        allPossibleMoves[piecePosition] = this.getPossibleMoves(
          row_index,
          column_index,
          field,
        );
      });
    });
    return allPossibleMoves;
  }

  private isFieldAttacked(field: string, enemyMoves: object) {
    return Object.values(enemyMoves).some(moves =>
      (moves as string[]).includes(field),
    );
  }

  private filterIllegalInCheckMoves(allMoves: {}) {
    const allFields = Object.keys(allMoves);
    const moveMaker = new MoveMaker(
      this.gameState,
      this.enPassantPossibility,
      this.movesNext,
      this.castlingAvailability,
    );
    allFields.forEach(field => {
      const moves = allMoves[field];
      const [column_from, row_from] = fieldToIndexes(field);
      const newMoves = moves.filter(move => {
        const newKingField =
          this.gameState[row_from][column_from]?.piece === ChessPieces.KING
            ? move
            : this.kingField;
        const { gameState } = moveMaker.move(field, move);
        const initialGameState = this.gameState;
        this.gameState = gameState;
        const currentEnemyMoves = this.getAllPossibleBasicMoves(
          this.getEnemyColor(this.movesNext),
        );
        this.gameState = initialGameState;
        return !this.isFieldAttacked(newKingField, currentEnemyMoves);
      });
      allMoves[field] = newMoves;
    });
    return allMoves;
  }

  private isInsufficientMaterial() {
    const flattenGameState = this.gameState.flat();
    const starterGameSituation = {
      black: {
        bishops: 0,
        knights: 0,
        otherPieces: 0,
      },
      white: {
        bishops: 0,
        knights: 0,
        otherPieces: 0,
      },
    };
    const gameSituation = flattenGameState.reduce((acc, curr) => {
      if (curr) {
        const { color, piece } = curr;
        if (piece === ChessPieces.KING) {
          return acc;
        }
        const colorToUpdate = color === Colors.BLACK ? "black" : "white";
        if (piece === ChessPieces.KNIGHT) {
          return {
            ...acc,
            [colorToUpdate]: {
              ...acc[colorToUpdate],
              knights: acc[colorToUpdate].knights + 1,
            },
          };
        } else if (piece === ChessPieces.BISHOP) {
          return {
            ...acc,
            [colorToUpdate]: {
              ...acc[colorToUpdate],
              bishops: acc[colorToUpdate].bishops + 1,
            },
          };
        } else {
          return {
            ...acc,
            [colorToUpdate]: {
              ...acc[colorToUpdate],
              otherPieces: acc[colorToUpdate].otherPieces + 1,
            },
          };
        }
      }
      return acc;
    }, starterGameSituation);
    const areOtherPiecesPresent =
      gameSituation.black.otherPieces > 0 ||
      gameSituation.white.otherPieces > 0;
    if (areOtherPiecesPresent) {
      return false;
    }
    const blackMinorPieces =
      gameSituation.black.bishops + gameSituation.black.knights;
    const whiteMinorPieces =
      gameSituation.white.bishops + gameSituation.white.knights;
    if (blackMinorPieces <= 1 && whiteMinorPieces <= 1) {
      return true;
    }
    return (
      (gameSituation.white.knights === 2 && blackMinorPieces === 0) ||
      (gameSituation.black.knights === 2 && whiteMinorPieces === 0)
    );
  }

  public getAllPossibleMoves(
    movesNext: Colors,
    castlingAvailability: string,
    enPassantPossibility: string,
  ) {
    this.enPassantPossibility = enPassantPossibility;
    this.castlingAvailability = castlingAvailability;
    this.movesNext = movesNext;
    const basicMoves = this.getAllPossibleBasicMoves(movesNext);
    const enemyBasicMoves = this.getAllPossibleBasicMoves(
      this.getEnemyColor(movesNext),
    );
    const movesWithCastling = this.addCastlingMoves(
      basicMoves,
      movesNext,
      enemyBasicMoves,
    );
    const isCheck = this.isFieldAttacked(this.kingField, enemyBasicMoves);
    const allMoves = this.filterIllegalInCheckMoves(movesWithCastling);
    const canPlayerMove = Object.values(allMoves).some(
      moves => (moves as string[]).length,
    );
    const isCheckmate = isCheck && !canPlayerMove;
    const isStalemate = !isCheck && !canPlayerMove;
    const isInsufficientMaterial = this.isInsufficientMaterial();
    return {
      allMoves: this.filterIllegalInCheckMoves(movesWithCastling),
      isCheck,
      isCheckmate,
      isStalemate,
      isInsufficientMaterial,
    };
  }
}
