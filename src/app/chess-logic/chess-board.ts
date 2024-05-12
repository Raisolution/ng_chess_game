import { DomSanitizer } from "@angular/platform-browser";
import { Color, Bishop, King, Knight, Pawn, Queen, Rook, Piece, FENChar, SafeSquares, Coords, pieceImagePaths } from "./models";

export class ChessBoard {
    private chessBoard:(Piece|null)[][];
    private readonly chessBoardSize: number = 8;
    private _playerColor = Color.White;
    private _safeSquares: SafeSquares;

    constructor() {
        this.chessBoard = [
            [
                new Rook(Color.White), new Knight(Color.White), new Bishop(Color.White), new Queen(Color.White),
                new King(Color.White), new Bishop(Color.White), new Knight(Color.White), new Rook(Color.White)
            ],
            [
                new Pawn(Color.White), new Pawn(Color.White), new Pawn(Color.White), new Pawn(Color.White),
                new Pawn(Color.White), new Pawn(Color.White), new Pawn(Color.White), new Pawn(Color.White)
            ],
            [ null, null, null, null, null, null, null, null ],
            [ null, null, null, null, null, null, null, null ],
            [ null, null, null, null, null, null, null, null ],
            [ null, null, null, null, null, null, null, null ],
            [
                new Pawn(Color.Black), new Pawn(Color.Black), new Pawn(Color.Black), new Pawn(Color.Black),
                new Pawn(Color.Black), new Pawn(Color.Black), new Pawn(Color.Black), new Pawn(Color.Black)
            ],
            [
                new Rook(Color.Black), new Knight(Color.Black), new Bishop(Color.Black), new Queen(Color.Black),
                new King(Color.Black), new Bishop(Color.Black), new Knight(Color.Black), new Rook(Color.Black)
            ]
        ];

        this._safeSquares = this.findSafeSquares();
    }

    public get safeSquares(): SafeSquares {
        return this._safeSquares;
    }

    public get playerColor(): Color {
        return this._playerColor;
    }

    public get chessBoardView(): (FENChar|null)[][] {
        return this.chessBoard.map(row => {
            return row.map(piece => piece instanceof Piece ? piece.fenChar : null);
        });
    }

    public static isSquareDark(x: number, y: number): boolean {
        return (x % 2 == 0 && y % 2 == 0) || (x % 2 == 1 && y % 2 == 1); 
    }

    private areCoordsValid(x: number, y: number): boolean {
        return x >= 0 && y >= 0 && x < this.chessBoardSize && y < this.chessBoardSize;
    }

    public isInCheck(playerColor: Color): boolean {
        for (let x = 0; x < this.chessBoardSize; x++) {
            for (let y = 0; y < this.chessBoardSize; y++) {
                const piece: Piece|null = this.chessBoard[x][y];

                if (!piece || piece.color === playerColor) continue;

                for (const {x: dx, y: dy} of piece.directions) {
                    let newX: number = x + dx;
                    let newY: number = y + dy;

                    if (!this.areCoordsValid(newX, newY)) continue;

                    if (piece instanceof Pawn || piece instanceof Knight || piece instanceof King) {
                        if (piece instanceof Pawn && dy === 0) continue;
                        
                        const attackedPiece: Piece|null = this.chessBoard[newX][newY];

                        if (attackedPiece instanceof King && attackedPiece.color === playerColor) {
                            return false;
                        }
                    } else {
                        //Bishop, Queen, Rook
                        while (this.areCoordsValid(newX, newY)) {
                            const attackedPiece: Piece|null = this.chessBoard[newX][newY];

                            if (attackedPiece instanceof King && attackedPiece.color === playerColor) {
                                return false;
                            }

                            if (attackedPiece !== null) break;

                            newX += dx;
                            newY += dy;
                        }
                    }
                }
            }
        }
        return false;
    }

    public isPositionSafeAfterMove(piece: Piece, prevX: number, prevY: number, newX: number, newY: number): boolean {
        const newPiece: Piece|null = this.chessBoard[newX][newY];

        if (newPiece && newPiece.color === piece.color) {
            return false;
        }

        this.chessBoard[prevX][prevY] = null;
        this.chessBoard[newX][newY] = piece;

        const isPositionSafe: boolean = !this.isInCheck(piece.color);

        this.chessBoard[prevX][prevY] = piece;
        this.chessBoard[newX][newY] = newPiece;

        return isPositionSafe;
    }

    private findSafeSquares(): SafeSquares {
        const safeSquares: SafeSquares = new Map<string, Coords[]>();

        for (let x = 0; x < this.chessBoardSize; x++) {
            for (let y = 0; y < this.chessBoardSize; y++) {
                const piece: Piece | null = this.chessBoard[x][y];

                if (!piece || piece.color !== this.playerColor) continue;

                const pieceSafeSquares: Coords[] = [];

                for (const { x: dx, y: dy } of piece.directions) {
                    let newX: number = x + dx;
                    let newY: number = y + dy;

                    if (!this.areCoordsValid(newX, newY)) continue;

                    let newPiece: Piece|null = this.chessBoard[newX][newY];
                    if (newPiece && newPiece.color === piece.color) continue;

                    if (piece instanceof Pawn) {
                        if (dx === 2 || dx === -2) {
                            if (newPiece) continue;
                            if (this.chessBoard[newX + (dx === 2 ? -1 : 1)][newY]) continue;
                        }

                        if ((dx === 1 || dx === -1) && dy === 0 && newPiece) continue;

                        if ((dy === 1 || dy === -1) && (!newPiece || piece.color === newPiece.color)) continue;
                    }

                    if (piece instanceof Pawn || piece instanceof Knight || piece instanceof King) {
                        if (this.isPositionSafeAfterMove(piece, x, y, newX, newY)) {
                            pieceSafeSquares.push({
                                x: newX,
                                y: newY
                            });
                        } else {
                            while (this.areCoordsValid) {
                                newPiece = this.chessBoard[newX][newY];

                                if (newPiece && newPiece.color === piece.color) break;

                                if (this.isPositionSafeAfterMove(piece, x, y, newX, newY)) {
                                    pieceSafeSquares.push({ x: newX, y: newY });
                                }

                                if (newPiece !== null) break;

                                newX += dx;
                                newY += dy;
                            }
                        }
                    }
                }

                if (pieceSafeSquares.length) {
                    safeSquares.set(x + "," + y, pieceSafeSquares);
                }
            }
        }

        return safeSquares;
    }
}