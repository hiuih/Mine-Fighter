// Pixel Realm Adventures - Original Platformer Game
// Inspired by geometry dash, hollow knight, and terraria aesthetics

class AdventureEngine {
    constructor() {
        this.screenCanvas = document.getElementById('gameCanvas');
        if (!this.screenCanvas) {
            throw new Error('Canvas element with id "gameCanvas" not found');
        }
        this.brush = this.screenCanvas.getContext('2d');
        this.displayWidth = 1920;
        this.displayHeight = 1080;
        this.screenCanvas.width = this.displayWidth;
        this.screenCanvas.height = this.displayHeight;
        
        // Unique game state management
        this.heroEntity = null;
        this.worldTiles = [];
        this.hostileEntities = [];
        this.collectibleItems = [];
        this.attackParticles = [];
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
    
    setupInputHandlers() {
        window.addEventListener('keydown', (evt) => {
            this.pressedButtons.add(evt.code);
            if (evt.code === 'Space') evt.preventDefault();
        });
        
        window.addEventListener('keyup', (evt) => {
            this.pressedButtons.delete(evt.code);
        });
    }
    
    constructGameWorld() {
        const tileSize = 64;
        
        // Create ground level with terraria-style variation - bigger map
        for (let col = 0; col < 120; col++) {
            const baseHeight = 15;
            const variation = Math.sin(col * 0.3) * 2 + Math.cos(col * 0.15) * 1.5;
            const groundLevel = Math.floor(baseHeight + variation);
            
            for (let row = groundLevel; row < 18; row++) {
                this.worldTiles.push({
                    gridX: col,
                    gridY: row,
                    blockType: row === groundLevel ? 'grass' : 'dirt',
                    dimensions: tileSize
                });
            }
        }
        
        // Add floating platforms with unique patterns - more platforms
        const platformConfigs = [
            {startX: 8, y: 11, length: 4},
            {startX: 15, y: 9, length: 5},
            {startX: 23, y: 7, length: 3},
            {startX: 30, y: 10, length: 6},
            {startX: 40, y: 8, length: 4},
            {startX: 48, y: 6, length: 5},
            {startX: 58, y: 9, length: 4},
            {startX: 68, y: 7, length: 6},
            {startX: 80, y: 10, length: 5},
            {startX: 92, y: 8, length: 4},
            {startX: 105, y: 6, length: 5}
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
        
        // Add collectibles - more items for bigger map
        for (let i = 0; i < 30; i++) {
            this.collectibleItems.push({
                xPos: 150 + i * 200 + Math.random() * 80,
                yPos: 300 + Math.random() * 300,
                radius: 12,
                gathered: false,
                sparkle: 0
            });
        }
    }
    
    spawnHeroCharacter() {
        this.heroEntity = {
            xPos: 150,
            yPos: 700,
            velocityX: 0,
            velocityY: 0,
            boxWidth: 48,
            boxHeight: 64,
            canJump: false,
            dashEnergy: 100,
            dashCooldown: 0,
            lifePoints: 100,
            animationPhase: 0,
            facingRight: true,
            invulnerableTime: 0,
            attackCooldown: 0,
            isAttacking: false
        };
    }
    
    generateHostiles() {
        const enemyPositions = [
            {x: 600, y: 850, pattern: 'patrol'},
            {x: 1200, y: 800, pattern: 'jump'},
            {x: 2000, y: 850, pattern: 'patrol'},
            {x: 2800, y: 750, pattern: 'jump'},
            {x: 3500, y: 850, pattern: 'patrol'},
            {x: 4200, y: 800, pattern: 'jump'},
            {x: 5000, y: 850, pattern: 'patrol'},
            {x: 6000, y: 800, pattern: 'jump'}
        ];
        
        enemyPositions.forEach(pos => {
            this.hostileEntities.push({
                xPos: pos.x,
                yPos: pos.y,
                velocityX: 0,
                velocityY: 0,
                boxWidth: 56,
                boxHeight: 56,
                movementPattern: pos.pattern,
                patrolDirection: 1,
                patrolOrigin: pos.x,
                patrolRange: 200,
                animCycle: 0,
                active: true,
                health: 3
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
        
        // Update attack particles
        this.attackParticles = this.attackParticles.filter(particle => {
            particle.life -= dt;
            particle.xPos += particle.velocityX * dt;
            particle.yPos += particle.velocityY * dt;
            particle.velocityY += 800 * dt; // gravity
            return particle.life > 0;
        });
        
        // Check collisions
        this.detectCollisions();
        
        // Update camera to follow hero
        this.updateCameraPosition();
        
        // Update UI
        document.getElementById('scoreDisplay').textContent = this.playerPoints;
        document.getElementById('healthDisplay').textContent = this.heroEntity.lifePoints;
        
        // Reset game if hero dies
        if (this.heroEntity.lifePoints <= 0 || this.heroEntity.yPos > this.displayHeight + 100) {
            if (this.pressedButtons.has('KeyR')) {
                this.resetGameState();
            }
        }
    }
    
    processHeroMovement(dt) {
        const hero = this.heroEntity;
        const moveAccel = 1500;
        const maxHorizontalSpeed = 350;
        const jumpPower = 500;
        const dashForce = 700;
        
        // Horizontal movement - changed to 'a' and 'd' keys
        if (this.pressedButtons.has('KeyA')) {
            hero.velocityX -= moveAccel * dt;
            hero.facingRight = false;
        }
        if (this.pressedButtons.has('KeyD')) {
            hero.velocityX += moveAccel * dt;
            hero.facingRight = true;
        }
        
        // Apply friction - more natural
        hero.velocityX *= 0.88;
        
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
        
        // Attack ability - 'W' key
        if (this.pressedButtons.has('KeyW') && hero.attackCooldown <= 0 && !hero.isAttacking) {
            this.performAttack();
            hero.attackCooldown = 0.5;
            hero.isAttacking = true;
            setTimeout(() => { hero.isAttacking = false; }, 200);
        }
        
        // Regenerate dash (frame-rate independent)
        hero.dashEnergy = Math.min(100, hero.dashEnergy + 30 * dt);
        hero.dashCooldown = Math.max(0, hero.dashCooldown - dt);
        hero.attackCooldown = Math.max(0, hero.attackCooldown - dt);
        
        // Update invulnerability
        hero.invulnerableTime = Math.max(0, hero.invulnerableTime - dt);
        
        hero.animationPhase += Math.abs(hero.velocityX) * 0.01;
    }
    
    
    performAttack() {
        const hero = this.heroEntity;
        const attackRange = 80;
        const attackDir = hero.facingRight ? 1 : -1;
        const attackX = hero.xPos + (hero.facingRight ? hero.boxWidth : 0);
        const attackY = hero.yPos + hero.boxHeight / 2;
        
        // Create attack visual effect
        for (let i = 0; i < 8; i++) {
            this.attackParticles.push({
                xPos: attackX + attackDir * Math.random() * 40,
                yPos: attackY + (Math.random() - 0.5) * 40,
                velocityX: attackDir * (100 + Math.random() * 100),
                velocityY: -50 - Math.random() * 100,
                life: 0.3,
                size: 3 + Math.random() * 4
            });
        }
        
        // Check if attack hits enemies
        this.hostileEntities.forEach(enemy => {
            if (!enemy.active) return;
            
            const distX = enemy.xPos + enemy.boxWidth/2 - attackX;
            const distY = enemy.yPos + enemy.boxHeight/2 - attackY;
            const distance = Math.hypot(distX, distY);
            
            if (distance < attackRange && Math.sign(distX) === attackDir) {
                enemy.health--;
                if (enemy.health <= 0) {
                    enemy.active = false;
                    this.playerPoints += 100;
                } else {
                    this.playerPoints += 25;
                }
                
                // Knockback effect on enemy
                enemy.velocityX = attackDir * 300;
                enemy.velocityY = -200;
            }
        });
    }
    
    applyPhysicsToHero(dt) {
        const hero = this.heroEntity;
        const gravityForce = 1400;
        const terminalVelocity = 700;
        
        // Apply gravity - more natural
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
                    hero.velocityX *= 0.5;
                } else if (minOverlap === overlapRight) {
                    hero.xPos = tileX + tile.dimensions;
                    hero.velocityX *= 0.5;
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
        
        // Clamp camera
        this.cameraOffsetX = Math.max(0, this.cameraOffsetX);
        this.cameraOffsetY = Math.max(-100, Math.min(200, this.cameraOffsetY));
    }
    
    renderGameScene() {
        const ctx = this.brush;
        
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
        
        // Render attack particles
        this.attackParticles.forEach(particle => {
            this.drawAttackParticle(ctx, particle);
        });
        
        ctx.restore();
        
        // Render UI elements
        this.drawGameUI(ctx);
    }
    
    drawParallaxBackground(ctx) {
        const parallaxOffset = this.cameraOffsetX * 0.3;
        
        // Draw distant mountains with better detail
        ctx.fillStyle = '#1a252f';
        for (let i = 0; i < 20; i++) {
            const mountainX = i * 250 - parallaxOffset;
            const mountainHeight = 200 + Math.sin(i * 0.7) * 80;
            ctx.beginPath();
            ctx.moveTo(mountainX, this.displayHeight);
            ctx.lineTo(mountainX + 60, this.displayHeight - mountainHeight);
            ctx.lineTo(mountainX + 120, this.displayHeight - mountainHeight + 40);
            ctx.lineTo(mountainX + 180, this.displayHeight - mountainHeight - 30);
            ctx.lineTo(mountainX + 250, this.displayHeight);
            ctx.closePath();
            ctx.fill();
            
            // Add snow caps
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.moveTo(mountainX + 60, this.displayHeight - mountainHeight);
            ctx.lineTo(mountainX + 70, this.displayHeight - mountainHeight + 20);
            ctx.lineTo(mountainX + 50, this.displayHeight - mountainHeight + 20);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#1a252f';
        }
        
        // Add clouds
        const cloudOffset = this.cameraOffsetX * 0.1;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 8; i++) {
            const cloudX = i * 400 - cloudOffset;
            const cloudY = 100 + Math.sin(i) * 50;
            ctx.beginPath();
            ctx.arc(cloudX, cloudY, 40, 0, Math.PI * 2);
            ctx.arc(cloudX + 30, cloudY - 10, 35, 0, Math.PI * 2);
            ctx.arc(cloudX + 60, cloudY, 40, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawWorldTile(ctx, tile) {
        const x = tile.gridX * tile.dimensions;
        const y = tile.gridY * tile.dimensions;
        const s = tile.dimensions;
        
        if (tile.blockType === 'grass') {
            // Grass top with realistic texture and shading
            const grassGradient = ctx.createLinearGradient(x, y, x, y + s);
            grassGradient.addColorStop(0, '#4CAF50');
            grassGradient.addColorStop(0.3, '#45a049');
            grassGradient.addColorStop(1, '#388E3C');
            ctx.fillStyle = grassGradient;
            ctx.fillRect(x, y, s, s);
            
            // Grass blade layer with shadow
            ctx.fillStyle = '#2E7D32';
            ctx.fillRect(x, y + s - 12, s, 12);
            
            // Detailed grass blades
            ctx.fillStyle = '#66BB6A';
            for (let i = 0; i < 8; i++) {
                const bladeX = x + i * (s / 8) + 2;
                const bladeHeight = 6 + Math.sin(i) * 3;
                ctx.fillRect(bladeX, y + 2, 3, bladeHeight);
                ctx.fillRect(bladeX + 1, y, 1, bladeHeight + 2);
            }
            
            // Ambient occlusion
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(x, y + s - 2, s, 2);
        } else if (tile.blockType === 'dirt') {
            // Dirt with realistic texture and depth
            const dirtGradient = ctx.createLinearGradient(x, y, x, y + s);
            dirtGradient.addColorStop(0, '#8B6F47');
            dirtGradient.addColorStop(0.5, '#6F4E37');
            dirtGradient.addColorStop(1, '#5C3D2E');
            ctx.fillStyle = dirtGradient;
            ctx.fillRect(x, y, s, s);
            
            // Dirt particles and stones
            ctx.fillStyle = '#4A3022';
            for (let i = 0; i < 8; i++) {
                const dx = x + (i % 3) * (s / 3) + Math.random() * 10;
                const dy = y + Math.floor(i / 3) * (s / 3) + Math.random() * 10;
                ctx.fillRect(dx, dy, 8 + Math.random() * 6, 8 + Math.random() * 6);
            }
            
            // Small stones
            ctx.fillStyle = '#8B8B8B';
            for (let i = 0; i < 3; i++) {
                const stoneX = x + Math.random() * s;
                const stoneY = y + Math.random() * s;
                ctx.fillRect(stoneX, stoneY, 4, 4);
            }
        } else if (tile.blockType === 'platform') {
            // Wooden platform with realistic wood grain
            const woodGradient = ctx.createLinearGradient(x, y, x, y + 12);
            woodGradient.addColorStop(0, '#D2691E');
            woodGradient.addColorStop(0.5, '#CD853F');
            woodGradient.addColorStop(1, '#A0522D');
            ctx.fillStyle = woodGradient;
            ctx.fillRect(x, y, s, 12);
            
            // Wood grain details
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x, y + 5, s, 2);
            for (let i = 0; i < 5; i++) {
                ctx.fillRect(x + i * (s / 5), y, 2, 12);
            }
            
            // Wood highlights
            ctx.fillStyle = 'rgba(255, 222, 173, 0.3)';
            ctx.fillRect(x + 2, y + 1, s - 4, 3);
            
            // Shadow underneath
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(x, y + 11, s, 1);
        }
        
        // Add subtle border for depth
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, s, s);
        
        // Add highlight on top edge
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + s, y);
        ctx.stroke();
    }
    
    drawCollectible(ctx, item) {
        item.sparkle += 0.15;
        const pulseSize = 1 + Math.sin(item.sparkle) * 0.25;
        
        // Outer glow with better gradient
        const gradient = ctx.createRadialGradient(item.xPos, item.yPos, 0, item.xPos, item.yPos, item.radius * 3);
        gradient.addColorStop(0, 'rgba(255, 223, 0, 0.9)');
        gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(item.xPos, item.yPos, item.radius * 3 * pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Main coin with metallic effect
        const coinGradient = ctx.createRadialGradient(
            item.xPos - item.radius * 0.3, 
            item.yPos - item.radius * 0.3, 
            0,
            item.xPos, 
            item.yPos, 
            item.radius * pulseSize
        );
        coinGradient.addColorStop(0, '#FFF8DC');
        coinGradient.addColorStop(0.3, '#FFD700');
        coinGradient.addColorStop(0.7, '#DAA520');
        coinGradient.addColorStop(1, '#B8860B');
        ctx.fillStyle = coinGradient;
        ctx.beginPath();
        ctx.arc(item.xPos, item.yPos, item.radius * pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner detail
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.arc(item.xPos, item.yPos, item.radius * 0.6 * pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Shine effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(item.xPos - item.radius * 0.3, item.yPos - item.radius * 0.3, item.radius * 0.3 * pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Sparkles around coin
        for (let i = 0; i < 4; i++) {
            const angle = item.sparkle + (i * Math.PI / 2);
            const sparkleX = item.xPos + Math.cos(angle) * item.radius * 1.5;
            const sparkleY = item.yPos + Math.sin(angle) * item.radius * 1.5;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(sparkleX - 2, sparkleY - 2, 4, 4);
        }
    }
    
    drawHostileEntity(ctx, enemy) {
        const x = enemy.xPos;
        const y = enemy.yPos;
        const w = enemy.boxWidth;
        const h = enemy.boxHeight;
        
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x + w/2, y + h + 5, w * 0.4, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Enemy body with gradient for depth
        const bodyGradient = ctx.createRadialGradient(x + w/2, y + h/3, 0, x + w/2, y + h/2, h/2);
        bodyGradient.addColorStop(0, '#FF5252');
        bodyGradient.addColorStop(0.5, '#E74C3C');
        bodyGradient.addColorStop(1, '#C0392B');
        ctx.fillStyle = bodyGradient;
        ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
        
        // Rounded corners effect
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(x + 10, y + 10, 8, Math.PI, 1.5 * Math.PI);
        ctx.arc(x + w - 10, y + 10, 8, 1.5 * Math.PI, 2 * Math.PI);
        ctx.arc(x + w - 10, y + h - 10, 8, 0, 0.5 * Math.PI);
        ctx.arc(x + 10, y + h - 10, 8, 0.5 * Math.PI, Math.PI);
        ctx.closePath();
        ctx.fill();
        
        // Eyes with animation
        const eyeOffset = Math.sin(enemy.animCycle) * 2;
        const eyeSize = 10;
        
        // White of eyes
        ctx.fillStyle = '#FFF';
        ctx.fillRect(x + 12, y + 16 + eyeOffset, eyeSize, eyeSize);
        ctx.fillRect(x + w - 22, y + 16 + eyeOffset, eyeSize, eyeSize);
        
        // Pupils with slight glow
        const pupilGradient = ctx.createRadialGradient(x + 16, y + 20 + eyeOffset, 0, x + 16, y + 20 + eyeOffset, 4);
        pupilGradient.addColorStop(0, '#FF0000');
        pupilGradient.addColorStop(1, '#000');
        ctx.fillStyle = pupilGradient;
        ctx.fillRect(x + 14, y + 18 + eyeOffset, 6, 6);
        ctx.fillRect(x + w - 20, y + 18 + eyeOffset, 6, 6);
        
        // Spikes on top with gradient
        ctx.fillStyle = '#C0392B';
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(x + 10 + i * 12, y + 6);
            ctx.lineTo(x + 16 + i * 12, y);
            ctx.lineTo(x + 22 + i * 12, y + 6);
            ctx.closePath();
            ctx.fill();
            
            // Highlight on spikes
            ctx.fillStyle = 'rgba(255, 107, 107, 0.5)';
            ctx.beginPath();
            ctx.moveTo(x + 10 + i * 12, y + 6);
            ctx.lineTo(x + 16 + i * 12, y);
            ctx.lineTo(x + 14 + i * 12, y + 4);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#C0392B';
        }
        
        // Health bar
        const healthBarWidth = w - 12;
        const healthPercent = enemy.health / 3;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x + 6, y - 8, healthBarWidth, 4);
        ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : (healthPercent > 0.25 ? '#FFC107' : '#F44336');
        ctx.fillRect(x + 6, y - 8, healthBarWidth * healthPercent, 4);
    }
    
    drawHeroCharacter(ctx) {
        const hero = this.heroEntity;
        const x = hero.xPos;
        const y = hero.yPos;
        const w = hero.boxWidth;
        const h = hero.boxHeight;
        
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x + w/2, y + h + 5, w * 0.4, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Flash effect during invulnerability
        if (hero.invulnerableTime > 0 && Math.floor(hero.invulnerableTime * 10) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // Character body with gradient
        const bodyGradient = ctx.createLinearGradient(x, y + 12, x, y + h);
        bodyGradient.addColorStop(0, '#5DADE2');
        bodyGradient.addColorStop(0.5, '#3498DB');
        bodyGradient.addColorStop(1, '#2874A6');
        ctx.fillStyle = bodyGradient;
        ctx.fillRect(x + 8, y + 16, w - 16, h - 24);
        
        // Belt
        ctx.fillStyle = '#34495E';
        ctx.fillRect(x + 6, y + h - 20, w - 12, 4);
        
        // Arms
        const armSwing = Math.sin(hero.animationPhase) * 4;
        ctx.fillStyle = '#3498DB';
        ctx.fillRect(x + 4, y + 20 + armSwing, 8, 16);
        ctx.fillRect(x + w - 12, y + 20 - armSwing, 8, 16);
        
        // Hands
        ctx.fillStyle = '#F39C12';
        ctx.fillRect(x + 4, y + 34 + armSwing, 8, 6);
        ctx.fillRect(x + w - 12, y + 34 - armSwing, 8, 6);
        
        // Head with gradient
        const headGradient = ctx.createRadialGradient(x + w/2, y + 10, 0, x + w/2, y + 10, 12);
        headGradient.addColorStop(0, '#FFD93D');
        headGradient.addColorStop(0.6, '#F39C12');
        headGradient.addColorStop(1, '#D68910');
        ctx.fillStyle = headGradient;
        ctx.fillRect(x + 10, y + 4, w - 20, 18);
        
        // Hair
        ctx.fillStyle = '#8B4513';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(x + 12 + i * 6, y, 4, 6);
        }
        
        // Eyes with proper animation
        const blinkPhase = Math.floor(this.currentTick / 120) % 20;
        if (blinkPhase < 18) {
            ctx.fillStyle = '#FFF';
            const eyeDir = hero.facingRight ? 2 : -2;
            ctx.fillRect(x + 16 + eyeDir, y + 10, 4, 4);
            ctx.fillRect(x + w - 20 + eyeDir, y + 10, 4, 4);
            
            // Pupils
            ctx.fillStyle = '#000';
            ctx.fillRect(x + 17 + eyeDir, y + 11, 2, 2);
            ctx.fillRect(x + w - 19 + eyeDir, y + 11, 2, 2);
        } else {
            // Closed eyes
            ctx.fillStyle = '#000';
            ctx.fillRect(x + 16, y + 12, 4, 1);
            ctx.fillRect(x + w - 20, y + 12, 4, 1);
        }
        
        // Legs with animation
        const legPhase = Math.sin(hero.animationPhase) * 5;
        ctx.fillStyle = '#2C3E50';
        ctx.fillRect(x + 14, y + h - 12, 8, 12 + Math.abs(legPhase));
        ctx.fillRect(x + w - 22, y + h - 12, 8, 12 - Math.abs(legPhase));
        
        // Shoes
        ctx.fillStyle = '#1C2833';
        ctx.fillRect(x + 12, y + h - 4, 10, 4);
        ctx.fillRect(x + w - 22, y + h - 4, 10, 4);
        
        // Reset alpha
        ctx.globalAlpha = 1.0;
        
        // Attack effect
        if (hero.isAttacking) {
            const attackDir = hero.facingRight ? 1 : -1;
            const attackX = x + (hero.facingRight ? w : -20);
            const attackY = y + h/2 - 10;
            
            // Attack slash
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(attackX, attackY, 30, -0.5 * Math.PI * attackDir, 0.5 * Math.PI * attackDir);
            ctx.stroke();
        }
        
        // Dash effect
        if (hero.dashCooldown > 0) {
            ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
            for (let i = 0; i < 4; i++) {
                const trailX = x - (hero.facingRight ? 1 : -1) * (i * 12);
                ctx.fillRect(trailX, y, w, h);
            }
        }
    }
    
    
    drawAttackParticle(ctx, particle) {
        const alpha = particle.life / 0.3;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(particle.xPos - particle.size/2, particle.yPos - particle.size/2, particle.size, particle.size);
        
        // Add a glow effect
        const glowGradient = ctx.createRadialGradient(particle.xPos, particle.yPos, 0, particle.xPos, particle.yPos, particle.size * 2);
        glowGradient.addColorStop(0, `rgba(52, 152, 219, ${alpha * 0.5})`);
        glowGradient.addColorStop(1, 'rgba(52, 152, 219, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(particle.xPos, particle.yPos, particle.size * 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawGameUI(ctx) {
        const hero = this.heroEntity;
        
        // Dash energy bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(10, this.displayHeight - 70, 200, 25);
        
        const dashColor = hero.dashEnergy >= 50 ? '#3498db' : '#95a5a6';
        ctx.fillStyle = dashColor;
        ctx.fillRect(12, this.displayHeight - 68, (hero.dashEnergy / 100) * 196, 21);
        
        // Add shine effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(12, this.displayHeight - 68, (hero.dashEnergy / 100) * 196, 10);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('DASH', 220, this.displayHeight - 50);
        
        // Attack cooldown indicator
        if (hero.attackCooldown > 0) {
            const cooldownPercent = hero.attackCooldown / 0.5;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(10, this.displayHeight - 40, 200, 25);
            ctx.fillStyle = '#E74C3C';
            ctx.fillRect(12, this.displayHeight - 38, 196 * (1 - cooldownPercent), 21);
            ctx.fillStyle = '#fff';
            ctx.fillText('ATTACK READY', 220, this.displayHeight - 20);
        } else {
            ctx.fillStyle = 'rgba(46, 204, 113, 0.8)';
            ctx.fillRect(10, this.displayHeight - 40, 200, 25);
            ctx.fillStyle = '#fff';
            ctx.fillText('ATTACK READY', 220, this.displayHeight - 20);
        }
        
        // Game over message
        if (hero.lifePoints <= 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, this.displayHeight / 2 - 80, this.displayWidth, 160);
            
            ctx.fillStyle = '#e74c3c';
            ctx.font = 'bold 64px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', this.displayWidth / 2, this.displayHeight / 2);
            
            ctx.font = '24px monospace';
            ctx.fillStyle = '#fff';
            ctx.fillText('Press R to Restart', this.displayWidth / 2, this.displayHeight / 2 + 50);
            ctx.textAlign = 'left';
        }
    }
    
    resetGameState() {
        this.heroEntity.xPos = 150;
        this.heroEntity.yPos = 700;
        this.heroEntity.velocityX = 0;
        this.heroEntity.velocityY = 0;
        this.heroEntity.lifePoints = 100;
        this.heroEntity.dashEnergy = 100;
        this.heroEntity.invulnerableTime = 0;
        this.heroEntity.attackCooldown = 0;
        this.heroEntity.isAttacking = false;
        this.playerPoints = 0;
        this.cameraOffsetX = 0;
        this.cameraOffsetY = 0;
        this.attackParticles = [];
        
        // Reset collectibles
        this.collectibleItems.forEach(item => item.gathered = false);
        
        // Reset enemies
        this.hostileEntities.forEach(enemy => {
            enemy.active = true;
            enemy.health = 3;
        });
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new AdventureEngine();
});
