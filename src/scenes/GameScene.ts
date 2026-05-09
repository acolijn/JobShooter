import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, WAVE } from '../config';
import { generateTextures } from '../textures';
import { Player } from '../entities/Player';
import { Enemy, EnemyGroup } from '../entities/Enemy';
import { Bullet, BulletGroup } from '../entities/Bullet';
import { Bomb, BombGroup } from '../entities/Bomb';
import { Coin, CoinGroup } from '../entities/Coin';
import { PowerUp, PowerUpGroup } from '../entities/PowerUp';
import { WaveManager } from '../managers/WaveManager';
import { profileFor, WEAPON_PROFILES } from '../weapons';
import { computeScore, getLastName, loadScores, saveScore, setLastName, Score } from '../HighScores';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private bullets!: BulletGroup;
  private bombs!: BombGroup;
  private enemies!: EnemyGroup;
  private coins!: CoinGroup;
  private powerUps!: PowerUpGroup;
  // active timed power-up effects
  private activeFreeze = false;
  private shieldUntil = 0;
  private doubleDamageUntil = 0;
  private superJobbossUntil = 0;
  private superJobbossBanner!: Phaser.GameObjects.Text;
  private powerUpStatusText!: Phaser.GameObjects.Text;
  private bombCdBar!: Phaser.GameObjects.Rectangle;
  private weaponBarText!: Phaser.GameObjects.Text;
  private bossBarBg!: Phaser.GameObjects.Rectangle;
  private bossBar!: Phaser.GameObjects.Rectangle;
  private bossLabel!: Phaser.GameObjects.Text;
  private waveManager!: WaveManager;
  private hudText!: Phaser.GameObjects.Text;
  private hpBar!: Phaser.GameObjects.Rectangle;
  private bannerText!: Phaser.GameObjects.Text;
  private helpPanel!: Phaser.GameObjects.Container;
  private helpVisible = true;
  private coinTotal = 0;
  private coinsEarnedTotal = 0;
  private gameOver = false;
  private playerName = 'Player';
  private starfield!: Phaser.GameObjects.Group;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data?: { playerName?: string }): void {
    this.playerName = data?.playerName || getLastName() || 'Player';
    this.coinTotal = 0;
    this.coinsEarnedTotal = 0;
    this.gameOver = false;
  }

  create(): void {
    generateTextures(this);
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.makeStarfield();

    this.player = new Player(this, GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.bullets = new BulletGroup(this);
    this.bombs = new BombGroup(this);
    this.enemies = new EnemyGroup(this);
    this.coins = new CoinGroup(this);
    this.powerUps = new PowerUpGroup(this);
    this.player.setEnemies(this.enemies);

    this.waveManager = new WaveManager(this, this.enemies, {
      onWaveStart: (w) => this.showBanner(`Wave ${w}`),
      onWaveCleared: (w) => this.onWaveCleared(w),
      onBossSpawn: () => {
        this.showBanner('!! BOSS !!');
        this.cameras.main.shake(220, 0.005);
      },
    });

    this.events.on('enemy-fire', (opts: { x: number; y: number; angle: number; speed: number; damage: number }) => {
      this.bullets.spawn({
        x: opts.x,
        y: opts.y,
        angle: opts.angle,
        speed: opts.speed,
        damage: opts.damage,
        pierce: 0,
        fromPlayer: false,
      });
    });

    this.installCollisions();
    this.makeHud();

    this.input.addPointer(2);
    this.input.mouse?.disableContextMenu();

    this.events.on('upgrade-selected', () => {
      this.scene.resume();
      this.time.delayedCall(WAVE.interWaveDelayMs, () => {
        if (!this.gameOver) this.waveManager.startNextWave();
      });
    });

    this.time.delayedCall(600, () => this.waveManager.startNextWave());
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
      (s as any).vy = Phaser.Math.FloatBetween(10, 40);
      this.starfield.add(s);
    }
  }

  private updateStarfield(delta: number): void {
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

  private installCollisions(): void {
    this.physics.add.overlap(this.bullets, this.enemies, (bObj, eObj) => {
      const b = bObj as Bullet;
      const e = eObj as Enemy;
      if (!b.active || !e.active || !b.fromPlayer) return;
      const killed = e.hit(b.damage);
      if (killed) {
        const value = Math.max(1, Math.round(e.coinValue * this.player.stats.coinMultiplier));
        this.coins.drop(e.x, e.y, value);
        const dropType = PowerUpGroup.rollDrop(e.type === 'boss', this.player.stats);
        if (dropType) this.powerUps.drop(e.x, e.y, dropType);
      }
      if (b.pierce > 0) {
        b.pierce -= 1;
      } else {
        b.kill();
      }
    });

    this.physics.add.overlap(this.bombs, this.enemies, (bObj, eObj) => {
      const bomb = bObj as Bomb;
      const e = eObj as Enemy;
      if (!bomb.active || !e.active) return;
      bomb.explode();
    });

    this.physics.add.overlap(this.player, this.enemies, (_p, eObj) => {
      const e = eObj as Enemy;
      if (!e.active) return;
      const now = this.time.now;
      const took = this.player.takeDamage(e.damage, now, now < this.shieldUntil);
      if (took) {
        const dx = this.player.x - e.x;
        const dy = this.player.y - e.y;
        const len = Math.hypot(dx, dy) || 1;
        e.setVelocity((-dx / len) * e.speed * 1.2, (-dy / len) * e.speed * 1.2);
      }
    });

    this.physics.add.overlap(this.player, this.coins, (_p, cObj) => {
      const c = cObj as Coin;
      if (!c.active) return;
      this.coinTotal += c.value;
      this.coinsEarnedTotal += c.value;
      c.kill();
    });

    this.physics.add.overlap(this.player, this.powerUps, (_p, puObj) => {
      const pu = puObj as PowerUp;
      if (!pu.active) return;
      this.collectPowerUp(pu);
      pu.kill();
    });

    this.physics.add.overlap(this.player, this.bullets, (_p, bObj) => {
      const b = bObj as Bullet;
      if (!b.active || b.fromPlayer) return;
      const now = this.time.now;
      const took = this.player.takeDamage(b.damage, now, now < this.shieldUntil);
      if (took) b.kill();
    });
  }

  private makeHud(): void {
    this.hudText = this.add
      .text(12, 10, '', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#e0f7ff',
      })
      .setDepth(100)
      .setScrollFactor(0);

    this.add
      .rectangle(12, 36, 220, 12, 0x1a1f2a)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x3a4a5a)
      .setDepth(100);
    this.hpBar = this.add
      .rectangle(13, 37, 218, 10, 0x4cd7ff)
      .setOrigin(0, 0)
      .setDepth(101);

    this.add
      .rectangle(12, 54, 220, 8, 0x1a1f2a)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x3a4a5a)
      .setDepth(100);
    this.bombCdBar = this.add
      .rectangle(13, 55, 218, 6, 0xff8833)
      .setOrigin(0, 0)
      .setDepth(101);
    this.bombCdBar.width = 0;

    this.weaponBarText = this.add
      .text(12, 68, '', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#cfeaff',
      })
      .setDepth(100);

    const bbW = 600;
    const bbX = (GAME_WIDTH - bbW) / 2;
    const bbY = 92;
    this.bossBarBg = this.add
      .rectangle(bbX, bbY, bbW, 20, 0x220011, 1)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0xff3366)
      .setDepth(100)
      .setVisible(false);
    this.bossBar = this.add
      .rectangle(bbX + 1, bbY + 1, bbW - 2, 18, 0xff3366)
      .setOrigin(0, 0)
      .setDepth(101)
      .setVisible(false);
    this.bossLabel = this.add
      .text(GAME_WIDTH / 2, bbY + 10, '', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(102)
      .setVisible(false);

    this.bannerText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(200)
      .setAlpha(0);

    // Super Jobboss mode overlay banner
    this.superJobbossBanner = this.add
      .text(GAME_WIDTH / 2, 140, '★ SUPER JOBBOSS MODE ★', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#ffdd00',
        stroke: '#ff4400',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(300)
      .setVisible(false);

    // Active power-up status bar
    this.powerUpStatusText = this.add
      .text(GAME_WIDTH / 2, 12, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setDepth(110);

    this.makeHelpPanel();
  }

  private makeHelpPanel(): void {
    const lines = [
      'CONTROLS',
      '────────────────',
      'Move      WASD / Arrows',
      'Aim       Mouse / Touch',
      'Rotate    Q / E (keyboard)',
      'Fire      Auto (always firing)',
      'Bombs     Auto when unlocked',
      'Weapon    1-4, Tab, wheel',
      'Upgrade   Click card / 1 2 3',
      '',
      'Press H to toggle help',
    ];
    const padding = 10;
    const text = this.add
      .text(0, 0, lines.join('\n'), {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#cfeaff',
        lineSpacing: 2,
      })
      .setOrigin(0, 0);
    const w = text.width + padding * 2;
    const h = text.height + padding * 2;
    const bg = this.add
      .rectangle(0, 0, w, h, 0x000000, 0.55)
      .setStrokeStyle(1, 0x4cd7ff, 0.6)
      .setOrigin(0, 0);
    text.setPosition(padding, padding);

    this.helpPanel = this.add.container(12, GAME_HEIGHT - h - 12, [bg, text]);
    this.helpPanel.setDepth(100).setScrollFactor(0);

    this.add
      .text(GAME_WIDTH - 12, GAME_HEIGHT - 14, 'H = help', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#5a7a8a',
      })
      .setOrigin(1, 1)
      .setDepth(100);

    this.input.keyboard?.on('keydown-H', () => {
      this.helpVisible = !this.helpVisible;
      this.helpPanel.setVisible(this.helpVisible);
    });
  }

  private showBanner(text: string): void {
    this.bannerText.setText(text);
    this.bannerText.setAlpha(1);
    this.tweens.add({
      targets: this.bannerText,
      alpha: 0,
      delay: 700,
      duration: 600,
    });
  }

  private updateHud(time: number): void {
    const s = this.player.stats;
    const prof = profileFor(s);
    const effRof = Math.round(s.fireRateMs * prof.fireRateMul);
    const effDmg = Math.round(s.bulletDamage * prof.damageMul);
    const bombStr = s.bombEnabled ? `  BOMB ${s.bombDamage}/${Math.round(s.bombRadius)}` : '';
    this.hudText.setText(
      [
        `WAVE ${this.waveManager.wave}`,
        `HP   ${Math.max(0, Math.round(s.hp))}/${s.maxHp}`,
        `COIN ${this.coinTotal}`,
        `${prof.label.toUpperCase()} DMG ${effDmg} RoF ${effRof}ms x${Math.max(1, s.bulletCount + prof.countDelta)}${bombStr}`,
      ].join('  |  '),
    );
    const ratio = Phaser.Math.Clamp(s.hp / s.maxHp, 0, 1);
    this.hpBar.width = 218 * ratio;
    this.hpBar.fillColor = ratio > 0.5 ? 0x4cd7ff : ratio > 0.25 ? 0xffd23f : 0xff5577;
    if (s.bombEnabled) {
      this.bombCdBar.width = 218 * this.player.bombCooldownRatio(time);
      this.bombCdBar.setVisible(true);
    } else {
      this.bombCdBar.setVisible(false);
    }

    // Weapon bar: show tier as stars, active weapon highlighted
    const parts = s.ownedWeapons.map((w, i) => {
      const label = WEAPON_PROFILES[w].label;
      const tier = s.weaponTiers?.[w] ?? 0;
      const stars = tier > 0 ? '★'.repeat(tier) : '';
      const tag = `[${i + 1}]${label}${stars}`;
      return w === s.weaponType ? `>${tag}<` : ` ${tag} `;
    });
    this.weaponBarText.setText('WPN ' + parts.join(' '));

    const boss = this.enemies.findBoss();
    if (boss) {
      const ratio = Phaser.Math.Clamp(boss.hp / boss.maxHp, 0, 1);
      const w = (this.bossBarBg.width as number) - 2;
      this.bossBar.width = w * ratio;
      this.bossLabel.setText(`BOSS  ${Math.max(0, Math.round(boss.hp))} / ${boss.maxHp}`);
      this.bossBarBg.setVisible(true);
      this.bossBar.setVisible(true);
      this.bossLabel.setVisible(true);
    } else {
      this.bossBarBg.setVisible(false);
      this.bossBar.setVisible(false);
      this.bossLabel.setVisible(false);
    }
  }

  private onWaveCleared(wave: number): void {
    this.showBanner(`Wave ${wave} cleared!`);
    this.coins.children.each((c) => {
      const coin = c as Coin;
      if (coin.active) {
        this.coinTotal += coin.value;
        this.coinsEarnedTotal += coin.value;
        coin.kill();
      }
      return true;
    });
    this.player.fullHeal();
    this.scene.pause();
    this.scene.launch('UpgradeScene', {
      stats: this.player.stats,
      coinTotal: this.coinTotal,
      onPicked: (cost: number) => {
        this.coinTotal = Math.max(0, this.coinTotal - cost);
        this.events.emit('upgrade-selected');
      },
    });
  }

  update(time: number, delta: number): void {
    if (this.gameOver) return;
    this.updateStarfield(delta);
    this.updatePowerUps(time);
    this.player.update(time, delta, this.bullets, this.bombs, (x, y, r, d) => this.detonate(x, y, r, d), {
      frozen: this.activeFreeze,
      shielded: time < this.shieldUntil,
      damageMultiplier: (time < this.doubleDamageUntil || time < this.superJobbossUntil) ? 2 : 1,
      superJobboss: time < this.superJobbossUntil,
    });
    if (!this.activeFreeze) {
      this.enemies.updateAll(time, delta, this.player.x, this.player.y);
    }
    this.waveManager.update();
    this.updateHud(time);
    if (this.player.isDead()) this.endGame();
  }

  private detonate(x: number, y: number, radius: number, damage: number): void {
    const ring = this.add.circle(x, y, 4, 0xff8833, 0.7).setDepth(50);
    const flash = this.add.circle(x, y, radius * 0.5, 0xfff2a8, 0.5).setDepth(49);
    this.tweens.add({
      targets: ring,
      radius: radius,
      alpha: 0,
      duration: 380,
      ease: 'Cubic.easeOut',
      onUpdate: () => ring.setRadius(ring.radius),
      onComplete: () => ring.destroy(),
    });
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.6,
      duration: 280,
      onComplete: () => flash.destroy(),
    });
    const r2 = radius * radius;
    this.enemies.children.each((c) => {
      const e = c as Enemy;
      if (!e.active) return true;
      const dx = e.x - x;
      const dy = e.y - y;
      if (dx * dx + dy * dy <= r2) {
        const killed = e.hit(damage);
        if (killed) {
          const value = Math.max(1, Math.round(e.coinValue * this.player.stats.coinMultiplier));
          this.coins.drop(e.x, e.y, value);
          const dropType = PowerUpGroup.rollDrop(e.type === 'boss', this.player.stats);
          if (dropType) this.powerUps.drop(e.x, e.y, dropType);
        } else {
          const len = Math.hypot(dx, dy) || 1;
          e.setVelocity((dx / len) * 220, (dy / len) * 220);
        }
      }
      return true;
    });
  }

  private collectPowerUp(pu: PowerUp): void {
    const def = pu.def;
    const now = this.time.now;

    // Instant stat pickups
    if (def.apply) {
      def.apply(this.player.stats);
      this.showBanner(`+${def.label}`);
      return;
    }

    switch (def.type) {
      case 'freeze':
        this.activeFreeze = true;
        this.enemies.children.each((c) => {
          const e = c as Enemy;
          if (e.active) { e.setVelocity(0, 0); e.setTint(0x88ddff); }
          return true;
        });
        this.showBanner('❄ FREEZE!');
        this.time.delayedCall(def.durationMs!, () => {
          this.activeFreeze = false;
          this.enemies.children.each((c) => {
            const e = c as Enemy;
            if (e.active) e.setTint(0xffffff);
            return true;
          });
        });
        break;

      case 'shield':
        this.shieldUntil = now + def.durationMs!;
        this.showBanner('🛡 SHIELD!');
        break;

      case 'double_damage':
        this.doubleDamageUntil = now + def.durationMs!;
        this.showBanner('💥 DOUBLE DMG!');
        break;

      case 'super_jobboss':
        this.superJobbossUntil = now + def.durationMs!;
        this.showBanner('★ SUPER JOBBOSS! ★');
        this.cameras.main.shake(300, 0.01);
        this.superJobbossBanner.setVisible(true);
        this.tweens.killTweensOf(this.superJobbossBanner);
        this.tweens.add({
          targets: this.superJobbossBanner,
          scaleX: 1.08,
          scaleY: 1.08,
          duration: 400,
          yoyo: true,
          repeat: -1,
        });
        this.time.delayedCall(def.durationMs!, () => {
          if (this.time.now >= this.superJobbossUntil) {
            this.superJobbossBanner.setVisible(false);
            this.tweens.killTweensOf(this.superJobbossBanner);
          }
        });
        break;
    }
  }

  private updatePowerUps(time: number): void {
    // Shield: tint player green while active
    if (time < this.shieldUntil) {
      this.player.setTint(0x88ff88);
    } else {
      this.player.setTint(0xffffff);
    }

    // Center status bar — ONLY timed effects with countdown
    const parts: string[] = [];
    if (this.activeFreeze) parts.push('❄ FREEZE');
    if (time < this.shieldUntil) parts.push(`🛡 SHIELD ${Math.ceil((this.shieldUntil - time) / 1000)}s`);
    if (time < this.doubleDamageUntil) parts.push(`💥 ×2 DMG ${Math.ceil((this.doubleDamageUntil - time) / 1000)}s`);
    if (time < this.superJobbossUntil) parts.push(`★ JOBBOSS ${Math.ceil((this.superJobbossUntil - time) / 1000)}s`);
    this.powerUpStatusText.setText(parts.length ? `[ ${parts.join('  |  ')} ]` : '');
  }

  private endGame(): void {
    this.gameOver = true;
    this.physics.pause();
    const waveReached = Math.max(0, this.waveManager.wave - (this.waveManager.state === 'cleared' ? 0 : 1));
    const score = computeScore(waveReached, this.coinsEarnedTotal);
    this.bannerText.setText(`GAME OVER\nWave ${this.waveManager.wave}  Score ${score}`).setAlpha(1).setFontSize(36);
    this.showGameOverPanel(waveReached, score);
  }

  private showGameOverPanel(waveReached: number, score: number): void {
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55).setDepth(199);
    const panelW = 520;
    const panelH = 440;
    const px = GAME_WIDTH / 2;
    const py = GAME_HEIGHT / 2 + 30;
    const panel = this.add.rectangle(px, py, panelW, panelH, 0x0e1622, 0.96).setStrokeStyle(2, 0x4cd7ff).setDepth(200);

    const title = this.add
      .text(px, py - panelH / 2 + 24, 'HIGH SCORES', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffd23f',
      })
      .setOrigin(0.5)
      .setDepth(201);

    const list = this.add
      .text(px, py - 30, 'loading...', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#cfeaff',
        align: 'left',
      })
      .setOrigin(0.5)
      .setDepth(201);

    const hint = this.add
      .text(px, py + panelH / 2 - 28, 'Click or Space to restart', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#9ec6d6',
      })
      .setOrigin(0.5)
      .setDepth(201);

    void this.handleHighScore(waveReached, score, list);

    const cleanup = () => {
      overlay.destroy();
      panel.destroy();
      title.destroy();
      list.destroy();
      hint.destroy();
      this.scene.start('MenuScene');
    };
    this.input.once('pointerdown', cleanup);
    this.input.keyboard?.once('keydown-SPACE', cleanup);
  }

  private async handleHighScore(
    waveReached: number,
    score: number,
    listText: Phaser.GameObjects.Text,
  ): Promise<void> {
    let scores: Score[] = [];
    try {
      scores = await loadScores(10);
    } catch {
      scores = [];
    }
    const qualifies = scores.length < 10 || score > (scores[scores.length - 1]?.score ?? 0);
    if (qualifies && score > 0) {
      const name = (this.playerName || 'Player').slice(0, 16).trim() || 'Player';
      setLastName(name);
      try {
        scores = await saveScore({
          name,
          score,
          wave: waveReached,
          coins: this.coinsEarnedTotal,
          date: Date.now(),
        }, 20);
      } catch {
        /* fallback already in saveScore */
      }
    }
    const top = scores.slice(0, 10);
    const lines: string[] = [];
    if (top.length === 0) {
      lines.push('No scores yet — be the first!');
    } else {
      top.forEach((s, i) => {
        const rank = `${i + 1}`.padStart(2, ' ');
        const nm = (s.name || 'anon').padEnd(16, ' ').slice(0, 16);
        const sc = `${s.score}`.padStart(6, ' ');
        const wv = `W${s.wave}`.padStart(4, ' ');
        lines.push(`${rank}. ${nm} ${sc} ${wv}`);
      });
    }
    if (this.scene.isActive()) listText.setText(lines.join('\n'));
  }
}
