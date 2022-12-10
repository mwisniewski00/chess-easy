import { mapLetterToColumnIndex } from "../utils";

interface PositionIndexes {
  column: number;
  row: number;
  field: string;
}

export class MoveIndexes {
  from: PositionIndexes;
  to: PositionIndexes;
  constructor(from: string, to: string) {
    const [from_column, from_row] = from.split("");
    const [to_column, to_row] = to.split("");
    const from_column_index = mapLetterToColumnIndex(from_column);
    const from_row_index = Number(from_row) - 1;
    const to_column_index = mapLetterToColumnIndex(to_column);
    const to_row_index = Number(to_row) - 1;
    this.from = { column: from_column_index, row: from_row_index, field: from };
    this.to = { column: to_column_index, row: to_row_index, field: to };
  }
}
