import { Color, Coords, FENChar } from "../models";

export abstract class Piece {
    protected abstract _fenChar: FENChar;
    protected abstract _directions: Coords[];

    constructor(private _color : Color) {}
    
    public get fenChar(): FENChar {
        return this._fenChar;
    }

    public get directions(): Coords[] {
        return this._directions;
    }

    public get color(): Color {
        return this._color;
    }
}