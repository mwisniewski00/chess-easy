export function mapColumnIndexToLetter(column: number) {
  return String.fromCharCode(column + 97);
}

export function mapLetterToColumnIndex(letter: string) {
  return letter.charCodeAt(0) - 97;
}
