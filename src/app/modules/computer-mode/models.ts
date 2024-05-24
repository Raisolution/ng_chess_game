import { Color, FENChar } from "../../chess-logic/models";

export type StockFishQueryParams = {
    fen: string;
    depth: number;
}

export type ChessMove = {
    prevX: number;
    prevY: number;
    newX: number;
    newY: number;
    promotedPiece: FENChar|null;
}

export type StockFishResponse = {
    success: boolean;
    evaluation: number | null;
    mate: number | null;
    bestmove: string;
    continuation: string;
}

export type ComputerConfiguration = {
    color: Color;
    level: number;
}

export const stockFishLevels: Readonly<Record<number, number>> = {
    1: 1,
    2: 4,
    3: 7,
    4: 10,
    5: 13
}
