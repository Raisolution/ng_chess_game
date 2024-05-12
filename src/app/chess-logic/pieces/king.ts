import { FENChar, Coords, Color } from "../models";
import { Piece } from "./piece";

export class King extends Piece {
    private _hasMoved: boolean = false;
    protected override _fenChar: FENChar;
    protected override _directions: Coords[] = [
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
        { x: -1, y: 1 },
        { x: -1, y: 0 },
        { x: -1, y: -1 },
        { x: 0, y: -1 },
        { x: 1, y: -1 }
    ];

    constructor(private pieceColor: Color) {
        super(pieceColor);
        this._fenChar = pieceColor === Color.White ? FENChar.WhiteKing : FENChar.BlackKing;
    }

    public get hasMoved(): boolean {
        return this._hasMoved;
    }

    public set hasMoved(_) {
        this._hasMoved = true;
    }
}