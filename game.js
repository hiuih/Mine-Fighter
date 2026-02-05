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
        this.currentTick = 0;
        this.playerPoints = 0;
        this.cameraOffsetX = 0;
        this.cameraOffsetY = 0;
        this.attackParticles = [];
        
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
        const tileSize = 48; // Increased from 32 for higher resolution
        
        // Create ground level with terraria-style variation - BIGGER MAP
        for (let col = 0; col < 150; col++) { // Increased from 60
            const baseHeight = 20; // Adjusted for new resolution
            const variation = Math.sin(col * 0.3) * 2;
            const groundLevel = Math.floor(baseHeight + variation);
            
            for (let row = groundLevel; row < 24; row++) {
                this.worldTiles.push({
                    gridX: col,
                    gridY: row,
                    blockType: row === groundLevel ? 'grass' : 'dirt',
                    dimensions: tileSize
                });
            }
        }
        
        // Add floating platforms with unique patterns - MORE VARIETY
        const platformConfigs = [
            {startX: 8, y: 16, length: 4},
            {startX: 15, y: 14, length: 5},
            {startX: 23, y: 12, length: 3},
            {startX: 30, y: 15, length: 6},
            {startX: 40, y: 13, length: 4},
            {startX: 48, y: 11, length: 5},
            {startX: 58, y: 14, length: 4},
            {startX: 68, y: 10, length: 6},
            {startX: 80, y: 12, length: 5},
            {startX: 92, y: 15, length: 4},
            {startX: 105, y: 11, length: 7},
            {startX: 118, y: 13, length: 5},
            {startX: 130, y: 9, length: 6},
            {startX: 142, y: 14, length: 4}
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
        
        // Add collectibles - MORE ITEMS
        for (let i = 0; i < 30; i++) { // Increased from 15
            this.collectibleItems.push({
                xPos: 150 + i * 220 + Math.random() * 80,
                yPos: 300 + Math.random() * 400,
                radius: 12, // Scaled up
                gathered: false,
                sparkle: 0
            });
        }
    }
    
    spawnHeroCharacter() {
        this.heroEntity = {
            xPos: 100,
            yPos: 600,
            velocityX: 0,
            velocityY: 0,
            boxWidth: 36, // Scaled up
            boxHeight: 48, // Scaled up
            canJump: false,
            coyoteTime: 0, // For more natural jump mechanics
            dashEnergy: 100,
            dashCooldown: 0,
            lifePoints: 100,
            animationPhase: 0,
            facingRight: true,
            invulnerableTime: 0,
            attackCooldown: 0,
            isAttacking: false,
            attackTime: 0
        };
    }
    
    generateHostiles() {
        const enemyPositions = [
            {x: 600, y: 750, pattern: 'patrol'},
            {x: 1200, y: 700, pattern: 'jump'},
            {x: 1800, y: 720, pattern: 'patrol'},
            {x: 2400, y: 650, pattern: 'jump'},
            {x: 3000, y: 700, pattern: 'patrol'},
            {x: 3600, y: 680, pattern: 'jump'},
            {x: 4200, y: 720, pattern: 'patrol'},
            {x: 4800, y: 650, pattern: 'jump'},
            {x: 5400, y: 700, pattern: 'patrol'},
            {x: 6000, y: 680, pattern: 'jump'}
        ];
        
        enemyPositions.forEach(pos => {
            this.hostileEntities.push({
                xPos: pos.x,
                yPos: pos.y,
                velocityX: 0,
                velocityY: 0,
                boxWidth: 42, // Scaled up
                boxHeight: 42, // Scaled up
                movementPattern: pos.pattern,
                patrolDirection: 1,
                patrolOrigin: pos.x,
                patrolRange: 200, // Increased range
                animCycle: 0,
                active: true,
                health: 2 // Enemies now have health for attack system
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
        
        // Update attack particles
        this.attackParticles = this.attackParticles.filter(particle => {
            particle.life -= dt;
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            return particle.life > 0;
        });
        
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
        const moveAccel = 1400; // Increased for more responsive controls
        const maxHorizontalSpeed = 300; // Slightly faster
        const jumpPower = 500; // Adjusted for larger scale
        const dashForce = 700; // Adjusted
        
        // Horizontal movement - NOW USING A AND D KEYS
        if (this.pressedButtons.has('KeyA')) {
            hero.velocityX -= moveAccel * dt;
            hero.facingRight = false;
        }
        if (this.pressedButtons.has('KeyD')) {
            hero.velocityX += moveAccel * dt;
            hero.facingRight = true;
        }
        
        // Apply friction - more natural feeling
        const friction = hero.canJump ? 0.82 : 0.95; // Less friction in air
        hero.velocityX *= friction;
        
        // Clamp speed
        hero.velocityX = Math.max(-maxHorizontalSpeed, Math.min(maxHorizontalSpeed, hero.velocityX));
        
        // Coyote time for more natural jumping
        if (hero.canJump) {
            hero.coyoteTime = 0.15; // 150ms grace period
        } else {
            hero.coyoteTime = Math.max(0, hero.coyoteTime - dt);
        }
        
        // Jump mechanics - SPACE KEY
        if (this.pressedButtons.has('Space') && (hero.canJump || hero.coyoteTime > 0)) {
            hero.velocityY = -jumpPower;
            hero.canJump = false;
            hero.coyoteTime = 0;
        }
        
        // Dash ability
        if ((this.pressedButtons.has('ShiftLeft') || this.pressedButtons.has('ShiftRight')) && hero.dashEnergy >= 50 && hero.dashCooldown <= 0) {
            const dashDir = hero.facingRight ? 1 : -1;
            hero.velocityX += dashForce * dashDir;
            hero.dashEnergy -= 50;
            hero.dashCooldown = 1.0;
        }
        
        // Attack function - F KEY
        if (this.pressedButtons.has('KeyF') && hero.attackCooldown <= 0 && !hero.isAttacking) {
            hero.isAttacking = true;
            hero.attackTime = 0.3; // 300ms attack duration
            hero.attackCooldown = 0.5; // 500ms cooldown
            this.performAttack();
        }
        
        // Update attack state
        if (hero.isAttacking) {
            hero.attackTime -= dt;
            if (hero.attackTime <= 0) {
                hero.isAttacking = false;
            }
        }
        
        // Regenerate dash (frame-rate independent)
        hero.dashEnergy = Math.min(100, hero.dashEnergy + 30 * dt);
        hero.dashCooldown = Math.max(0, hero.dashCooldown - dt);
        hero.attackCooldown = Math.max(0, hero.attackCooldown - dt);
        
        // Update invulnerability
        hero.invulnerableTime = Math.max(0, hero.invulnerableTime - dt);
        
        hero.animationPhase += Math.abs(hero.velocityX) * 0.01;
    }
    
    applyPhysicsToHero(dt) {
        const hero = this.heroEntity;
        const gravityForce = 1400; // Adjusted for scale
        const terminalVelocity = 800;
        
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
    
    performAttack() {
        const hero = this.heroEntity;
        const attackRange = 60;
        const attackWidth = 50;
        const attackDir = hero.facingRight ? 1 : -1;
        
        // Create attack hitbox
        const attackX = hero.xPos + (hero.facingRight ? hero.boxWidth : -attackRange);
        const attackY = hero.yPos + hero.boxHeight / 4;
        
        // Create visual particles
        for (let i = 0; i < 8; i++) {
            this.attackParticles.push({
                x: attackX + attackRange / 2,
                y: attackY + attackWidth / 2,
                vx: (Math.random() - 0.5) * 300 + attackDir * 200,
                vy: (Math.random() - 0.5) * 200,
                life: 0.3,
                maxLife: 0.3,
                size: 4 + Math.random() * 4
            });
        }
        
        // Check for enemy hits
        this.hostileEntities.forEach(enemy => {
            if (enemy.active && this.checkBoxOverlap(
                attackX, attackY, attackRange, attackWidth,
                enemy.xPos, enemy.yPos, enemy.boxWidth, enemy.boxHeight
            )) {
                enemy.health--;
                if (enemy.health <= 0) {
                    enemy.active = false;
                    this.playerPoints += 100;
                } else {
                    this.playerPoints += 25;
                }
                
                // Knockback enemy
                const knockbackDir = hero.facingRight ? 1 : -1;
                enemy.xPos += knockbackDir * 30;
                enemy.velocityY = -200;
                
                // Create hit particles
                for (let i = 0; i < 5; i++) {
                    this.attackParticles.push({
                        x: enemy.xPos + enemy.boxWidth / 2,
                        y: enemy.yPos + enemy.boxHeight / 2,
                        vx: (Math.random() - 0.5) * 200,
                        vy: (Math.random() - 0.5) * 200 - 100,
                        life: 0.5,
                        maxLife: 0.5,
                        size: 3
                    });
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
                if (dist < item.radius + 18) {
                    item.gathered = true;
                    this.playerPoints += 100;
                }
            }
        });
        
        // Enemy collisions - only if not attacking
        this.hostileEntities.forEach(enemy => {
            if (enemy.active && this.checkBoxOverlap(
                hero.xPos, hero.yPos, hero.boxWidth, hero.boxHeight,
                enemy.xPos, enemy.yPos, enemy.boxWidth, enemy.boxHeight
            )) {
                if (hero.velocityY > 250 && hero.yPos < enemy.yPos) {
                    // Bounce on enemy
                    enemy.health--;
                    if (enemy.health <= 0) {
                        enemy.active = false;
                        this.playerPoints += 100;
                    }
                    hero.velocityY = -350;
                    this.playerPoints += 50;
                } else if (hero.invulnerableTime <= 0 && !hero.isAttacking) {
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
        
        // Render attack particles
        this.attackParticles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(particle.x - particle.size/2, particle.y - particle.size/2, particle.size, particle.size);
        });
        ctx.globalAlpha = 1.0;
        
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
    
    drawParallaxBackground(ctx) {
        const parallaxOffset = this.cameraOffsetX * 0.3;
        
        // Draw distant mountains with more detail
        ctx.fillStyle = '#1a252f';
        for (let i = 0; i < 20; i++) { // More mountains
            const mountainX = i * 300 - parallaxOffset;
            const mountainHeight = 200 + Math.sin(i * 0.7) * 80;
            ctx.beginPath();
            ctx.moveTo(mountainX, this.displayHeight);
            ctx.lineTo(mountainX + 75, this.displayHeight - mountainHeight);
            ctx.lineTo(mountainX + 150, this.displayHeight - mountainHeight + 50);
            ctx.lineTo(mountainX + 225, this.displayHeight - mountainHeight - 30);
            ctx.lineTo(mountainX + 300, this.displayHeight);
            ctx.closePath();
            ctx.fill();
            
            // Add snow caps
            ctx.fillStyle = '#e8f4f8';
            ctx.beginPath();
            ctx.moveTo(mountainX + 75, this.displayHeight - mountainHeight);
            ctx.lineTo(mountainX + 65, this.displayHeight - mountainHeight + 30);
            ctx.lineTo(mountainX + 85, this.displayHeight - mountainHeight + 30);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#1a252f';
        }
        
        // Add clouds
        const cloudOffset = this.cameraOffsetX * 0.15;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 15; i++) {
            const cloudX = i * 400 - cloudOffset;
            const cloudY = 100 + Math.sin(i * 1.5) * 100;
            ctx.beginPath();
            ctx.arc(cloudX, cloudY, 40, 0, Math.PI * 2);
            ctx.arc(cloudX + 30, cloudY, 50, 0, Math.PI * 2);
            ctx.arc(cloudX + 60, cloudY, 40, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawWorldTile(ctx, tile) {
        const x = tile.gridX * tile.dimensions;
        const y = tile.gridY * tile.dimensions;
        const s = tile.dimensions;
        
        if (tile.blockType === 'grass') {
            // Grass top with realistic texture and gradient
            const grassGradient = ctx.createLinearGradient(x, y, x, y + s);
            grassGradient.addColorStop(0, '#34d058');
            grassGradient.addColorStop(0.3, '#2ecc71');
            grassGradient.addColorStop(1, '#27ae60');
            ctx.fillStyle = grassGradient;
            ctx.fillRect(x, y, s, s);
            
            // Darker bottom section
            ctx.fillStyle = '#1e8449';
            ctx.fillRect(x, y + s - 12, s, 12);
            
            // Grass blades with shadow
            ctx.fillStyle = '#229954';
            for (let i = 0; i < 8; i++) {
                const bladeX = x + i * 6 + Math.random() * 2;
                const bladeHeight = 4 + Math.random() * 4;
                ctx.fillRect(bladeX, y + 2, 2, bladeHeight);
            }
            
            // Highlights
            ctx.fillStyle = 'rgba(144, 238, 144, 0.3)';
            ctx.fillRect(x + 2, y + 2, s - 4, 4);
        } else if (tile.blockType === 'dirt') {
            // Dirt with realistic gradient
            const dirtGradient = ctx.createLinearGradient(x, y, x, y + s);
            dirtGradient.addColorStop(0, '#8b5a2b');
            dirtGradient.addColorStop(0.5, '#8b4513');
            dirtGradient.addColorStop(1, '#654321');
            ctx.fillStyle = dirtGradient;
            ctx.fillRect(x, y, s, s);
            
            // Dirt texture spots
            ctx.fillStyle = 'rgba(101, 67, 33, 0.8)';
            for (let i = 0; i < 6; i++) {
                const spotX = x + (i % 3) * 16 + Math.random() * 6;
                const spotY = y + Math.floor(i / 3) * 24 + Math.random() * 6;
                ctx.fillRect(spotX, spotY, 6, 6);
            }
            
            // Rocks
            ctx.fillStyle = '#555555';
            for (let i = 0; i < 3; i++) {
                const rockX = x + Math.random() * (s - 8);
                const rockY = y + Math.random() * (s - 8);
                ctx.fillRect(rockX, rockY, 4, 4);
            }
        } else if (tile.blockType === 'platform') {
            // Wooden platform with realistic texture
            const woodGradient = ctx.createLinearGradient(x, y, x, y + 12);
            woodGradient.addColorStop(0, '#daa520');
            woodGradient.addColorStop(0.5, '#d2691e');
            woodGradient.addColorStop(1, '#8b4513');
            ctx.fillStyle = woodGradient;
            ctx.fillRect(x, y, s, 12);
            
            // Wood grain
            ctx.strokeStyle = 'rgba(139, 69, 19, 0.6)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.moveTo(x + i * 10, y);
                ctx.lineTo(x + i * 10, y + 12);
                ctx.stroke();
            }
            
            // Nails
            ctx.fillStyle = '#3d3d3d';
            ctx.fillRect(x + 4, y + 3, 3, 3);
            ctx.fillRect(x + s - 7, y + 3, 3, 3);
            
            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(x, y + 12, s, 3);
        }
        
        // Add subtle border for definition
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, s, s);
    }
    
    drawCollectible(ctx, item) {
        item.sparkle += 0.15;
        const pulseSize = 1 + Math.sin(item.sparkle) * 0.2;
        
        // Outer glow with multiple layers
        const outerGradient = ctx.createRadialGradient(item.xPos, item.yPos, 0, item.xPos, item.yPos, item.radius * 3);
        outerGradient.addColorStop(0, 'rgba(255, 223, 0, 0.6)');
        outerGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.3)');
        outerGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = outerGradient;
        ctx.beginPath();
        ctx.arc(item.xPos, item.yPos, item.radius * 3 * pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner coin with gradient
        const coinGradient = ctx.createRadialGradient(
            item.xPos - item.radius * 0.3, item.yPos - item.radius * 0.3, 
            0, item.xPos, item.yPos, item.radius
        );
        coinGradient.addColorStop(0, '#fff4cc');
        coinGradient.addColorStop(0.4, '#ffd700');
        coinGradient.addColorStop(1, '#b8860b');
        ctx.fillStyle = coinGradient;
        ctx.beginPath();
        ctx.arc(item.xPos, item.yPos, item.radius * pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Center detail
        ctx.fillStyle = '#ff8c00';
        ctx.beginPath();
        ctx.arc(item.xPos, item.yPos, item.radius * 0.5 * pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Sparkle effect
        const sparkleAngle = item.sparkle * 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 4; i++) {
            const angle = sparkleAngle + (i * Math.PI / 2);
            const sx = item.xPos + Math.cos(angle) * item.radius * 0.7;
            const sy = item.yPos + Math.sin(angle) * item.radius * 0.7;
            ctx.fillRect(sx - 1, sy - 1, 2, 2);
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
        ctx.ellipse(x + w/2, y + h + 4, w/2, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Enemy body with gradient (more realistic)
        const bodyGradient = ctx.createRadialGradient(
            x + w/3, y + h/3,
            w * 0.1,
            x + w/2, y + h/2,
            w * 0.7
        );
        bodyGradient.addColorStop(0, '#ff6b6b');
        bodyGradient.addColorStop(0.5, '#e74c3c');
        bodyGradient.addColorStop(1, '#c0392b');
        ctx.fillStyle = bodyGradient;
        ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
        
        // Eyes with glow
        const eyeOffset = Math.sin(enemy.animCycle) * 2;
        
        // Eye glow
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(x + 12, y + 15 + eyeOffset, 8, 0, Math.PI * 2);
        ctx.arc(x + w - 12, y + 15 + eyeOffset, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye whites
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 10, y + 13 + eyeOffset, 8, 8);
        ctx.fillRect(x + w - 18, y + 13 + eyeOffset, 8, 8);
        
        // Pupils
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x + 13, y + 16 + eyeOffset, 4, 4);
        ctx.fillRect(x + w - 15, y + 16 + eyeOffset, 4, 4);
        
        // Spikes with shading
        ctx.fillStyle = '#c0392b';
        for (let i = 0; i < 4; i++) {
            const spikeX = x + 8 + i * 10;
            ctx.fillRect(spikeX, y + 2, 6, 6);
        }
        
        ctx.fillStyle = '#8b0000';
        for (let i = 0; i < 4; i++) {
            const spikeX = x + 8 + i * 10;
            ctx.fillRect(spikeX + 3, y + 2, 3, 3);
        }
        
        // Health indicator
        if (enemy.health === 1) {
            ctx.fillStyle = 'rgba(231, 76, 60, 0.5)';
            ctx.fillRect(x, y - 8, w, 4);
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(x, y - 8, w / 2, 4);
        }
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
        ctx.ellipse(x + w/2, y + h + 4, w/2, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Flash effect during invulnerability
        if (hero.invulnerableTime > 0 && Math.floor(hero.invulnerableTime * 10) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // Character body with realistic gradient
        const bodyGradient = ctx.createLinearGradient(x, y + 12, x, y + h);
        bodyGradient.addColorStop(0, '#5dade2');
        bodyGradient.addColorStop(0.5, '#3498db');
        bodyGradient.addColorStop(1, '#2874a6');
        ctx.fillStyle = bodyGradient;
        ctx.fillRect(x + 6, y + 12, w - 12, h - 18);
        
        // Body highlights
        ctx.fillStyle = 'rgba(174, 214, 241, 0.4)';
        ctx.fillRect(x + 8, y + 14, w - 16, 6);
        
        // Head with gradient
        const headGradient = ctx.createRadialGradient(x + w/2 - 3, y + 5, 2, x + w/2, y + 8, w/2);
        headGradient.addColorStop(0, '#ffc34d');
        headGradient.addColorStop(0.6, '#f39c12');
        headGradient.addColorStop(1, '#d68910');
        ctx.fillStyle = headGradient;
        ctx.fillRect(x + 8, y + 3, w - 16, 14);
        
        // Hair detail
        ctx.fillStyle = '#d68910';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(x + 10 + i * 6, y, 4, 4);
        }
        
        // Eyes
        const blinkPhase = Math.floor(this.currentTick / 120) % 20;
        if (blinkPhase < 18) {
            ctx.fillStyle = '#000';
            const eyeDir = hero.facingRight ? 3 : -3;
            // Left eye
            ctx.fillRect(x + 13 + eyeDir, y + 9, 3, 3);
            // Right eye
            ctx.fillRect(x + w - 16 + eyeDir, y + 9, 3, 3);
            
            // Eye shine
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(x + 14 + eyeDir, y + 9, 1, 1);
            ctx.fillRect(x + w - 15 + eyeDir, y + 9, 1, 1);
        }
        
        // Legs with realistic shading (animated)
        const legPhase = Math.sin(hero.animationPhase) * 4;
        const legGradient = ctx.createLinearGradient(x, y + h - 10, x, y + h + 10);
        legGradient.addColorStop(0, '#34495e');
        legGradient.addColorStop(1, '#2c3e50');
        ctx.fillStyle = legGradient;
        ctx.fillRect(x + 10, y + h - 8, 6, 8 + Math.abs(legPhase));
        ctx.fillRect(x + w - 16, y + h - 8, 6, 8 - Math.abs(legPhase));
        
        // Reset alpha
        ctx.globalAlpha = 1.0;
        
        // Attack effect
        if (hero.isAttacking) {
            const attackDir = hero.facingRight ? 1 : -1;
            const attackX = x + (hero.facingRight ? w : -30);
            const attackY = y + h / 4;
            
            // Attack slash
            ctx.strokeStyle = 'rgba(255, 200, 0, 0.8)';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            const slashProgress = (0.3 - hero.attackTime) / 0.3;
            const startAngle = hero.facingRight ? -Math.PI / 4 : Math.PI + Math.PI / 4;
            const endAngle = startAngle + (attackDir * Math.PI / 2 * slashProgress);
            ctx.arc(attackX, attackY + 20, 35, startAngle, endAngle);
            ctx.stroke();
            
            // Inner slash
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(attackX, attackY + 20, 30, startAngle, endAngle);
            ctx.stroke();
        }
        
        // Dash effect with trail
        if (hero.dashCooldown > 0) {
            ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
            for (let i = 0; i < 5; i++) {
                const trailX = x - (hero.facingRight ? 1 : -1) * (i * 10);
                const trailAlpha = 0.3 * (1 - i / 5);
                ctx.globalAlpha = trailAlpha;
                ctx.fillRect(trailX, y, w, h);
            }
            ctx.globalAlpha = 1.0;
        }
    }
    
    drawGameUI(ctx) {
        const hero = this.heroEntity;
        
        // Dash energy bar with better styling
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(15, this.displayHeight - 80, 220, 30);
        
        const dashColor = hero.dashEnergy >= 50 ? '#3498db' : '#95a5a6';
        const dashGradient = ctx.createLinearGradient(17, this.displayHeight - 78, 17, this.displayHeight - 52);
        dashGradient.addColorStop(0, dashColor);
        dashGradient.addColorStop(1, hero.dashEnergy >= 50 ? '#3498dbaa' : '#95a5a6aa');
        ctx.fillStyle = dashGradient;
        ctx.fillRect(17, this.displayHeight - 78, (hero.dashEnergy / 100) * 216, 26);
        
        // Dash bar border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(15, this.displayHeight - 80, 220, 30);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('DASH', 245, this.displayHeight - 58);
        
        // Attack cooldown indicator
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(15, this.displayHeight - 130, 220, 30);
        
        const attackReady = hero.attackCooldown <= 0;
        const attackColor = attackReady ? '#27ae60' : '#e74c3c';
        const attackProgress = attackReady ? 1 : (0.5 - hero.attackCooldown) / 0.5;
        ctx.fillStyle = attackColor;
        ctx.fillRect(17, this.displayHeight - 128, Math.max(0, attackProgress * 216), 26);
        
        // Attack bar border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(15, this.displayHeight - 130, 220, 30);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('ATTACK', 245, this.displayHeight - 108);
        
        // Game over message
        if (hero.lifePoints <= 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, this.displayHeight / 2 - 80, this.displayWidth, 160);
            
            ctx.fillStyle = '#e74c3c';
            ctx.font = 'bold 64px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', this.displayWidth / 2, this.displayHeight / 2);
            
            ctx.font = '28px monospace';
            ctx.fillStyle = '#fff';
            ctx.fillText('Press R to Restart', this.displayWidth / 2, this.displayHeight / 2 + 50);
            ctx.textAlign = 'left';
        }
    }
    
    resetGameState() {
        this.heroEntity.xPos = 100;
        this.heroEntity.yPos = 600;
        this.heroEntity.velocityX = 0;
        this.heroEntity.velocityY = 0;
        this.heroEntity.lifePoints = 100;
        this.heroEntity.dashEnergy = 100;
        this.heroEntity.invulnerableTime = 0;
        this.heroEntity.attackCooldown = 0;
        this.heroEntity.isAttacking = false;
        this.heroEntity.attackTime = 0;
        this.playerPoints = 0;
        this.cameraOffsetX = 0;
        this.cameraOffsetY = 0;
        
        // Reset collectibles
        this.collectibleItems.forEach(item => item.gathered = false);
        
        // Reset enemies
        this.hostileEntities.forEach(enemy => {
            enemy.active = true;
            enemy.health = 2;
        });
        
        // Clear particles
        this.attackParticles = [];
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new AdventureEngine();
});
