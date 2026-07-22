export interface IPoint {
    x: number;
    y: number;
}

export interface IMovementPath {
    points: IPoint[];
    duration: number;
    type: 'linear' | 'bezier' | 'sinusoidal';
}

export interface IScaleOptions {
    width: number;
    height: number;
    maxWidth: number;
    maxHeight: number;
    scaleMode: 'fit' | 'fill' | 'cover';
}

export interface IAnimationState {
    isPlaying: boolean;
    currentFrame: number;
    totalFrames: number;
    position: IPoint;
    targetPosition: IPoint | null;
    isMoving: boolean;
    progress: number;
    startPosition: IPoint;
}

export interface IParticleData {
    angle: number;
    radius: number;
    speed: number;
    offset: number;
    initialX: number;
    initialY: number;
    phase: number;
}