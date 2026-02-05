// Pixel Realm Adventures - Original Platformer Game
// Inspired by geometry dash, hollow knight, and terraria aesthetics

class AdventureEngine {
    constructor() {
        this.screenCanvas = document.getElementById('gameCanvas');
        if (!this.screenCanvas) {
            throw new Error('Canvas element with id "gameCanvas" not found');
        }
        this.brush = this.screenCanvas.getContext('2d');
        this.displayWidth = 1280;
        this.displayHeight = 720;
        this.screenCanvas.width = this.displayWidth;
        this.screenCanvas.height = this.displayHeight;
        
        // Unique game state management
        this.heroEntity = null;
        this.worldTiles = [];
        this.hostileEntities = [];
        this.collectibleItems = [];
        this.projectiles = [];
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
        const tileSize = 32;
        
        // Create ground level with terraria-style variation - much bigger map
        for (let col = 0; col < 150; col++) {
            const baseHeight = 20;
            const variation = Math.sin(col * 0.3) * 2 + Math.cos(col * 0.15) * 1.5;
            const groundLevel = Math.floor(baseHeight + variation);
            
            for (let row = groundLevel; row < 23; row++) {
                this.worldTiles.push({
                    gridX: col,
                    gridY: row,
                    blockType: row === groundLevel ? 'grass' : 'dirt',
                    dimensions: tileSize
                });
            }
        }
        
        // Add floating platforms with unique patterns - more platforms for bigger map
        const platformConfigs = [
            {startX: 8, y: 16, length: 4},
            {startX: 15, y: 14, length: 5},
            {startX: 23, y: 12, length: 3},
            {startX: 30, y: 15, length: 6},
            {startX: 40, y: 13, length: 4},
            {startX: 48, y: 11, length: 5},
            {startX: 58, y: 14, length: 6},
            {startX: 70, y: 12, length: 4},
            {startX: 80, y: 10, length: 5},
            {startX: 92, y: 13, length: 7},
            {startX: 105, y: 11, length: 5},
            {startX: 118, y: 15, length: 6},
            {startX: 130, y: 13, length: 4},
            {startX: 140, y: 9, length: 5}
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
        
        // Add collectibles - more for bigger map
        for (let i = 0; i < 30; i++) {
            this.collectibleItems.push({
                xPos: 100 + i * 150 + Math.random() * 50,
                yPos: 200 + Math.random() * 300,
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
            invulnerableTime: 0,
            attackCooldown: 0,
            isAttacking: false,
            attackDuration: 0
        };
    }
    
    generateHostiles() {
        const enemyPositions = [
            {x: 400, y: 500, pattern: 'patrol', type: 'ground'},
            {x: 800, y: 450, pattern: 'jump', type: 'hopper'},
            {x: 1200, y: 480, pattern: 'patrol', type: 'ground'},
            {x: 1600, y: 420, pattern: 'jump', type: 'hopper'},
            {x: 2000, y: 500, pattern: 'flying', type: 'flyer'},
            {x: 2400, y: 450, pattern: 'patrol', type: 'tank'},
            {x: 2800, y: 480, pattern: 'flying', type: 'flyer'},
            {x: 3200, y: 420, pattern: 'shooter', type: 'ranged'},
            {x: 3600, y: 500, pattern: 'patrol', type: 'ground'},
            {x: 4000, y: 450, pattern: 'tank', type: 'tank'}
        ];
        
        enemyPositions.forEach(pos => {
            this.hostileEntities.push({
                xPos: pos.x,
                yPos: pos.y,
                velocityX: 0,
                velocityY: 0,
                boxWidth: pos.type === 'tank' ? 36 : 28,
                boxHeight: pos.type === 'tank' ? 36 : 28,
                movementPattern: pos.pattern,
                enemyType: pos.type,
                patrolDirection: 1,
                patrolOrigin: pos.x,
                patrolRange: pos.type === 'tank' ? 100 : 150,
                animCycle: 0,
                active: true,
                health: pos.type === 'tank' ? 30 : (pos.type === 'ranged' ? 15 : 10),
                shootCooldown: 0
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
        
        // Update projectiles
        this.updateProjectiles(dt);
        
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
        const moveAccel = 1200;
        const maxHorizontalSpeed = 250;
        const jumpPower = 420;
        const dashForce = 600;
        
        // Horizontal movement - A and D keys
        if (this.pressedButtons.has('KeyA')) {
            hero.velocityX -= moveAccel * dt;
            hero.facingRight = false;
        }
        if (this.pressedButtons.has('KeyD')) {
            hero.velocityX += moveAccel * dt;
            hero.facingRight = true;
        }
        
        // Apply friction
        hero.velocityX *= 0.85;
        
        // Clamp speed
        hero.velocityX = Math.max(-maxHorizontalSpeed, Math.min(maxHorizontalSpeed, hero.velocityX));
        
        // Jump mechanics - Space key
        if (this.pressedButtons.has('Space') && hero.canJump) {
            hero.velocityY = -jumpPower;
            hero.canJump = false;
        }
        
        // Dash ability - Shift keys
        if ((this.pressedButtons.has('ShiftLeft') || this.pressedButtons.has('ShiftRight')) && hero.dashEnergy >= 50 && hero.dashCooldown <= 0) {
            const dashDir = hero.facingRight ? 1 : -1;
            hero.velocityX += dashForce * dashDir;
            hero.dashEnergy -= 50;
            hero.dashCooldown = 1.0;
        }
        
        // Attack - K key (like Hollow Knight's attack button)
        if (this.pressedButtons.has('KeyK') && hero.attackCooldown <= 0 && !hero.isAttacking) {
            hero.isAttacking = true;
            hero.attackDuration = 0.3; // 300ms attack animation
            hero.attackCooldown = 0.5; // 500ms cooldown
        }
        
        // Update attack state
        if (hero.isAttacking) {
            hero.attackDuration -= dt;
            if (hero.attackDuration <= 0) {
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
            
            const speed = enemy.enemyType === 'tank' ? 50 : 80;
            enemy.xPos += enemy.patrolDirection * speed * dt;
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
        } else if (enemy.movementPattern === 'flying') {
            // Flying pattern - sine wave motion
            const flySpeed = 100;
            enemy.xPos += Math.sin(enemy.animCycle * 0.5) * flySpeed * dt;
            enemy.yPos += Math.cos(enemy.animCycle * 0.3) * 50 * dt;
        } else if (enemy.movementPattern === 'shooter') {
            // Shooter stays in place and shoots at player
            enemy.shootCooldown -= dt;
            if (enemy.shootCooldown <= 0) {
                const distToPlayer = Math.abs(this.heroEntity.xPos - enemy.xPos);
                if (distToPlayer < 400) {
                    this.spawnEnemyProjectile(enemy);
                    enemy.shootCooldown = 2.0; // Shoot every 2 seconds
                }
            }
        } else if (enemy.movementPattern === 'tank') {
            // Tank moves slowly and is hard to kill
            const distFromOrigin = enemy.xPos - enemy.patrolOrigin;
            
            if (Math.abs(distFromOrigin) > enemy.patrolRange) {
                enemy.patrolDirection *= -1;
            }
            
            enemy.xPos += enemy.patrolDirection * 40 * dt;
        }
    }
    
    spawnEnemyProjectile(enemy) {
        const dirX = this.heroEntity.xPos > enemy.xPos ? 1 : -1;
        this.projectiles.push({
            xPos: enemy.xPos + enemy.boxWidth / 2,
            yPos: enemy.yPos + enemy.boxHeight / 2,
            velocityX: dirX * 200,
            velocityY: 0,
            radius: 6,
            fromEnemy: true,
            active: true
        });
    }
    
    updateProjectiles(dt) {
        this.projectiles = this.projectiles.filter(proj => {
            if (!proj.active) return false;
            
            // Update position
            proj.xPos += proj.velocityX * dt;
            proj.yPos += proj.velocityY * dt;
            
            // Remove if off screen
            if (proj.xPos < this.cameraOffsetX - 100 || 
                proj.xPos > this.cameraOffsetX + this.displayWidth + 100 ||
                proj.yPos > this.displayHeight + 100) {
                return false;
            }
            
            // Check collision with tiles
            for (let tile of this.worldTiles) {
                const tileX = tile.gridX * tile.dimensions;
                const tileY = tile.gridY * tile.dimensions;
                
                if (proj.xPos > tileX && proj.xPos < tileX + tile.dimensions &&
                    proj.yPos > tileY && proj.yPos < tileY + tile.dimensions) {
                    return false;
                }
            }
            
            return true;
        });
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
        
        // Check hero attack hitting enemies
        if (hero.isAttacking) {
            const attackRange = 40;
            const attackX = hero.facingRight ? hero.xPos + hero.boxWidth : hero.xPos - attackRange;
            const attackY = hero.yPos;
            
            this.hostileEntities.forEach(enemy => {
                if (enemy.active && this.checkBoxOverlap(
                    attackX, attackY, attackRange, hero.boxHeight,
                    enemy.xPos, enemy.yPos, enemy.boxWidth, enemy.boxHeight
                )) {
                    enemy.health -= 10;
                    if (enemy.health <= 0) {
                        enemy.active = false;
                        this.playerPoints += enemy.enemyType === 'tank' ? 150 : (enemy.enemyType === 'ranged' ? 100 : 50);
                    }
                    // Knockback effect on enemy
                    const knockbackDir = hero.facingRight ? 1 : -1;
                    enemy.xPos += knockbackDir * 30;
                }
            });
        }
        
        // Enemy collisions with hero
        this.hostileEntities.forEach(enemy => {
            if (enemy.active && this.checkBoxOverlap(
                hero.xPos, hero.yPos, hero.boxWidth, hero.boxHeight,
                enemy.xPos, enemy.yPos, enemy.boxWidth, enemy.boxHeight
            )) {
                if (hero.velocityY > 200 && hero.yPos < enemy.yPos && !hero.isAttacking) {
                    // Bounce on enemy
                    enemy.health -= 15;
                    if (enemy.health <= 0) {
                        enemy.active = false;
                        this.playerPoints += enemy.enemyType === 'tank' ? 150 : (enemy.enemyType === 'ranged' ? 100 : 50);
                    }
                    hero.velocityY = -300;
                } else if (hero.invulnerableTime <= 0) {
                    // Take damage with invulnerability frames
                    const damage = enemy.enemyType === 'tank' ? 15 : 10;
                    hero.lifePoints -= damage;
                    hero.invulnerableTime = 1.5; // 1.5 seconds of invulnerability
                    // Knockback
                    const knockbackDir = hero.xPos < enemy.xPos ? -1 : 1;
                    hero.velocityX = knockbackDir * 200;
                }
            }
        });
        
        // Projectile collisions
        this.projectiles.forEach(proj => {
            if (!proj.active) return;
            
            if (proj.fromEnemy) {
                // Enemy projectile hitting hero
                const dist = Math.hypot(hero.xPos + hero.boxWidth/2 - proj.xPos, 
                                       hero.yPos + hero.boxHeight/2 - proj.yPos);
                if (dist < proj.radius + 12 && hero.invulnerableTime <= 0) {
                    hero.lifePoints -= 5;
                    hero.invulnerableTime = 1.5;
                    proj.active = false;
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
        
        // Render projectiles
        this.projectiles.forEach(proj => {
            if (proj.active) {
                this.drawProjectile(ctx, proj);
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
    
    drawProjectile(ctx, proj) {
        ctx.fillStyle = proj.fromEnemy ? '#ff6b6b' : '#4ecdc4';
        ctx.beginPath();
        ctx.arc(proj.xPos, proj.yPos, proj.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect
        ctx.strokeStyle = proj.fromEnemy ? '#ff3838' : '#2ebf91';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    drawHostileEntity(ctx, enemy) {
        const x = enemy.xPos;
        const y = enemy.yPos;
        const w = enemy.boxWidth;
        const h = enemy.boxHeight;
        
        // Different appearance based on enemy type
        if (enemy.enemyType === 'tank') {
            // Tank enemy - bigger and armored
            ctx.fillStyle = '#7f8c8d';
            ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
            
            ctx.fillStyle = '#95a5a6';
            ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
            
            // Armor plates
            ctx.fillStyle = '#5d6d7e';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(x + 8 + i * 8, y + 8, 6, 6);
            }
            
            // Eyes
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(x + 10, y + h/2, 4, 4);
            ctx.fillRect(x + w - 14, y + h/2, 4, 4);
        } else if (enemy.enemyType === 'flyer') {
            // Flying enemy - lighter color, wings
            ctx.fillStyle = '#9b59b6';
            ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
            
            // Wings
            const wingFlap = Math.sin(enemy.animCycle * 2) * 4;
            ctx.fillStyle = '#8e44ad';
            ctx.fillRect(x, y + h/2 + wingFlap, 6, 8);
            ctx.fillRect(x + w - 6, y + h/2 - wingFlap, 6, 8);
            
            // Eyes
            ctx.fillStyle = '#fff';
            ctx.fillRect(x + 10, y + 12, 4, 4);
            ctx.fillRect(x + w - 14, y + 12, 4, 4);
        } else if (enemy.enemyType === 'ranged') {
            // Ranged enemy - with projectile launcher
            ctx.fillStyle = '#e67e22';
            ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
            
            // Weapon/cannon
            ctx.fillStyle = '#d35400';
            ctx.fillRect(x + w - 6, y + h/2 - 2, 8, 4);
            
            // Eyes
            ctx.fillStyle = '#000';
            ctx.fillRect(x + 8, y + 10, 5, 5);
            ctx.fillRect(x + w - 13, y + 10, 5, 5);
        } else {
            // Default ground enemy
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
        
        // Health bar for tougher enemies
        if (enemy.enemyType === 'tank' || enemy.enemyType === 'ranged') {
            const maxHealth = enemy.enemyType === 'tank' ? 30 : 15;
            const healthPercent = enemy.health / maxHealth;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(x, y - 8, w, 4);
            
            ctx.fillStyle = healthPercent > 0.5 ? '#2ecc71' : (healthPercent > 0.25 ? '#f39c12' : '#e74c3c');
            ctx.fillRect(x, y - 8, w * healthPercent, 4);
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
        
        // Attack animation - sword/weapon
        if (hero.isAttacking) {
            const attackProgress = 1 - (hero.attackDuration / 0.3);
            const attackAngle = attackProgress * Math.PI / 2;
            const swordLength = 20;
            const swordX = hero.facingRight ? x + w : x;
            const swordY = y + h/2;
            
            ctx.save();
            ctx.translate(swordX, swordY);
            if (!hero.facingRight) ctx.scale(-1, 1);
            ctx.rotate(-Math.PI / 4 + attackAngle);
            
            // Sword blade
            ctx.fillStyle = '#ecf0f1';
            ctx.fillRect(0, -2, swordLength, 4);
            
            // Sword tip
            ctx.fillStyle = '#bdc3c7';
            ctx.beginPath();
            ctx.moveTo(swordLength, 0);
            ctx.lineTo(swordLength + 4, -2);
            ctx.lineTo(swordLength + 4, 2);
            ctx.closePath();
            ctx.fill();
            
            // Attack effect
            ctx.fillStyle = 'rgba(236, 240, 241, 0.4)';
            ctx.beginPath();
            ctx.arc(swordLength/2, 0, 10, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
        
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
        ctx.fillRect(10, this.displayHeight - 40, 150, 20);
        
        const dashColor = hero.dashEnergy >= 50 ? '#3498db' : '#95a5a6';
        ctx.fillStyle = dashColor;
        ctx.fillRect(12, this.displayHeight - 38, (hero.dashEnergy / 100) * 146, 16);
        
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.fillText('DASH', 170, this.displayHeight - 25);
        
        // Game over message
        if (hero.lifePoints <= 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, this.displayHeight / 2 - 50, this.displayWidth, 100);
            
            ctx.fillStyle = '#e74c3c';
            ctx.font = 'bold 36px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', this.displayWidth / 2, this.displayHeight / 2);
            
            ctx.font = '18px monospace';
            ctx.fillStyle = '#fff';
            ctx.fillText('Press R to Restart', this.displayWidth / 2, this.displayHeight / 2 + 30);
            ctx.textAlign = 'left';
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
        this.heroEntity.attackCooldown = 0;
        this.heroEntity.isAttacking = false;
        this.heroEntity.attackDuration = 0;
        this.playerPoints = 0;
        this.cameraOffsetX = 0;
        this.cameraOffsetY = 0;
        
        // Reset collectibles
        this.collectibleItems.forEach(item => item.gathered = false);
        
        // Reset enemies
        this.hostileEntities.forEach(enemy => {
            enemy.active = true;
            enemy.health = enemy.enemyType === 'tank' ? 30 : (enemy.enemyType === 'ranged' ? 15 : 10);
        });
        
        // Clear projectiles
        this.projectiles = [];
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new AdventureEngine();
});
