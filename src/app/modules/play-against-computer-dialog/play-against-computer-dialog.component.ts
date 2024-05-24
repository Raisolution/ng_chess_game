import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { StockFishService } from '../computer-mode/stockfish.service';
import { Color } from '../../chess-logic/models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-play-against-computer-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CommonModule],
  templateUrl: './play-against-computer-dialog.component.html',
  styleUrl: './play-against-computer-dialog.component.css'
})
export class PlayAgainstComputerDialogComponent {
  public stockFishLevels: readonly number[] = [1, 2, 3, 4, 5];
  public stockFishLevel: number = 1;

  constructor(
    private stockFishService: StockFishService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  public selectStockFishLevel(level: number): void {
    this.stockFishLevel = level;
  }

  public play(color: string): void {
    this.dialog.closeAll();

    this.stockFishService.computerConfiguration$.next({
      color: color === 'w' ? Color.Black : Color.White,
      level: this.stockFishLevels[this.stockFishLevel - 1]
    });

    this.router.navigate(["against-computer"]);
  }

  public closeDialog(): void {
    this.router.navigate(["against-friend"]);
  }
}
