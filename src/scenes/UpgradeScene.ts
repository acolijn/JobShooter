import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { PlayerStats } from '../PlayerStats';
import { Upgrade, UpgradeManager } from '../managers/UpgradeManager';

interface InitData {
  stats: PlayerStats;
  onPicked: (u: Upgrade) => void;
}

export class UpgradeScene extends Phaser.Scene {
  private stats!: PlayerStats;
  private onPicked!: (u: Upgrade) => void;
  private upgrades!: UpgradeManager;

  constructor() {
    super({ key: 'UpgradeScene' });
  }

  init(data: InitData): void {
    this.stats = data.stats;
    this.onPicked = data.onPicked;
    this.upgrades = new UpgradeManager();
  }

  create(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.65);

    this.add
      .text(GAME_WIDTH / 2, 90, 'Choose an Upgrade', {
        fontFamily: 'monospace',
        fontSize: '36px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 130, 'Click a card or press 1 / 2 / 3', {
        fontFamily: 'monospace',
        fontSize: '16px',
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
  }

  private accentFor(kind: Upgrade['kind']): number {
    if (kind === 'weapon') return 0x66ff88;
    if (kind === 'bomb') return 0xff8833;
    return 0x4cd7ff;
  }

  private makeCard(x: number, y: number, w: number, h: number, u: Upgrade, slot: number): void {
    const container = this.add.container(x, y);
    const accent = this.accentFor(u.kind);

    const bg = this.add.rectangle(0, 0, w, h, 0x132030, 1).setStrokeStyle(2, accent);
    const slotTag = this.add
      .text(-w / 2 + 14, -h / 2 + 12, `[${slot}]`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#9ec6d6',
      })
      .setOrigin(0, 0);

    const kindTag = this.add
      .text(w / 2 - 14, -h / 2 + 12, u.kind.toUpperCase(), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: Phaser.Display.Color.IntegerToColor(accent).rgba,
      })
      .setOrigin(1, 0);

    const name = this.add
      .text(0, -60, u.name, {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: w - 30 },
      })
      .setOrigin(0.5);

    const desc = this.add
      .text(0, 30, u.description, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#cfeaff',
        align: 'center',
        wordWrap: { width: w - 30 },
      })
      .setOrigin(0.5);

    container.add([bg, slotTag, kindTag, name, desc]);
    container.setSize(w, h);
    container.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      bg.setFillStyle(0x1c2c40);
      bg.setStrokeStyle(2, 0xffd23f);
    });
    container.on('pointerout', () => {
      bg.setFillStyle(0x132030);
      bg.setStrokeStyle(2, accent);
    });
    container.on('pointerdown', () => this.choose(u));

    const keyMap: Record<number, string> = { 1: 'ONE', 2: 'TWO', 3: 'THREE' };
    const evt = keyMap[slot];
    if (evt) this.input.keyboard?.once(`keydown-${evt}`, () => this.choose(u));
  }

  private choose(u: Upgrade): void {
    this.upgrades.apply(u, this.stats);
    this.onPicked(u);
    this.scene.stop();
  }
}
