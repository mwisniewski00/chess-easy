# chess-easy

## Description

This is a Typescript library for validating chess moves, generating possible moves, detection of check, checkmate and draw (Insufficient Material or Stalemate) and keeping state of the game using [FEN notation](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation).

## Installation

```
npm i chess-easy
```

## How to use

You can initialize game without any arguments, and that object will be initialized with starting game fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1".
You can also pass different fen string and if it will be valid, game will be initialized with given Fen state.

```
import { Game } from "chess-easy

const chessGame = new Game();
const gameFromFen = new Game(`rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2`);
```

## Game object methods

- `getGameStateObject(): GameStateObject`: Getting current state of game as object ex. `{'e4': {piece: ChessPieces.KNHIGHT, color: COLORS.WHITE}, ...}`
- `isPromotionMove(from: string, to: string): boolean`: Getting information if given move will cause promoting a pawn, useful for fronted, when you want to show some modal with choice of the promortion piece
- `isDraw(): {isDraw: boolean, reason?: string}`: Getting information if current game state is draw. Reason field exists if `isDraw` is `true` and can be one of 2 values: `'Stalemate'`, or `'Insufficient Material'`
- `move(from: string, to: string, promotion: PromotionPossibility = PromotionPossibility.QUEEN): boolean` - This method validates if given move is correct and makes the move if it is valid. `promotion` argument is used only if move ends with promotion of a pawn and can have one of four values:
  - `PromotionPossibility.ROOK`
  - `PromotionPossibility.BISHOP`
  - `PromotionPossibility.KNIGHT`
  - `PromotionPossibility.QUEEN`
- `generateFen(): string`: Returns Fen string from current game state
- `getNextColor(): "black" | "white"`: Returns string with next moving color.

## Game object fields

```
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
```

## Types

- ```
  enum ChessPieces {
    PAWN,
    BISHOP,
    KNIGHT,
    ROOK,
    QUEEN,
    KING,
  }
  ```

- ```
  enum Colors {
      WHITE,
      BLACK,
    }
  ```

- ```
  interface GameStateField {
    color: Colors;
    piece: ChessPieces;
  }
  ```

- ```
  type GameStateRow = (GameStateField | null)[];
  ```

- ```
  type GameState = GameStateRow[];
  ```

- ```
  type GameStateObject = {
    [key: string]: GameStateField;
  };
  ```

- ```
  type PossibleMoves = {
    [key: string]: string[];
  };
  ```

  ## Example

  If you want to see an example how this package can be used, you can see this chess service, than uses this package on both: frontend, and backend: https://github.com/mwisniewski00/Chess
