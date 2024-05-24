import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';
import { ChessMove, ComputerConfiguration, StockFishQueryParams, StockFishResponse, stockFishLevels } from './models';
import { Color, FENChar } from '../../chess-logic/models';

@Injectable({
  providedIn: 'root'
})
export class StockFishService {
  private readonly api: string = "https://stockfish.online/api/s/v2.php";
  public computerConfiguration$ = new BehaviorSubject<ComputerConfiguration>({
    color: Color.Black,
    level: 1
  });

  constructor(private http: HttpClient) { }

  private convertColumnLetterToYCoord(str: string): number {
    return str.charCodeAt(0) - "a".charCodeAt(0);
  }

  private promotedPiece(piece: string | undefined): FENChar|null {
    if (!piece) { return null; }

    const computerColor = this.computerConfiguration$.value.color;

    if (piece === "n") { return computerColor === Color.White ? FENChar.WhiteKnight : FENChar.BlackKnight; }
    if (piece === "b") { return computerColor === Color.White ? FENChar.WhiteBishop : FENChar.BlackBishop; }
    if (piece === "r") { return computerColor === Color.White ? FENChar.WhiteRook : FENChar.BlackRook; }
    if (piece === "q") { return computerColor === Color.White ? FENChar.WhiteQueen : FENChar.BlackQueen; }

    return null;
  }

  private moveFromStockFishString(move: string): ChessMove {
    const prevY: number = this.convertColumnLetterToYCoord(move[0]);
    const prevX: number = Number(move[1]) - 1;
    const newY: number = this.convertColumnLetterToYCoord(move[2]);
    const newX: number = Number(move[3]) - 1;

    const promotedPiece = this.promotedPiece(move[4])

    return { prevX, prevY, newX, newY, promotedPiece };
  };

  public getBestMove(fen: string): Observable<ChessMove> {
    const queryParams : StockFishQueryParams = {
      fen,
      depth: stockFishLevels[this.computerConfiguration$.value.level]
    };

    let params = new HttpParams().appendAll(queryParams);
    return this.http.get<StockFishResponse>(this.api, { params })
               .pipe(
                  switchMap(response => {
                    const bestMove = response.bestmove.split(" ")[1];

                    return of(this.moveFromStockFishString(bestMove));
                  })
               );
  }
}
