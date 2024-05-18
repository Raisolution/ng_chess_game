import { Piece } from './models';

export enum Color {
    White,
    Black
}

export type Coords = {
    x: number;
    y: number;
}

export enum FENChar {
    WhitePawn = "P",
    WhiteKnight = "N",
    WhiteBishop = "B",
    WhiteRook = "R",
    WhiteQueen = "Q",
    WhiteKing = "K",
    BlackPawn = "p",
    BlackKnight = "n",
    BlackBishop = "b",
    BlackRook = "r",
    BlackQueen = "q",
    BlackKing = "k"
}

export type SafeSquares = Map<string, Coords[]>;

export const pieceImagePaths: Readonly<Record<FENChar, string>> = {
    [FENChar.WhitePawn]: 'assets/pieces/white pawn.svg',
    [FENChar.WhiteKnight]: 'assets/pieces/white knight.svg',
    [FENChar.WhiteBishop]: 'assets/pieces/white bishop.svg',
    [FENChar.WhiteRook]: 'assets/pieces/white rook.svg',
    [FENChar.WhiteQueen]: 'assets/pieces/white queen.svg',
    [FENChar.WhiteKing]: 'assets/pieces/white king.svg',
    [FENChar.BlackPawn]: 'assets/pieces/black pawn.svg',
    [FENChar.BlackKnight]: 'assets/pieces/black knight.svg',
    [FENChar.BlackBishop]: 'assets/pieces/black bishop.svg',
    [FENChar.BlackRook]: 'assets/pieces/black rook.svg',
    [FENChar.BlackQueen]: 'assets/pieces/black queen.svg',
    [FENChar.BlackKing]: 'assets/pieces/black king.svg'
};

export type LastMove = {
    prevX: number;
    prevY: number;
    currX: number;
    currY: number;
    piece: Piece;
};

export type CheckState = {
    isInCheck: boolean;
    x?: number;
    y?: number;
}

export { Bishop } from './pieces/bishop';
export { King } from './pieces/king';
export { Knight } from './pieces/knight';
export { Pawn } from './pieces/pawn';
export { Queen } from './pieces/queen';
export { Rook } from './pieces/rook';
export { Piece } from './pieces/piece';