import * as PIXI from 'pixi.js';
import { AnimationConfig, GameConfig } from '../config/GameConfig';
import { IPoint, IAnimationState, IParticleData } from '../types';
import { BezierUtils } from '../utils/BezierUtils';

export class AnimationEntity extends PIXI.Container {
    private graphics: PIXI.Graphics;
    private particles: PIXI.Sprite[] = [];
    private state: IAnimationState;
    private frameCounter: number = 0;
    private totalFrames: number;
    private moveStartPosition: IPoint = { x: 0, y: 0 };
    private moveStartTime: number = 0;
    private moveDuration: number = 1200;
    private animationId: number | null = null;
    private shapeSize: number;
    private currentPulse: number = 1;
    private lastTime: number = 0;

    constructor(size: number, totalFrames: number = 5) {
        super();
        this.totalFrames = Math.max(totalFrames, 5);
        this.shapeSize = size;
        
        this.state = {
            isPlaying: true,
            currentFrame: 0,
            totalFrames: this.totalFrames,
            position: { x: 0, y: 0 },
            targetPosition: null,
            isMoving: false,
            progress: 0,
            startPosition: { x: 0, y: 0 }
        };

        this.graphics = new PIXI.Graphics();
        this.addChild(this.graphics);
        
        this.setupParticles();
        this.setupAnimation();
        this.setupEventListeners();
        this.lastTime = Date.now();
    }

    private setupEventListeners(): void {
        this.on('added', () => {
            this.state.isPlaying = true;
        });
        
        this.on('removed', () => {
            this.state.isPlaying = false;
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
        });
    }

    private setupParticles(): void {
        const count = AnimationConfig.particleCount;
        for (let i = 0; i < count; i++) {
            const particle = new PIXI.Sprite(PIXI.Texture.WHITE);
            const color = AnimationConfig.colors[i % AnimationConfig.colors.length];
            const size = AnimationConfig.particleSizeMin + 
                        Math.random() * (AnimationConfig.particleSizeMax - AnimationConfig.particleSizeMin);
            
            particle.tint = color;
            particle.width = size;
            particle.height = size;
            particle.anchor.set(0.5);
            particle.alpha = AnimationConfig.opacityRange.min + 
                           Math.random() * (AnimationConfig.opacityRange.max - AnimationConfig.opacityRange.min);
            
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
            const radius = 100 + Math.random() * 150;
            
            const data: IParticleData = {
                angle: angle,
                radius: radius,
                speed: 0.005 + Math.random() * 0.02,
                offset: Math.random() * Math.PI * 2,
                initialX: Math.cos(angle) * radius,
                initialY: Math.sin(angle) * radius,
                phase: (i / count) * Math.PI * 2
            };
            
            particle.position.set(data.initialX, data.initialY);
            (particle as any).data = data;
            
            this.particles.push(particle);
            this.addChild(particle);
        }
    }

    private setupAnimation(): void {
        this.graphics.clear();
        const size = this.shapeSize;
        const sides = AnimationConfig.polygonSides + Math.floor(Math.random() * 2);
        
        this.graphics.beginFill(AnimationConfig.colors[0], 0.15);
        this.graphics.drawCircle(0, 0, size * 0.5);
        this.graphics.endFill();
        
        const polygonRadius = size * 0.35;
        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
            const nextAngle = ((i + 1) / sides) * Math.PI * 2 - Math.PI / 2;
            
            const radius1 = polygonRadius * (0.6 + 0.4 * Math.sin(i * 1.5 + 0.5));
            const radius2 = polygonRadius * (0.6 + 0.4 * Math.sin((i + 1) * 1.5 + 0.5));
            
            const x1 = Math.cos(angle) * radius1;
            const y1 = Math.sin(angle) * radius1;
            const x2 = Math.cos(nextAngle) * radius2;
            const y2 = Math.sin(nextAngle) * radius2;
            
            const color = AnimationConfig.colors[i % AnimationConfig.colors.length];
            this.graphics.beginFill(color, 0.5 + 0.3 * Math.sin(i * 0.7));
            this.graphics.moveTo(0, 0);
            this.graphics.lineTo(x1, y1);
            this.graphics.lineTo(x2, y2);
            this.graphics.closePath();
            this.graphics.endFill();
        }
        
        for (let i = 0; i < 3; i++) {
            const radius = polygonRadius * (0.2 + i * 0.25);
            this.graphics.lineStyle(1.5, AnimationConfig.colors[i % AnimationConfig.colors.length], 0.3);
            this.graphics.drawCircle(0, 0, radius);
        }
        
        this.graphics.beginFill(0xffffff, 0.9);
        this.graphics.drawCircle(0, 0, 6);
        this.graphics.endFill();
        
        this.graphics.lineStyle(2, 0xffffff, 0.15);
        this.graphics.drawCircle(0, 0, size * 0.5);
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radius = size * 0.48;
            this.graphics.beginFill(AnimationConfig.colors[i % AnimationConfig.colors.length], 0.2);
            this.graphics.drawCircle(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                8
            );
            this.graphics.endFill();
        }
    }

    update(delta: number): void {
        if (!this.state.isPlaying) return;
        
        const normalizedDelta = Math.min(delta / 16.67, 3);
        const currentTime = Date.now();
        const timeDelta = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.frameCounter += normalizedDelta;
        
        if (this.frameCounter > 0.05) {
            this.frameCounter = 0;
            this.state.currentFrame = (this.state.currentFrame + 1) % this.totalFrames;
            this.updateAnimationFrame();
        }
        
        this.updateParticles(normalizedDelta);
        
        this.rotation += AnimationConfig.rotationSpeed * normalizedDelta * 0.5;
        
        const pulse = 1 + Math.sin(currentTime * AnimationConfig.pulseSpeed) * 0.05;
        this.currentPulse = pulse;
        this.scale.set(pulse);
        
        if (this.state.isMoving && this.state.targetPosition) {
            this.updateMovement();
        }
    }

    private updateMovement(): void {
        if (!this.state.targetPosition) return;
        
        const elapsed = Date.now() - this.moveStartTime;
        const progress = Math.min(elapsed / this.moveDuration, 1);
        
        const eased = BezierUtils.easeInOutCubic(progress);
        
        const amplitude = AnimationConfig.movementAmplitude * (1 - progress);
        const frequency = 3 + (1 - progress) * 2;
        const offsetX = Math.sin(progress * Math.PI * frequency + Math.PI/4) * amplitude;
        const offsetY = Math.cos(progress * Math.PI * (frequency + 0.3)) * amplitude * 0.7;
        
        const waveX = Math.sin(progress * Math.PI * 5) * amplitude * 0.2;
        const waveY = Math.cos(progress * Math.PI * 4.5) * amplitude * 0.2;
        
        this.x = this.moveStartPosition.x + 
                (this.state.targetPosition.x - this.moveStartPosition.x) * eased + offsetX + waveX;
        this.y = this.moveStartPosition.y + 
                (this.state.targetPosition.y - this.moveStartPosition.y) * eased + offsetY + waveY;
        
        this.state.progress = progress;
        this.state.position = { x: this.x, y: this.y };
        
        if (progress >= 1) {
            this.x = this.state.targetPosition.x;
            this.y = this.state.targetPosition.y;
            this.state.position = { x: this.x, y: this.y };
            this.state.isMoving = false;
            this.state.targetPosition = null;
            this.state.progress = 1;
            this.state.startPosition = { x: this.x, y: this.y };
        }
    }

    private updateAnimationFrame(): void {
        const progress = this.state.currentFrame / this.totalFrames;
        
        this.particles.forEach((particle, index) => {
            const phase = (index / this.particles.length) * Math.PI * 2;
            const alpha = AnimationConfig.opacityRange.min + 
                         (AnimationConfig.opacityRange.max - AnimationConfig.opacityRange.min) * 
                         (0.5 + 0.5 * Math.sin(progress * Math.PI * 4 + phase));
            particle.alpha = alpha;
            
            const scaleRange = AnimationConfig.scaleRange;
            const s = scaleRange.min + (scaleRange.max - scaleRange.min) * 
                     (0.5 + 0.5 * Math.sin(progress * Math.PI * 2 + phase));
            particle.scale.set(s);
        });
        
        if (this.state.currentFrame % 2 === 0) {
            this.graphics.alpha = 0.8 + 0.2 * Math.sin(progress * Math.PI * 2);
        }
    }

    private updateParticles(delta: number): void {
        const time = Date.now() / 1000;
        this.particles.forEach((particle) => {
            const data = (particle as any).data as IParticleData;
            if (data) {
                data.angle += data.speed * delta * 0.5;
                const radiusVariation = Math.sin(time * 0.5 + data.offset) * 30;
                const currentRadius = data.radius + radiusVariation;
                
                particle.position.set(
                    Math.cos(data.angle + time * 0.3) * currentRadius,
                    Math.sin(data.angle + time * 0.3) * currentRadius
                );
                
                if (Math.random() < 0.005 * delta) {
                    particle.alpha = AnimationConfig.opacityRange.min + 
                                   Math.random() * (AnimationConfig.opacityRange.max - AnimationConfig.opacityRange.min);
                }
            }
        });
    }

    moveTo(target: IPoint, duration: number = 1200): void {
        this.moveStartPosition = { x: this.x, y: this.y };
        this.state.startPosition = { x: this.x, y: this.y };
        this.state.targetPosition = { x: target.x, y: target.y };
        this.state.isMoving = true;
        this.moveStartTime = Date.now();
        this.moveDuration = duration;
        this.state.progress = 0;
    }

    interruptMovement(): void {
        if (this.state.isMoving) {
            this.state.isMoving = false;
            this.state.targetPosition = null;
            this.state.position = { x: this.x, y: this.y };
            this.state.startPosition = { x: this.x, y: this.y };
            this.state.progress = 1;
        }
    }

    getState(): IAnimationState {
        return { ...this.state };
    }

    isMoving(): boolean {
        return this.state.isMoving;
    }

    getCurrentPosition(): IPoint {
        return { x: this.x, y: this.y };
    }

    setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.state.position = { x, y };
        this.state.startPosition = { x, y };
    }

    destroy(options?: any): void {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.particles.forEach(particle => particle.destroy());
        this.particles = [];
        super.destroy(options);
    }
}