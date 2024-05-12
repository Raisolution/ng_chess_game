import { FENChar, Coords, Color } from "../models";
import { Piece } from "./piece";

export class Knight extends Piece {
    protected override _fenChar: FENChar;
    protected override _directions: Coords[] = [
        { x: 1, y: 2 },
        { x: -1, y: 2 },
        { x: -2, y: 1 },
        { x: -2, y: -1 },
        { x: -1, y: -2 },
        { x: 1, y: -2 },
        { x: 2, y: -1 },
        { x: 2, y: 1 }
    ];

    constructor(private pieceColor: Color) {
        super(pieceColor);
        this._fenChar = pieceColor === Color.White ? FENChar.WhiteKnight : FENChar.BlackKnight;
    }
}