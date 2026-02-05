# Pixel Realm Adventures

A unique platformer game inspired by Geometry Dash, Hollow Knight, and Terraria's pixel art aesthetic.

## Features

### Game Mechanics
- **Smooth Movement**: Responsive controls with acceleration and deceleration using A/D keys
- **Jump System**: Precise jumping mechanics with ground detection using Space
- **Attack System**: Slash attack to damage and defeat enemies using W key
- **Dash Ability**: Special dash move with energy management and cooldown
- **Physics Engine**: Custom gravity and collision detection system with natural movement
- **Camera System**: Smooth camera following with parallax backgrounds

### Visual Design
- **High-Resolution Graphics**: 1920x1080 resolution with detailed sprites and effects
- **Realistic Textures**: Enhanced block textures with gradients, shadows, and highlights
- **Animated Characters**: Hero with walking animation, blinking eyes, and detailed appearance
- **Particle Effects**: Glowing collectibles with pulsing animations and attack particles
- **Parallax Background**: Layered mountains with snow caps and clouds for depth
- **Visual Feedback**: Dash trail effects, attack slashes, and health bars

### Enemies
- **Patrol Enemies**: Move back and forth in set patterns
- **Jumping Enemies**: Vertical movement with random variation
- **Combat System**: Attack enemies with W key or bounce on them to defeat
- **Enemy Health**: Enemies have health bars and take multiple hits to defeat
- **AI Behavior**: Multiple movement patterns for variety
- **Knockback Effects**: Enemies react to attacks with knockback

### World Design
- **Expanded Map**: Larger procedural terrain spanning 120+ tiles
- **Procedural Terrain**: Ground level with natural variation using sine waves
- **More Platforms**: 11 floating platform groups for challenging jumps
- **Collectibles**: 30 golden coins scattered throughout the expanded level
- **Scoring System**: Points for collecting items and defeating enemies

## Controls

- **A/D Keys**: Move left and right
- **Space**: Jump
- **W Key**: Attack enemies
- **Shift**: Dash (requires energy)
- **R**: Restart game (when game over)

## How to Play

1. Open `index.html` in a modern web browser
2. Use A/D keys to navigate platforms
3. Jump with Space and dash with Shift for longer distances
4. Attack enemies with W key to damage them
5. Collect golden coins for points
6. Bounce on enemies or attack them to defeat them
7. Avoid taking damage from enemies
8. Try to get the highest score!

## Technical Details

- **Engine**: Custom JavaScript game engine (AdventureEngine)
- **Rendering**: HTML5 Canvas with 2D context and advanced graphics
- **Resolution**: 1920x1080 pixels (Full HD)
- **FPS**: 60 frames per second (requestAnimationFrame)
- **Physics**: Delta-time based physics system with natural movement
- **Graphics**: Gradient-based rendering, shadows, and particle effects

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
