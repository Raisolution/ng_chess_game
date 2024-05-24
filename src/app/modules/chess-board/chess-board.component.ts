import { Component, OnDestroy } from '@angular/core';
import { ChessBoard } from '../../chess-logic/chess-board';
import { CheckState, Color, Coords, FENChar, GameHistory, LastMove, MoveList, SafeSquares, pieceImagePaths } from '../../chess-logic/models';
import { CommonModule } from '@angular/common';
import { SelectedSquare } from './models';
import { ChessBoardService } from './chess-board.service';
import { FENConverter } from '../../chess-logic/FENConverter';
import { MoveListComponent } from '../move-list/move-list.component';

@Component({
  selector: 'app-chess-board',
  standalone: true,
  imports: [CommonModule, MoveListComponent],
  templateUrl: './chess-board.component.html',
  styleUrl: './chess-board.component.css'
})
export class ChessBoardComponent implements OnDestroy {
  protected chessBoard = new ChessBoard();
  public chessBoardView: (FENChar|null)[][] = this.chessBoard.chessBoardView;
  public pieceImagePaths = pieceImagePaths;

  public get playerColor(): Color {
    return this.chessBoard.playerColor;
  }

  public get safeSquares(): SafeSquares {
    return this.chessBoard.safeSquares;
  }

  public get gameOverMessage(): string {
    return this.chessBoard.gameOverMessage;
  }

  private selectedSquare: SelectedSquare = { piece: null };
  private pieceSafeSquares: Coords[] = [];
  private lastMove: LastMove | undefined;
  private checkState: CheckState = this.chessBoard.checkState;

  public get moveList(): MoveList {
    return this.chessBoard.moveList;
  }

  public get gameHistory(): GameHistory {
    return this.chessBoard.gameHistory;
  }

  public gameHistoryPointer: number = 0;

  public isPromotionActive: boolean = false;
  private promotionCoords: Coords | null = null;
  private promotedPiece: FENChar | null = null;
  public promotionPieces(): FENChar[] {
    return this.playerColor === Color.White ?
    [FENChar.WhiteKnight, FENChar.WhiteBishop, FENChar.WhiteRook, FENChar.WhiteQueen] :
    [FENChar.BlackKnight, FENChar.BlackBishop, FENChar.BlackRook, FENChar.BlackQueen]
  }

  public flipMode: boolean = false;

  constructor(protected chessBoardService: ChessBoardService) { }

  public ngOnDestroy(): void {
    this.chessBoardService.chessBoardState$.next(FENConverter.initalPosition);
  }

  public flipBoard(): void {
    this.flipMode = !this.flipMode;
  }

  public isSquareDark(x: number, y: number): boolean {
    return ChessBoard.isSquareDark(x, y);
  }

  public isSquareSelected(x: number, y: number): boolean {
    if (!this.selectedSquare.piece) return false;

    return this.selectedSquare.x === x && this.selectedSquare.y === y;
  }

  public isSquareSafeForSelectedPiece(x: number, y: number): boolean {
    return this.pieceSafeSquares.some(coords => coords.x === x && coords.y === y);
  }

  public isSquareLastMove(x: number, y: number): boolean {
    if (!this.lastMove) {
      return false;
    }

    const { prevX, prevY, currX, currY } = this.lastMove;
    
    return (x === prevX && y === prevY) || (x === currX && y === currY);
  }

  public isSquareChecked(x: number, y: number): boolean {
    return this.checkState.isInCheck && this.checkState.x === x && this.checkState.y === y;
  }

  public isSquarePromotionSquare(x: number, y: number): boolean {
    if (!this.promotionCoords) { return false; }

    return this.promotionCoords.x === x && this.promotionCoords.y === y;
  }

  private unmarkingPreviouslySelectedAndSafeSquares(): void {
    this.selectedSquare = { piece: null };
    this.pieceSafeSquares = [];

    if (this.isPromotionActive) {
      this.isPromotionActive = false;
      this.promotedPiece = null;
      this.promotionCoords = null;
    }
  }

  public selectingPiece(x: number, y: number): void {
    if (this.gameOverMessage.length > 0) { return; }

    const piece: FENChar | null = this.chessBoardView[x][y];
    if (!piece) return;

    if (this.isWrongPieceSelected(piece)) return;

    const isSameSquareClicked: boolean =
    !!this.selectedSquare.piece && this.selectedSquare.x === x && this.selectedSquare.y === y;

    this.unmarkingPreviouslySelectedAndSafeSquares();
    if (isSameSquareClicked) return;

    this.selectedSquare = { piece, x, y };
    this.pieceSafeSquares = this.safeSquares.get(x + "," + y) || [];
  }

  private isWrongPieceSelected(piece: FENChar): boolean {
    const isWhitePieceSelected: boolean = piece === piece.toUpperCase();
    return isWhitePieceSelected && this.playerColor === Color.Black ||
          !isWhitePieceSelected && this.playerColor === Color.White;
  }

  private placingPiece(newX: number, newY: number): void {
    if (!this.selectedSquare.piece) return;
    if (!this.isSquareSafeForSelectedPiece(newX, newY)) return;

    //pawn promotion
    const isPawnSelected: boolean = this.selectedSquare.piece === FENChar.WhitePawn || this.selectedSquare.piece === FENChar.BlackPawn;
    const isPawnOnLastRank: boolean = isPawnSelected && (newX === 7 || newX === 0);
    const shouldOpenPromotionDialog: boolean = !this.isPromotionActive && isPawnOnLastRank;

    if (shouldOpenPromotionDialog) {
      this.pieceSafeSquares = [];
      this.isPromotionActive = true;
      this.promotionCoords = { x: newX, y: newY };
      return;
    }

    const { x: prevX, y: prevY } = this.selectedSquare;
    this.updateBoard(prevX, prevY, newX, newY);
  }

  protected updateBoard(prevX: number, prevY: number, newX: number, newY: number): void {
    this.chessBoard.move(prevX, prevY, newX, newY, this.promotedPiece);
    this.chessBoardView = this.chessBoard.chessBoardView;

    this.checkState = this.chessBoard.checkState;
    this.lastMove = this.chessBoard.lastMove;
    
    this.unmarkingPreviouslySelectedAndSafeSquares();
    this.chessBoardService.chessBoardState$.next(this.chessBoard.boardAsFEN);
    this.gameHistoryPointer += 1;
  }

  public promotePiece(piece: FENChar): void {
    if (!this.promotionCoords || !this.selectedSquare.piece) {
      return;
    }

    this.promotedPiece = piece;
    const { x: newX, y: newY } = this.promotionCoords;
    const { x: prevX, y: prevY} = this.selectedSquare;
    this.updateBoard(prevX, prevY, newX, newY);
  }

  public closePawnPromotionDialog(): void {
    this.unmarkingPreviouslySelectedAndSafeSquares();
  }

  public move(x: number, y: number): void {
    this.selectingPiece(x, y)
    this.placingPiece(x, y);
  }

  public showPreviousPosition(moveIndex: number): void {
    const { board, checkState, lastMove } = this.gameHistory[moveIndex];
    
    this.chessBoardView = board;
    this.checkState = checkState;
    this.lastMove = lastMove;
    this.gameHistoryPointer = moveIndex;
  }
}
