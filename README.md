# Pixel Realm Adventures

A unique platformer game inspired by Geometry Dash, Hollow Knight, and Terraria's pixel art aesthetic.

## Features

### Game Mechanics
- **Smooth Movement**: Responsive controls with A/D keys and acceleration physics
- **Jump System**: Precise jumping mechanics with ground detection using Space
- **Dash Ability**: Special dash move with energy management and cooldown (Shift)
- **Attack System**: Hollow Knight-inspired sword attack with K key
- **Physics Engine**: Custom gravity and collision detection system
- **Camera System**: Smooth camera following with parallax backgrounds

### Combat System
- **Melee Attack**: Press K to swing your sword and damage enemies
- **Attack Range**: 40 pixel reach with visible sword animation
- **Damage System**: Different damage values per enemy type
- **Bounce Attack**: Jump on enemies from above to damage them
- **Invulnerability Frames**: 1.5 seconds after taking damage

### Visual Design
- **Terraria-style Graphics**: Pixel art aesthetic with detailed block textures
- **Larger Game World**: 1280x720 resolution with extended map (150 tiles wide)
- **Animated Characters**: Hero with walking animation, blinking eyes, and attack animations
- **Particle Effects**: Glowing collectibles with pulsing animations
- **Parallax Background**: Layered mountains for depth
- **Dash Trail Effects**: Visual feedback for special abilities

### Enemy Types
1. **Ground Enemies** (Red with spikes)
   - Basic patrol pattern
   - 10 HP
   - 10 damage per hit
   - Worth 50 points

2. **Hopper Enemies** (Red jumpers)
   - Jump vertically with random heights
   - 10 HP
   - 10 damage per hit
   - Worth 50 points

3. **Flying Enemies** (Purple with wings)
   - Sine wave flight pattern
   - 10 HP
   - 10 damage per hit
   - Worth 50 points

4. **Ranged Enemies** (Orange with cannon)
   - Shoots projectiles at player
   - 15 HP with health bar
   - 5 damage per projectile
   - Worth 100 points

5. **Tank Enemies** (Gray armored)
   - Slow but heavily armored
   - 30 HP with health bar
   - 15 damage per hit
   - Worth 150 points

### World Design
- **Procedural Terrain**: Ground level with natural sine-wave variation
- **Floating Platforms**: 14 strategic platform groups for challenging jumps
- **Collectibles**: 30 golden coins scattered throughout the extended level
- **Expanded Map**: 4800 pixels wide (150 tiles) for longer gameplay
- **Scoring System**: Points for collecting items and defeating enemies

## Controls

- **A**: Move left
- **D**: Move right
- **Space**: Jump
- **K**: Attack (sword swing)
- **Shift**: Dash (requires energy)
- **R**: Restart game (when game over)

## How to Play

1. Open `index.html` in a modern web browser
2. Use A and D keys to navigate platforms
3. Press Space to jump over gaps and obstacles
4. Press K to attack enemies with your sword
5. Use Shift to dash across larger gaps
6. Collect golden coins for points
7. Defeat enemies by attacking them or bouncing on them
8. Avoid enemy projectiles and contact damage
9. Try to get the highest score!

## Technical Details

- **Engine**: Custom JavaScript game engine (AdventureEngine)
- **Rendering**: HTML5 Canvas with 2D context
- **Resolution**: 1280x720 pixels (upgraded from 960x640)
- **FPS**: 60 frames per second (requestAnimationFrame)
- **Physics**: Delta-time based physics system
- **Map Size**: 4800x736 pixels (150x23 tiles)

## Game Architecture

The game is built with a custom engine that includes:
- **AdventureEngine**: Main game class
- **State Management**: Track hero, enemies, collectibles, projectiles, and world
- **Input System**: Keyboard event handling with A/D/Space/K/Shift keys
- **Physics System**: Custom gravity, velocity, and collision detection
- **Combat System**: Melee attacks with range detection and projectile system
- **AI System**: Multiple enemy behavior patterns (patrol, jump, fly, shoot, tank)
- **Rendering Pipeline**: Layered rendering with camera transforms
- **Animation System**: Frame-based and time-based animations including attack animations

## Enemy AI Patterns

- **Patrol**: Move back and forth within a range
- **Jump**: Vertical hopping with ground collision detection
- **Flying**: Sine wave motion for aerial movement
- **Shooter**: Stay in place and fire projectiles when player is in range
- **Tank**: Slow patrol with high health and armor

## Future Enhancements

Potential additions for future versions:
- Additional attack combos
- More enemy types and boss battles
- Power-ups and upgrades
- Multiple levels and biomes
- Sound effects and music
- Advanced particle systems
- Procedural level generation
- Save/load system
- Achievements and unlockables
