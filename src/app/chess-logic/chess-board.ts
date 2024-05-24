import { Color, Bishop, King, Knight, Pawn, Queen, Rook, Piece, FENChar, SafeSquares, Coords, pieceImagePaths, LastMove, CheckState, MoveType, MoveList, GameHistory, columns } from "./models";
import { FENConverter } from "./FENConverter";

export class ChessBoard {
    private chessBoard:(Piece|null)[][];
    private readonly chessBoardSize: number = 8;
    private _playerColor = Color.White;
    private _safeSquares: SafeSquares;
    private _lastMove: LastMove | undefined;
    private _checkState: CheckState = { isInCheck: false };
    
    private _isGameOver: boolean = false;
    private _gameOverMessage: string = "";

    private fiftyMoveRuleCounter: number = 0;
    private fullNumberOfMoves: number = 1;
    private threeFoldRepetitionDictionary = new Map<string, number>();
    private threeFoldRepetitionFlag: boolean = false;

    private _boardAsFEN: string = FENConverter.initalPosition;
    private fenConverter = new FENConverter();
    private _moveList: MoveList = [];
    private _gameHistory: GameHistory;

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
        this._gameHistory = [{
            board: this.chessBoardView,
            lastMove: this._lastMove,
            checkState: this._checkState
        }];
    }

    public get safeSquares(): SafeSquares {
        return this._safeSquares;
    }

    public get lastMove(): LastMove | undefined {
        return this._lastMove;
    }

    public get checkState(): CheckState {
        return this._checkState;
    }

    public get playerColor(): Color {
        return this._playerColor;
    }

    public get isGameOver(): boolean {
        return this._isGameOver;
    }

    public get gameOverMessage(): string {
        return this._gameOverMessage;
    }

    public get boardAsFEN(): string {
        return this._boardAsFEN;
    }

    public get moveList(): MoveList {
        return this._moveList;
    }

    public get gameHistory(): GameHistory {
        return this._gameHistory;
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

    public isInCheck(playerColor: Color, checkingCurrentPosition: boolean = false): boolean {
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
                            if (checkingCurrentPosition) {
                                this._checkState = { isInCheck: true, x: newX, y: newY };
                            }

                            return true;
                        }
                    } else {
                        //Bishop, Queen, Rook
                        while (this.areCoordsValid(newX, newY)) {
                            const attackedPiece: Piece|null = this.chessBoard[newX][newY];

                            if (attackedPiece instanceof King && attackedPiece.color === playerColor) {
                                if (checkingCurrentPosition) {
                                    this._checkState = { isInCheck: true, x: newX, y: newY };
                                }
    
                                return true;
                            }

                            if (attackedPiece !== null) break;

                            newX += dx;
                            newY += dy;
                        }
                    }
                }
            }
        }

        if (checkingCurrentPosition) {
            this._checkState = { isInCheck: false };
        }

        return false;
    }

    public isPositionSafeAfterMove(prevX: number, prevY: number, newX: number, newY: number): boolean {
        const piece: Piece|null = this.chessBoard[prevX][prevY];
        if (!piece) { return false; }

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
                        if (this.isPositionSafeAfterMove(x, y, newX, newY)) {
                            pieceSafeSquares.push({
                                x: newX,
                                y: newY
                            });
                        }
                    } else {
                        //Bishop, Queen, Rook
                        while (this.areCoordsValid(newX, newY)) {
                            newPiece = this.chessBoard[newX][newY];

                            if (newPiece && newPiece.color === piece.color) break;

                            if (this.isPositionSafeAfterMove(x, y, newX, newY)) {
                                pieceSafeSquares.push({ x: newX, y: newY });
                            }

                            if (newPiece !== null) break;

                            newX += dx;
                            newY += dy;
                        }
                    }
                }

                if (piece instanceof King) {
                    if (this.canCastle(piece, true)) {
                        pieceSafeSquares.push({ x, y: 6 });
                    }

                    if (this.canCastle(piece, false)) {
                        pieceSafeSquares.push({ x, y: 2 });
                    }
                } else if (piece instanceof Pawn && this.canCaptureEnPassant(piece, x, y)) {
                    pieceSafeSquares.push({
                        x: x + (piece.color === Color.White ? 1 : -1),
                        y: this._lastMove!.prevY
                    });
                }

                if (pieceSafeSquares.length) {
                    safeSquares.set(x + "," + y, pieceSafeSquares);
                }
            }
        }

        return safeSquares;
    }

    private canCaptureEnPassant(pawn: Pawn, pawnX: number, pawnY: number): boolean {
        if (!this._lastMove) {
            return false;
        }

        const { piece, prevX, prevY, currX, currY } = this._lastMove;

        if (
            !(piece instanceof Pawn) ||
            pawn.color !== this._playerColor ||
            Math.abs(currX - prevX) !== 2 ||
            pawnX !== currX ||
            Math.abs(pawnY - currY) !== 1
        ) {
                return false;
        }

        const pawnNewPositionX: number = pawnX + (pawn.color === Color.White ? 1 : -1);
        const pawnNewPositionY: number = currY;

        this.chessBoard[currX][currY] = null;
        const isPositionSafe: boolean = this.isPositionSafeAfterMove(pawnX, pawnY, pawnNewPositionX, pawnNewPositionY);
        this.chessBoard[currX][currY] = piece;

        return isPositionSafe;
    }

    private canCastle(king: King, kingSideCastle: boolean): boolean {
        if (king.hasMoved) {
            return false;
        }

        const kingPositionX: number = king.color === Color.White ? 0 : 7;
        const kingPositionY: number = 4;
        const rookPositionX: number = kingPositionX;
        const rookPositionY: number = kingSideCastle ? 7 : 0;
        const rook: Piece | null = this.chessBoard[rookPositionX][rookPositionY];

        if (!(rook instanceof Rook) || rook.hasMoved || this._checkState.isInCheck) {
            return false;
        }

        const firstNextKingPositionY: number = kingPositionY + (kingSideCastle ? 1 : - 1);
        const secondNextKingPositionY: number = kingPositionY + (kingSideCastle ? 2 : -2);

        if (this.chessBoard[kingPositionX][firstNextKingPositionY] || this.chessBoard[kingPositionX][secondNextKingPositionY]) {
            return false;
        }

        if (!kingSideCastle && this.chessBoard[kingPositionX][1]) {
            return false;
        }

        return this.isPositionSafeAfterMove(kingPositionX, kingPositionY, kingPositionX, firstNextKingPositionY) && this.isPositionSafeAfterMove(kingPositionX, kingPositionY, kingPositionX, secondNextKingPositionY);
    }

    public move(prevX: number, prevY: number, newX: number, newY: number, promotedPieceType: FENChar | null): void {
        if (this._isGameOver) {
            throw new Error("Game is over!");
        }

        if (!this.areCoordsValid(prevX, prevY) || !this.areCoordsValid(newX, newY)) return;

        const piece: Piece | null = this.chessBoard[prevX][prevY];
        if (!piece || piece.color !== this._playerColor) return;

        const pieceSafeSquares: Coords[] | undefined = this._safeSquares.get(prevX + "," + prevY);
        if (!pieceSafeSquares || !pieceSafeSquares.find(coords => coords.x === newX && coords.y === newY)) {
            throw new Error("Square is not safe");
        }

        if ((piece instanceof Pawn || piece instanceof King || piece instanceof Rook) && !piece.hasMoved) {
            piece.hasMoved = true;
        }

        const moveType = new Set<MoveType>();

        const isPieceTaken: boolean = this.chessBoard[newX][newY] !== null;

        if (isPieceTaken) { moveType.add(MoveType.Capture); }

        if (piece instanceof Pawn || isPieceTaken) {
            this.fiftyMoveRuleCounter = 0;
        } else {
            this.fiftyMoveRuleCounter += 0.5;
        }

        this.handleSpecialMoves(piece, prevX, prevY, newX, newY, moveType);

        if (promotedPieceType) {
            this.chessBoard[newX][newY] = this.promotePiece(promotedPieceType);
            moveType.add(MoveType.Promotion);
        } else {
            this.chessBoard[newX][newY] = piece;
        }

        this.chessBoard[prevX][prevY] = null;

        this._lastMove = { prevX, prevY, currX: newX, currY: newY, piece, moveType };
        this._playerColor = this._playerColor === Color.White ? Color.Black : Color.White;
        this.isInCheck(this._playerColor, true);
        this._safeSquares = this.findSafeSquares();

        if (this._checkState.isInCheck) {
            moveType.add(this._safeSquares.size > 0 ? MoveType.Check : MoveType.CheckMate);
        } else if (moveType.size === 0) {
            moveType.add(MoveType.BasicMove);
        }

        this.storeMove(promotedPieceType);
        this.updateGameHistory();

        if (this._playerColor === Color.White) {
            this.fullNumberOfMoves += 1;
        }

        this._boardAsFEN = this.fenConverter.convertBoardToFEN(
            this.chessBoard,
            this._playerColor,
            this._lastMove,
            this.fiftyMoveRuleCounter,
            this.fullNumberOfMoves
        );

        this.updateThreeFoldRepetitionDictionary(this._boardAsFEN);

        this._isGameOver = this.isGameFinished();
    }

    private handleSpecialMoves(
        piece: Piece,
        prevX: number,
        prevY: number,
        newX: number,
        newY: number,
        moveType: Set<MoveType>
    ): void {
        if (piece instanceof King && Math.abs(newY - prevY) === 2) {
            const rookPositionX: number = prevX;
            const rookPositionY: number = newY > prevY ? 7 : 0;
            const rook: Rook = this.chessBoard[rookPositionX][rookPositionY] as Rook;
            const rookNewPositionY: number = newY > prevY ? 5 : 3;

            this.chessBoard[rookPositionX][rookPositionY] = null;
            this.chessBoard[rookPositionX][rookNewPositionY] = rook;
            rook.hasMoved = true;
            moveType.add(MoveType.Castling);
        } else if (piece instanceof Pawn && this._lastMove &&
                   this._lastMove.piece instanceof Pawn &&
                   Math.abs(this._lastMove.currX - this._lastMove.prevX) === 2 &&
                   prevX === this._lastMove.currX &&
                   newY === this._lastMove.currY
        ) {
            this.chessBoard[this._lastMove.currX][this._lastMove.currY] = null;
            moveType.add(MoveType.Capture);   
        }
    }

    private promotePiece(promotedPieceType: FENChar): Knight | Bishop | Rook | Queen {
        if (promotedPieceType === FENChar.WhiteKnight || promotedPieceType === FENChar.BlackKnight) {
            return new Knight(this._playerColor);
        }

        if (promotedPieceType === FENChar.WhiteBishop || promotedPieceType === FENChar.BlackBishop) {
            return new Bishop(this._playerColor);
        }

        if (promotedPieceType === FENChar.WhiteRook || promotedPieceType === FENChar.BlackRook) {
            return new Rook(this._playerColor);
        }

        return new Queen(this._playerColor);
    }

    private isGameFinished(): boolean {
        if (!this._safeSquares.size) {
            if (this._checkState.isInCheck) {
                const prevPlayer: string = this._playerColor === Color.White ? "Black" : "White";
                this._gameOverMessage = prevPlayer + " won by checkmate.";
            } else {
                this._gameOverMessage = "Stalemate.";
            }

            return true;
        }

        if (this.threeFoldRepetitionFlag) {
            this._gameOverMessage = "Draw due threefold repetition.";
        }

        if (this.fiftyMoveRuleCounter >= 50) {
            this._gameOverMessage = "Draw due to 50 move rule.";
            return true;
        }

        return false;
    }

    private insufficientMaterial(): boolean {
        //TBD checks if there are enough pieces to finish a game.

        return false;
    }

    private updateThreeFoldRepetitionDictionary(fen: string): void {
        const threeFoldRepetitionFenKey: string = fen.split(" ").slice(0, 4).join("");
        const threeFoldRepetition: number | undefined = this.threeFoldRepetitionDictionary.get(threeFoldRepetitionFenKey);

        if (threeFoldRepetition === undefined) {
            this.threeFoldRepetitionDictionary.set(threeFoldRepetitionFenKey, 1);
        } else {
            if (threeFoldRepetition === 2) {
                this.threeFoldRepetitionFlag = true;
                return;
            }

            this.threeFoldRepetitionDictionary.set(threeFoldRepetitionFenKey, 2);
        }
    }

    private storeMove(promotedPiece: FENChar | null): void {
        const { piece, currX, currY, prevX, prevY, moveType } = this._lastMove!;
        let pieceName: string = !(piece instanceof Pawn) ? piece.fenChar : "";
        let move: string;

        if (moveType.has(MoveType.Castling)) {
            //Queen side and King side castling notations
            move = currY - prevY === 2 ? "O-O" : "O-O-O";
        } else {
            move = pieceName + columns[prevY] + String(prevX + 1);

            if (moveType.has(MoveType.Capture)) {
                move += "x";
            }

            move += columns[currY] + String(currX + 1);

            if (promotedPiece) {
                move += "=" + promotedPiece.toUpperCase();
            }

            if (moveType.has(MoveType.Check)) {
                move += "+";
            } else if (moveType.has(MoveType.CheckMate)) {
                move += "#";
            }

            if (!this._moveList[this.fullNumberOfMoves - 1]) {
                this._moveList[this.fullNumberOfMoves - 1] = [move];
            } else {
                this._moveList[this.fullNumberOfMoves - 1].push(move);
            }
        }
    }

    private updateGameHistory(): void {
        this._gameHistory.push({
            board: [...this.chessBoardView.map(row => [...row])],
            checkState: { ...this._checkState },
            lastMove: this._lastMove ? { ...this._lastMove } : undefined
        });
    }
}