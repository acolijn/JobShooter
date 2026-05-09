import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { generateTextures } from '../textures';
import { getLastName, loadScores, Score, setLastName } from '../HighScores';

export class MenuScene extends Phaser.Scene {
  private starfield!: Phaser.GameObjects.Group;
  private nameLabel!: Phaser.GameObjects.Text;
  private playerName = 'Player';
  private scoresText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    generateTextures(this);
    this.makeStarfield();

    this.add
      .text(GAME_WIDTH / 2, 80, 'JOB SHOOTER', {
        fontFamily: 'monospace',
        fontSize: '56px',
        color: '#4cd7ff',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 130, 'Phaser 3 arcade space shooter', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#9ec6d6',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 175, 'TOP SCORES', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffd23f',
      })
      .setOrigin(0.5);

    this.scoresText = this.add
      .text(GAME_WIDTH / 2, 200, 'loading...', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#cfeaff',
        align: 'left',
      })
      .setOrigin(0.5, 0);

    void this.populateScores();

    this.playerName = getLastName() || 'Player';
    this.nameLabel = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 170, '', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#cfeaff',
      })
      .setOrigin(0.5);
    this.nameLabel.setInteractive({ useHandCursor: true });
    this.nameLabel.on('pointerdown', () => this.editName());
    this.refreshNameLabel();

    this.makeStartButton();

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 24, 'Space / Enter / click START.  N edits name.  R refreshes scores.', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#5a7a8a',
      })
      .setOrigin(0.5);

    this.input.keyboard?.on('keydown-SPACE', () => this.startGame());
    this.input.keyboard?.on('keydown-ENTER', () => this.startGame());
    this.input.keyboard?.on('keydown-N', () => this.editName());
    this.input.keyboard?.on('keydown-R', () => {
      this.scoresText.setText('loading...');
      void this.populateScores();
    });
  }

  private makeStartButton(): void {
    const w = 240;
    const h = 56;
    const x = GAME_WIDTH / 2;
    const y = GAME_HEIGHT - 100;
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, h, 0x132030).setStrokeStyle(2, 0x4cd7ff);
    const lbl = this.add
      .text(0, 0, 'START', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    container.add([bg, lbl]);
    container.setSize(w, h);
    container.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
    container.on('pointerover', () => {
      bg.setFillStyle(0x1c2c40);
      bg.setStrokeStyle(2, 0xffd23f);
    });
    container.on('pointerout', () => {
      bg.setFillStyle(0x132030);
      bg.setStrokeStyle(2, 0x4cd7ff);
    });
    container.on('pointerdown', () => this.startGame());
  }

  private async populateScores(): Promise<void> {
    let scores: Score[] = [];
    try {
      scores = await loadScores(10);
    } catch {
      scores = [];
    }
    if (!this.scene.isActive()) return;
    if (scores.length === 0) {
      this.scoresText.setText('No scores yet — be the first!');
      return;
    }
    const lines = scores.map((s, i) => {
      const rank = `${i + 1}`.padStart(2, ' ');
      const nm = (s.name || 'anon').padEnd(16, ' ').slice(0, 16);
      const sc = `${s.score}`.padStart(6, ' ');
      const wv = `W${s.wave}`.padStart(4, ' ');
      return `${rank}. ${nm} ${sc} ${wv}`;
    });
    this.scoresText.setText(lines.join('\n'));
  }

  private refreshNameLabel(): void {
    this.nameLabel.setText(`Name: ${this.playerName}    (click or N to edit)`);
  }

  private editName(): void {
    const raw = window.prompt('Player name:', this.playerName) ?? this.playerName;
    const cleaned = (raw || 'Player').slice(0, 16).trim() || 'Player';
    this.playerName = cleaned;
    setLastName(cleaned);
    this.refreshNameLabel();
  }

  private startGame(): void {
    this.scene.start('GameScene', { playerName: this.playerName });
  }

  private makeStarfield(): void {
    this.starfield = this.add.group();
    for (let i = 0; i < 80; i++) {
      const s = this.add.rectangle(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(0, GAME_HEIGHT),
        Phaser.Math.Between(1, 2),
        Phaser.Math.Between(1, 2),
        0xffffff,
        Phaser.Math.FloatBetween(0.2, 0.8),
      );
      (s as unknown as { vy: number }).vy = Phaser.Math.FloatBetween(10, 40);
      this.starfield.add(s);
    }
  }

  update(_time: number, delta: number): void {
    this.starfield.children.each((c) => {
      const r = c as Phaser.GameObjects.Rectangle & { vy: number };
      r.y += (r.vy * delta) / 1000;
      if (r.y > GAME_HEIGHT) {
        r.y = 0;
        r.x = Phaser.Math.Between(0, GAME_WIDTH);
      }
      return true;
    });
  }
}
