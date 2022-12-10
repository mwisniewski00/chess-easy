import { Colors } from "../types/common";
import { GameState } from "../types/game";
import { fieldToFenSymbol } from "../utils";

class FenGenerator {
  private static generateGameStateString(gameState: GameState) {
    const rows = [...gameState].reverse().map(row => {
      let rowResult = "";
      row.forEach(field => {
        if (!field) {
          if (rowResult.length) {
            const lastLetterIndex = rowResult.length - 1;
            const emptyFieldsNumber = Number(rowResult[lastLetterIndex]);
            if (isNaN(emptyFieldsNumber)) {
              rowResult += "1";
            } else {
              rowResult =
                rowResult.substring(0, lastLetterIndex) +
                String(emptyFieldsNumber + 1);
            }
          } else {
            rowResult += "1";
          }
        } else {
          const fenSymbol = fieldToFenSymbol(field);
          rowResult += fenSymbol;
        }
      });
      return rowResult;
    });
    return rows.join("/");
  }

  private static generateMovesNextString(movesNext: Colors) {
    return movesNext === Colors.WHITE ? "w" : "b";
  }

  public static generateFen(
    gameState: GameState,
    movesNext: Colors,
    castlingAvailability: string,
    enPassantPossibility: string,
    halfMoveClock: number,
    fullMoveNumber: number,
  ) {
    return [
      this.generateGameStateString(gameState),
      this.generateMovesNextString(movesNext),
      castlingAvailability,
      enPassantPossibility,
      String(halfMoveClock),
      String(fullMoveNumber),
    ].join(" ");
  }
}

export default FenGenerator;
