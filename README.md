# Pixel Realm Adventures

A unique platformer game inspired by Geometry Dash, Hollow Knight, and Terraria's pixel art aesthetic.

## Features

### Game Mechanics
- **Smooth Movement**: Responsive controls with acceleration and deceleration
- **Jump System**: Precise jumping mechanics with ground detection
- **Dash Ability**: Special dash move with energy management and cooldown
- **Physics Engine**: Custom gravity and collision detection system
- **Camera System**: Smooth camera following with parallax backgrounds

### Visual Design
- **Terraria-style Graphics**: Pixel art aesthetic with detailed block textures
- **Animated Characters**: Hero with walking animation and blinking eyes
- **Particle Effects**: Glowing collectibles with pulsing animations
- **Parallax Background**: Layered mountains for depth
- **Dash Trail Effects**: Visual feedback for special abilities

### Enemies
- **Patrol Enemies**: Move back and forth in set patterns
- **Jumping Enemies**: Vertical movement with random variation
- **Combat System**: Bounce on enemies to defeat them or take damage
- **AI Behavior**: Multiple movement patterns for variety

### World Design
- **Procedural Terrain**: Ground level with natural variation
- **Floating Platforms**: Strategic platform placement for challenging jumps
- **Collectibles**: Golden coins scattered throughout the level
- **Scoring System**: Points for collecting items and defeating enemies

## Controls

- **Arrow Keys**: Move left and right
- **Space**: Jump
- **Shift**: Dash (requires energy)
- **R**: Restart game (when game over)

## How to Play

1. Open `index.html` in a modern web browser
2. Use arrow keys to navigate platforms
3. Jump with space and dash with shift for longer distances
4. Collect golden coins for points
5. Bounce on enemies to defeat them
6. Avoid taking damage from enemies
7. Try to get the highest score!

## Technical Details

- **Engine**: Custom JavaScript game engine (AdventureEngine)
- **Rendering**: HTML5 Canvas with 2D context
- **Resolution**: 960x640 pixels
- **FPS**: 60 frames per second (requestAnimationFrame)
- **Physics**: Delta-time based physics system

## Game Architecture

The game is built with a custom engine that includes:
- **AdventureEngine**: Main game class
- **State Management**: Track hero, enemies, collectibles, and world
- **Input System**: Keyboard event handling with pressed keys tracking
- **Physics System**: Custom gravity, velocity, and collision detection
- **Rendering Pipeline**: Layered rendering with camera transforms
- **Animation System**: Frame-based and time-based animations

## Future Enhancements

Potential additions for future versions:
- Additional enemy types
- Power-ups and special abilities
- Multiple levels
- Sound effects and music
- Particle systems
- Boss battles
- Procedural level generation
- Save/load system
