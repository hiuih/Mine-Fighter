// Pixel Realm Adventures - Original Platformer Gameasdfasdf
// Inspired by geometry dash, hollow knight, and terraria aesthetics

class AdventureEngine {
    constructor() {
        this.screenCanvas = document.getElementById('gameCanvas');
        if (!this.screenCanvas) {
            throw new Error('Canvas element with id "gameCanvas" not found');
        }
        this.brush = this.screenCanvas.getContext('2d');
        
        // Fullscreen setup
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Game state management
        this.gameState = 'START'; // 'START', 'PLAYING', 'GAME_OVER'
        this.heroEntity = null;
        this.worldTiles = [];
        this.hostileEntities = [];
        this.collectibleItems = [];
        this.currentTick = 0;
        this.playerPoints = 0;
        this.cameraOffsetX = 0;
        this.cameraOffsetY = 0;
        
        // Custom input system
        this.pressedButtons = new Set();
        this.setupInputHandlers();
        
        // Initialize world
        this.constructGameWorld();
        this.spawnHeroCharacter();
        this.generateHostiles();
        
        // Start the unique game cycle
        this.previousTimestamp = performance.now();
        this.runGameCycle();
    }

    resize() {
        this.displayWidth = window.innerWidth;
        this.displayHeight = window.innerHeight;
        this.screenCanvas.width = this.displayWidth;
        this.screenCanvas.height = this.displayHeight;
    }
    
    setupInputHandlers() {
        window.addEventListener('keydown', (evt) => {
            if (this.gameState === 'START' && evt.code === 'Enter') {
                this.gameState = 'PLAYING';
            }
            if (this.gameState === 'GAME_OVER' && evt.code === 'KeyR') {
                this.resetGameState();
                this.gameState = 'PLAYING';
            }
            this.pressedButtons.add(evt.code);
            if (evt.code === 'Space') evt.preventDefault();
        });
        
        window.addEventListener('keyup', (evt) => {
            this.pressedButtons.delete(evt.code);
        });
    }
    
    constructGameWorld() {
        const tileSize = 32;
        
        // Create ground level with terraria-style variation
        for (let col = 0; col < 60; col++) {
            const baseHeight = 18;
            const variation = Math.sin(col * 0.3) * 2;
            const groundLevel = Math.floor(baseHeight + variation);
            
            for (let row = groundLevel; row < 20; row++) {
                this.worldTiles.push({
                    gridX: col,
                    gridY: row,
                    blockType: row === groundLevel ? 'grass' : 'dirt',
                    dimensions: tileSize
                });
            }
        }
        
        // Add floating platforms with unique patterns
        const platformConfigs = [
            {startX: 8, y: 14, length: 4},
            {startX: 15, y: 12, length: 5},
            {startX: 23, y: 10, length: 3},
            {startX: 30, y: 13, length: 6},
            {startX: 40, y: 11, length: 4},
            {startX: 48, y: 9, length: 5}
        ];
        
        platformConfigs.forEach(config => {
            for (let i = 0; i < config.length; i++) {
                this.worldTiles.push({
                    gridX: config.startX + i,
                    gridY: config.y,
                    blockType: 'platform',
                    dimensions: tileSize
                });
            }
        });
        
        // Add collectibles
        for (let i = 0; i < 15; i++) {
            this.collectibleItems.push({
                xPos: 100 + i * 120 + Math.random() * 50,
                yPos: 200 + Math.random() * 200,
                radius: 8,
                gathered: false,
                sparkle: 0
            });
        }
    }
    
    spawnHeroCharacter() {
        this.heroEntity = {
            xPos: 100,
            yPos: 400,
            velocityX: 0,
            velocityY: 0,
            boxWidth: 24,
            boxHeight: 32,
            canJump: false,
            dashEnergy: 100,
            dashCooldown: 0,
            lifePoints: 100,
            animationPhase: 0,
            facingRight: true,
            invulnerableTime: 0
        };
    }
    
    generateHostiles() {
        const enemyPositions = [
            {x: 400, y: 500, pattern: 'patrol'},
            {x: 800, y: 450, pattern: 'jump'},
            {x: 1200, y: 480, pattern: 'patrol'},
            {x: 1600, y: 420, pattern: 'jump'}
        ];
        
        enemyPositions.forEach(pos => {
            this.hostileEntities.push({
                xPos: pos.x,
                yPos: pos.y,
                velocityX: 0,
                velocityY: 0,
                boxWidth: 28,
                boxHeight: 28,
                movementPattern: pos.pattern,
                patrolDirection: 1,
                patrolOrigin: pos.x,
                patrolRange: 150,
                animCycle: 0,
                active: true
            });
        });
    }
    
    runGameCycle() {
        const nowTimestamp = performance.now();
        const deltaTime = (nowTimestamp - this.previousTimestamp) / 1000;
        this.previousTimestamp = nowTimestamp;
        
        this.updateGameLogic(deltaTime);
        this.renderGameScene();
        
        requestAnimationFrame(() => this.runGameCycle());
    }
    
    updateGameLogic(dt) {
        if (this.gameState !== 'PLAYING') return;

        this.currentTick++;
        
        // Update hero character
        this.processHeroMovement(dt);
        this.applyPhysicsToHero(dt);
        
        // Update enemies
        this.hostileEntities.forEach(enemy => {
            if (enemy.active) {
                this.updateHostileBehavior(enemy, dt);
            }
        });
        
        // Check collisions
        this.detectCollisions();
        
        // Update camera to follow hero
        this.updateCameraPosition();
        
        // Update UI
        const scoreDisp = document.getElementById('scoreDisplay');
        const healthDisp = document.getElementById('healthDisplay');
        if (scoreDisp) scoreDisp.textContent = this.playerPoints;
        if (healthDisp) healthDisp.textContent = this.heroEntity.lifePoints;
        
        // Reset game if hero dies
        if (this.heroEntity.lifePoints <= 0 || this.heroEntity.yPos > this.displayHeight + 500) {
            this.gameState = 'GAME_OVER';
        }
    }
    
    processHeroMovement(dt) {
        const hero = this.heroEntity;
        const moveAccel = 1200;
        const maxHorizontalSpeed = 250;
        const jumpPower = 420;
        const dashForce = 600;
        
        // Horizontal movement
        if (this.pressedButtons.has('ArrowLeft')) {
            hero.velocityX -= moveAccel * dt;
            hero.facingRight = false;
        }
        if (this.pressedButtons.has('ArrowRight')) {
            hero.velocityX += moveAccel * dt;
            hero.facingRight = true;
        }
        
        // Apply friction
        hero.velocityX *= 0.85;
        
        // Clamp speed
        hero.velocityX = Math.max(-maxHorizontalSpeed, Math.min(maxHorizontalSpeed, hero.velocityX));
        
        // Jump mechanics
        if (this.pressedButtons.has('Space') && hero.canJump) {
            hero.velocityY = -jumpPower;
            hero.canJump = false;
        }
        
        // Dash ability
        if ((this.pressedButtons.has('ShiftLeft') || this.pressedButtons.has('ShiftRight')) && hero.dashEnergy >= 50 && hero.dashCooldown <= 0) {
            const dashDir = hero.facingRight ? 1 : -1;
            hero.velocityX += dashForce * dashDir;
            hero.dashEnergy -= 50;
            hero.dashCooldown = 1.0;
        }
        
        // Regenerate dash (frame-rate independent)
        hero.dashEnergy = Math.min(100, hero.dashEnergy + 30 * dt);
        hero.dashCooldown = Math.max(0, hero.dashCooldown - dt);
        
        // Update invulnerability
        hero.invulnerableTime = Math.max(0, hero.invulnerableTime - dt);
        
        hero.animationPhase += Math.abs(hero.velocityX) * 0.01;
    }
    
    applyPhysicsToHero(dt) {
        const hero = this.heroEntity;
        const gravityForce = 1200;
        const terminalVelocity = 600;
        
        // Apply gravity
        hero.velocityY += gravityForce * dt;
        hero.velocityY = Math.min(terminalVelocity, hero.velocityY);
        
        // Update position
        hero.xPos += hero.velocityX * dt;
        hero.yPos += hero.velocityY * dt;
        
        // Check terrain collisions
        hero.canJump = false;
        
        this.worldTiles.forEach(tile => {
            const tileX = tile.gridX * tile.dimensions;
            const tileY = tile.gridY * tile.dimensions;
            
            if (this.checkBoxOverlap(
                hero.xPos, hero.yPos, hero.boxWidth, hero.boxHeight,
                tileX, tileY, tile.dimensions, tile.dimensions
            )) {
                // Resolve collision
                const overlapLeft = (hero.xPos + hero.boxWidth) - tileX;
                const overlapRight = (tileX + tile.dimensions) - hero.xPos;
                const overlapTop = (hero.yPos + hero.boxHeight) - tileY;
                const overlapBottom = (tileY + tile.dimensions) - hero.yPos;
                
                const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                
                if (minOverlap === overlapTop && hero.velocityY > 0) {
                    hero.yPos = tileY - hero.boxHeight;
                    hero.velocityY = 0;
                    hero.canJump = true;
                } else if (minOverlap === overlapBottom && hero.velocityY < 0) {
                    hero.yPos = tileY + tile.dimensions;
                    hero.velocityY = 0;
                } else if (minOverlap === overlapLeft) {
                    hero.xPos = tileX - hero.boxWidth;
                    hero.velocityX = 0;
                } else if (minOverlap === overlapRight) {
                    hero.xPos = tileX + tile.dimensions;
                    hero.velocityX = 0;
                }
            }
        });
    }
    
    updateHostileBehavior(enemy, dt) {
        enemy.animCycle += 0.1;
        
        if (enemy.movementPattern === 'patrol') {
            const distFromOrigin = enemy.xPos - enemy.patrolOrigin;
            
            if (Math.abs(distFromOrigin) > enemy.patrolRange) {
                enemy.patrolDirection *= -1;
            }
            
            enemy.xPos += enemy.patrolDirection * 80 * dt;
        } else if (enemy.movementPattern === 'jump') {
            enemy.velocityY += 800 * dt;
            enemy.yPos += enemy.velocityY * dt;
            
            // Check ground collision
            this.worldTiles.forEach(tile => {
                const tileX = tile.gridX * tile.dimensions;
                const tileY = tile.gridY * tile.dimensions;
                
                if (this.checkBoxOverlap(
                    enemy.xPos, enemy.yPos, enemy.boxWidth, enemy.boxHeight,
                    tileX, tileY, tile.dimensions, tile.dimensions
                )) {
                    if (enemy.velocityY > 0) {
                        enemy.yPos = tileY - enemy.boxHeight;
                        enemy.velocityY = -300 - Math.random() * 150;
                    }
                }
            });
        }
    }
    
    detectCollisions() {
        const hero = this.heroEntity;
        
        // Collectibles
        this.collectibleItems.forEach(item => {
            if (!item.gathered) {
                const dist = Math.hypot(hero.xPos + hero.boxWidth/2 - item.xPos, 
                                       hero.yPos + hero.boxHeight/2 - item.yPos);
                if (dist < item.radius + 12) {
                    item.gathered = true;
                    this.playerPoints += 100;
                }
            }
        });
        
        // Enemy collisions
        this.hostileEntities.forEach(enemy => {
            if (enemy.active && this.checkBoxOverlap(
                hero.xPos, hero.yPos, hero.boxWidth, hero.boxHeight,
                enemy.xPos, enemy.yPos, enemy.boxWidth, enemy.boxHeight
            )) {
                if (hero.velocityY > 200 && hero.yPos < enemy.yPos) {
                    // Bounce on enemy
                    enemy.active = false;
                    hero.velocityY = -300;
                    this.playerPoints += 50;
                } else if (hero.invulnerableTime <= 0) {
                    // Take damage with invulnerability frames
                    hero.lifePoints -= 10;
                    hero.invulnerableTime = 1.5; // 1.5 seconds of invulnerability
                    // Knockback
                    const knockbackDir = hero.xPos < enemy.xPos ? -1 : 1;
                    hero.velocityX = knockbackDir * 200;
                }
            }
        });
    }
    
    checkBoxOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }
    
    updateCameraPosition() {
        const hero = this.heroEntity;
        const targetX = hero.xPos - this.displayWidth / 2 + hero.boxWidth / 2;
        const targetY = hero.yPos - this.displayHeight / 2 + hero.boxHeight / 2;
        
        // Smooth camera following
        this.cameraOffsetX += (targetX - this.cameraOffsetX) * 0.1;
        this.cameraOffsetY += (targetY - this.cameraOffsetY) * 0.05;
        
        // Clamp camera (Adjusted for fullscreen)
        this.cameraOffsetX = Math.max(0, this.cameraOffsetX);
        this.cameraOffsetY = Math.max(-500, Math.min(500, this.cameraOffsetY));
    }
    
    renderGameScene() {
        const ctx = this.brush;
        
        if (this.gameState === 'START') {
            this.drawStartMenu(ctx);
            return;
        }

        // Clear screen with sky gradient
        const skyGradient = ctx.createLinearGradient(0, 0, 0, this.displayHeight);
        skyGradient.addColorStop(0, '#2c3e50');
        skyGradient.addColorStop(1, '#34495e');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);
        
        // Save context for camera
        ctx.save();
        ctx.translate(-this.cameraOffsetX, -this.cameraOffsetY);
        
        // Render parallax background elements
        this.drawParallaxBackground(ctx);
        
        // Render world tiles (terraria style)
        this.worldTiles.forEach(tile => {
            this.drawWorldTile(ctx, tile);
        });
        
        // Render collectibles
        this.collectibleItems.forEach(item => {
            if (!item.gathered) {
                this.drawCollectible(ctx, item);
            }
        });
        
        // Render enemies
        this.hostileEntities.forEach(enemy => {
            if (enemy.active) {
                this.drawHostileEntity(ctx, enemy);
            }
        });
        
        // Render hero character
        this.drawHeroCharacter(ctx);
        
        ctx.restore();
        
        // Render UI elements
        this.drawGameUI(ctx);
    }

    drawStartMenu(ctx) {
        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);

        // Title
        ctx.fillStyle = '#e94560';
        ctx.font = 'bold 48px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PIXEL REALM ADVENTURES', this.displayWidth / 2, this.displayHeight / 2 - 40);

        // Instructions
        ctx.fillStyle = '#fff';
        ctx.font = '20px "Courier New", monospace';
        ctx.fillText('Press ENTER to Start', this.displayWidth / 2, this.displayHeight / 2 + 40);
        
        ctx.font = '16px "Courier New", monospace';
        ctx.fillStyle = '#95a5a6';
        ctx.fillText('Arrows: Move | Space: Jump | Shift: Dash', this.displayWidth / 2, this.displayHeight / 2 + 80);
    }
    
    drawParallaxBackground(ctx) {
        const parallaxOffset = this.cameraOffsetX * 0.3;
        
        // Draw distant mountains
        ctx.fillStyle = '#1a252f';
        for (let i = 0; i < 10; i++) {
            const mountainX = i * 200 - parallaxOffset;
            const mountainHeight = 150 + Math.sin(i * 0.7) * 50;
            ctx.beginPath();
            ctx.moveTo(mountainX, this.displayHeight);
            ctx.lineTo(mountainX + 50, this.displayHeight - mountainHeight);
            ctx.lineTo(mountainX + 100, this.displayHeight - mountainHeight + 30);
            ctx.lineTo(mountainX + 150, this.displayHeight - mountainHeight - 20);
            ctx.lineTo(mountainX + 200, this.displayHeight);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    drawWorldTile(ctx, tile) {
        const x = tile.gridX * tile.dimensions;
        const y = tile.gridY * tile.dimensions;
        const s = tile.dimensions;
        
        if (tile.blockType === 'grass') {
            // Grass top with texture
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(x, y, s, s);
            ctx.fillStyle = '#27ae60';
            ctx.fillRect(x, y + s - 8, s, 8);
            // Grass detail
            ctx.fillStyle = '#229954';
            for (let i = 0; i < 5; i++) {
                ctx.fillRect(x + i * 7, y + 2, 2, 4);
            }
        } else if (tile.blockType === 'dirt') {
            // Dirt with texture
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(x, y, s, s);
            ctx.fillStyle = '#654321';
            // Dirt spots
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(x + (i % 2) * 16 + 4, y + Math.floor(i / 2) * 16 + 4, 6, 6);
            }
        } else if (tile.blockType === 'platform') {
            // Wooden platform
            ctx.fillStyle = '#d2691e';
            ctx.fillRect(x, y, s, 8);
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(x, y + 4, s, 2);
            // Wood grain
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(x + i * 12, y, 2, 8);
            }
        }
        
        // Add border for pixel art look
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, s, s);
    }
    
    drawCollectible(ctx, item) {
        item.sparkle += 0.15;
        const pulseSize = 1 + Math.sin(item.sparkle) * 0.2;
        
        // Outer glow
        const gradient = ctx.createRadialGradient(item.xPos, item.yPos, 0, item.xPos, item.yPos, item.radius * 2);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(item.xPos, item.yPos, item.radius * 2 * pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner coin
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(item.xPos, item.yPos, item.radius * pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ff8c00';
        ctx.beginPath();
        ctx.arc(item.xPos, item.yPos, item.radius * 0.6 * pulseSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawHostileEntity(ctx, enemy) {
        const x = enemy.xPos;
        const y = enemy.yPos;
        const w = enemy.boxWidth;
        const h = enemy.boxHeight;
        
        // Enemy body (pixel art style)
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
        
        // Eyes
        const eyeOffset = Math.sin(enemy.animCycle) * 2;
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 8, y + 10 + eyeOffset, 6, 6);
        ctx.fillRect(x + w - 14, y + 10 + eyeOffset, 6, 6);
        
        ctx.fillStyle = '#000';
        ctx.fillRect(x + 10, y + 12 + eyeOffset, 3, 3);
        ctx.fillRect(x + w - 12, y + 12 + eyeOffset, 3, 3);
        
        // Spikes
        ctx.fillStyle = '#c0392b';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(x + 6 + i * 8, y, 4, 4);
        }
    }
    
    drawHeroCharacter(ctx) {
        const hero = this.heroEntity;
        const x = hero.xPos;
        const y = hero.yPos;
        const w = hero.boxWidth;
        const h = hero.boxHeight;
        
        // Flash effect during invulnerability
        if (hero.invulnerableTime > 0 && Math.floor(hero.invulnerableTime * 10) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // Character body (pixel art style)
        ctx.fillStyle = '#3498db';
        ctx.fillRect(x + 4, y + 8, w - 8, h - 12);
        
        // Head
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(x + 6, y + 2, w - 12, 10);
        
        // Eyes
        const blinkPhase = Math.floor(this.currentTick / 120) % 20;
        if (blinkPhase < 18) {
            ctx.fillStyle = '#000';
            const eyeDir = hero.facingRight ? 2 : -2;
            ctx.fillRect(x + 10 + eyeDir, y + 6, 2, 2);
            ctx.fillRect(x + w - 12 + eyeDir, y + 6, 2, 2);
        }
        
        // Legs (animated)
        const legPhase = Math.sin(hero.animationPhase) * 3;
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(x + 8, y + h - 6, 4, 6 + Math.abs(legPhase));
        ctx.fillRect(x + w - 12, y + h - 6, 4, 6 - Math.abs(legPhase));
        
        // Reset alpha
        ctx.globalAlpha = 1.0;
        
        // Dash effect
        if (hero.dashCooldown > 0) {
            ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
            for (let i = 0; i < 3; i++) {
                const trailX = x - (hero.facingRight ? 1 : -1) * (i * 8);
                ctx.fillRect(trailX, y, w, h);
            }
        }
    }
    
    drawGameUI(ctx) {
        const hero = this.heroEntity;
        
        // Dash energy bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(20, 70, 150, 20);
        
        const dashColor = hero.dashEnergy >= 50 ? '#3498db' : '#95a5a6';
        ctx.fillStyle = dashColor;
        ctx.fillRect(22, 72, (hero.dashEnergy / 100) * 146, 16);
        
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('DASH', 180, 85);
        
        // Game over message
        if (this.gameState === 'GAME_OVER') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, this.displayHeight / 2 - 50, this.displayWidth, 100);
            
            ctx.fillStyle = '#e74c3c';
            ctx.font = 'bold 36px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', this.displayWidth / 2, this.displayHeight / 2);
            
            ctx.font = '18px monospace';
            ctx.fillStyle = '#fff';
            ctx.fillText('Press R to Restart', this.displayWidth / 2, this.displayHeight / 2 + 30);
        }
    }
    
    resetGameState() {
        this.heroEntity.xPos = 100;
        this.heroEntity.yPos = 400;
        this.heroEntity.velocityX = 0;
        this.heroEntity.velocityY = 0;
        this.heroEntity.lifePoints = 100;
        this.heroEntity.dashEnergy = 100;
        this.heroEntity.invulnerableTime = 0;
        this.playerPoints = 0;
        this.cameraOffsetX = 0;
        this.cameraOffsetY = 0;
        
        // Reset collectibles
        this.collectibleItems.forEach(item => item.gathered = false);
        
        // Reset enemies
        this.hostileEntities.forEach(enemy => enemy.active = true);
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new AdventureEngine();
});
