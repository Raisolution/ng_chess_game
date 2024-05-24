import { Color, King, LastMove, Pawn, Piece, Rook, columns } from "./models";

export class FENConverter {
    public static readonly initalPosition: string = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    public convertBoardToFEN(
        board: (Piece|null)[][],
        playerColor: Color,
        lastMove: LastMove|undefined,
        fiftyMoveRuleCounter: number,
        numberOfFullMoves: number
    ): string {
        let fen: string = "";

        for (let i = 7; i >= 0; i--) {
            let fenRow: string = "";
            let consecutiveEmptySquaresCounter = 0;

            for (const piece of board[i]) {
                if (!piece) {
                    consecutiveEmptySquaresCounter += 1;
                    continue;
                }

                if (consecutiveEmptySquaresCounter !== 0) {
                    fenRow += consecutiveEmptySquaresCounter;
                }

                consecutiveEmptySquaresCounter = 0;
                fenRow += piece.fenChar;
            }

            if (consecutiveEmptySquaresCounter !== 0) {
                fenRow += consecutiveEmptySquaresCounter;
            }
            
            fen += (i === 0) ? fenRow : fenRow + "/";
        }

        const player: string = playerColor === Color.White ? "w" : "b";
        
        fen += " " + player;
        fen += " " + this.castlingAvailability(board);
        fen += " " + this.enPassantPosibility(lastMove, playerColor);
        fen += " " + fiftyMoveRuleCounter * 2;
        fen += " " + numberOfFullMoves;

        return fen;
    }

    private castlingAvailability(board: (Piece|null)[][]): string {
        const castlingPosibilities = (color: Color): string => {
            let castlingAvailability: string = "";

            const kingPositionX: number = color === Color.White ? 0 : 7;
            const king: Piece|null = board[kingPositionX][4];

            if (king instanceof King && !king.hasMoved) {
                const rookPositionX: number = kingPositionX;
                const kingSideRook = board[rookPositionX][7];
                const queenSideRook = board[rookPositionX][0];

                if (kingSideRook instanceof Rook && !kingSideRook.hasMoved) {
                    castlingAvailability += "k";
                }

                if (queenSideRook instanceof Rook && !queenSideRook.hasMoved) {
                    castlingAvailability += "q";
                }

                if (color === Color.White) {
                    castlingAvailability = castlingAvailability.toUpperCase();
                }
            }

            return castlingAvailability;
        }

        const castlingAvailability: string = castlingPosibilities(Color.White) + castlingPosibilities(Color.Black);
        return castlingAvailability !== "" ? castlingAvailability : "-";
    }

    private enPassantPosibility(lastMove:LastMove|undefined, color: Color): string {
        if (!lastMove) { return "-"; }

        const { piece, currX: newX, prevX, prevY } = lastMove;

        if (piece instanceof Pawn && Math.abs(newX - prevX) === 2) {
            const row: number = color === Color.White ? 6 : 3;
            return columns[prevY] + row;
        }

        return "-";
    }
}