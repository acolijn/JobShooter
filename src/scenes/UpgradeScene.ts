import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { PlayerStats } from '../PlayerStats';
import { Upgrade, UpgradeManager } from '../managers/UpgradeManager';

interface InitData {
  stats: PlayerStats;
  coinTotal: number;
  onPicked: (cost: number) => void;
}

export class UpgradeScene extends Phaser.Scene {
  private stats!: PlayerStats;
  private coinTotal = 0;
  private onPicked!: (cost: number) => void;
  private upgrades!: UpgradeManager;
  private finished = false;

  constructor() {
    super({ key: 'UpgradeScene' });
  }

  init(data: InitData): void {
    this.stats = data.stats;
    this.coinTotal = data.coinTotal;
    this.onPicked = data.onPicked;
    this.upgrades = new UpgradeManager();
    this.finished = false;
  }

  create(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.65);

    this.add
      .text(GAME_WIDTH / 2, 70, 'Choose an Upgrade', {
        fontFamily: 'monospace',
        fontSize: '36px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 108, `Coins: ${this.coinTotal}`, {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffd23f',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 138, 'Click a card / press 1-3.  Skip = 0 / S', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#9ec6d6',
      })
      .setOrigin(0.5);

    const picks = this.upgrades.pickThree(this.stats);
    const cardW = 240;
    const cardH = 280;
    const gap = 30;
    const totalW = picks.length * cardW + Math.max(0, picks.length - 1) * gap;
    const startX = (GAME_WIDTH - totalW) / 2 + cardW / 2;
    const y = GAME_HEIGHT / 2 + 30;

    picks.forEach((u, i) => {
      const x = startX + i * (cardW + gap);
      this.makeCard(x, y, cardW, cardH, u, i + 1);
    });

    this.makeSkipButton();
  }

  private accentFor(kind: Upgrade['kind']): number {
    if (kind === 'weapon') return 0x66ff88;
    if (kind === 'bomb') return 0xff8833;
    return 0x4cd7ff;
  }

  private makeCard(x: number, y: number, w: number, h: number, u: Upgrade, slot: number): void {
    const container = this.add.container(x, y);
    const accent = this.accentFor(u.kind);
    const affordable = this.coinTotal >= u.cost;
    const baseFill = affordable ? 0x132030 : 0x1a1a22;
    const stroke = affordable ? accent : 0x444444;

    const bg = this.add.rectangle(0, 0, w, h, baseFill, 1).setStrokeStyle(2, stroke);
    const slotTag = this.add
      .text(-w / 2 + 14, -h / 2 + 12, `[${slot}]`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: affordable ? '#9ec6d6' : '#555566',
      })
      .setOrigin(0, 0);

    const kindTag = this.add
      .text(w / 2 - 14, -h / 2 + 12, u.kind.toUpperCase(), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: affordable ? Phaser.Display.Color.IntegerToColor(accent).rgba : '#555566',
      })
      .setOrigin(1, 0);

    const name = this.add
      .text(0, -70, u.name, {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: affordable ? '#ffffff' : '#777788',
        align: 'center',
        wordWrap: { width: w - 30 },
      })
      .setOrigin(0.5);

    const desc = this.add
      .text(0, 20, u.description, {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: affordable ? '#cfeaff' : '#666677',
        align: 'center',
        wordWrap: { width: w - 30 },
      })
      .setOrigin(0.5);

    const costStr = affordable ? `Cost: ${u.cost}` : `NEED ${u.cost} COINS`;
    const cost = this.add
      .text(0, h / 2 - 28, costStr, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: affordable ? '#ffd23f' : '#ff6677',
      })
      .setOrigin(0.5);

    container.add([bg, slotTag, kindTag, name, desc, cost]);
    container.setSize(w, h);

    if (affordable) {
      container.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
      container.on('pointerover', () => {
        bg.setFillStyle(0x1c2c40);
        bg.setStrokeStyle(2, 0xffd23f);
      });
      container.on('pointerout', () => {
        bg.setFillStyle(baseFill);
        bg.setStrokeStyle(2, accent);
      });
      container.on('pointerdown', () => this.choose(u));

      const keyMap: Record<number, string> = { 1: 'ONE', 2: 'TWO', 3: 'THREE' };
      const evt = keyMap[slot];
      if (evt) this.input.keyboard?.once(`keydown-${evt}`, () => this.choose(u));
    } else {
      container.setAlpha(0.7);
    }
  }

  private makeSkipButton(): void {
    const w = 200;
    const h = 44;
    const x = GAME_WIDTH / 2;
    const y = GAME_HEIGHT - 60;
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, h, 0x222233, 1).setStrokeStyle(1, 0x9ec6d6);
    const label = this.add
      .text(0, 0, 'Skip (free)', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#cfeaff',
      })
      .setOrigin(0.5);
    container.add([bg, label]);
    container.setSize(w, h);
    container.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
    container.on('pointerover', () => bg.setFillStyle(0x33334a));
    container.on('pointerout', () => bg.setFillStyle(0x222233));
    container.on('pointerdown', () => this.skip());
    this.input.keyboard?.once('keydown-S', () => this.skip());
    this.input.keyboard?.once('keydown-ZERO', () => this.skip());
  }

  private choose(u: Upgrade): void {
    if (this.finished) return;
    if (this.coinTotal < u.cost) return;
    this.finished = true;
    this.upgrades.apply(u, this.stats);
    this.onPicked(u.cost);
    this.scene.stop();
  }

  private skip(): void {
    if (this.finished) return;
    this.finished = true;
    this.onPicked(0);
    this.scene.stop();
  }
}
