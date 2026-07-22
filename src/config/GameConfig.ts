export interface IGameConfig {
    gameWidth: number;
    gameHeight: number;
    animationSize: number;
    minFrames: number;
    backgroundColor: number;
    scaleMode: 'fit' | 'fill' | 'cover';
    movementDuration: number;
    pathType: 'bezier' | 'sinusoidal';
    maxDesktopWidth: number;
    maxDesktopHeight: number;
    mobileMaxWidth: number;
    mobileMaxHeight: number;
    minScale: number;
}

export const GameConfig: IGameConfig = {
    gameWidth: 1000,
    gameHeight: 600,
    animationSize: 400,
    minFrames: 5,
    backgroundColor: 0x1a1a2e,
    scaleMode: 'fit',
    movementDuration: 1200,
    pathType: 'bezier',
    maxDesktopWidth: 1280,
    maxDesktopHeight: 768,
    mobileMaxWidth: 500,
    mobileMaxHeight: 400,
    minScale: 0.3
};

export const AnimationConfig = {
    colors: [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf9ca24, 0xa29bfe],
    rotationSpeed: 0.02,
    scaleRange: { min: 0.5, max: 1.2 },
    opacityRange: { min: 0.3, max: 1 },
    particleCount: 20,
    particleSizeMin: 5,
    particleSizeMax: 20,
    polygonSides: 6,
    pulseSpeed: 0.001,
    movementAmplitude: 120
};