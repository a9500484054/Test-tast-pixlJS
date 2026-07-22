import * as PIXI from 'pixi.js';
import { AnimationEntity } from '../entities/AnimationEntity';
import { GameConfig } from '../config/GameConfig';
import { IPoint } from '../types';

export class AnimationManager {
    private app: PIXI.Application;
    private animationEntity: AnimationEntity;
    private container: PIXI.Container;
    private isAnimating: boolean = false;
    private bounds: { left: number; right: number; top: number; bottom: number };
    private pointerDownHandler: (event: PIXI.FederatedPointerEvent) => void;
    private touchStartHandler: (event: PIXI.FederatedPointerEvent) => void;
    private isMobile: boolean = false;

    constructor(app: PIXI.Application) {
        this.app = app;
        this.isMobile = this.detectMobile();
        this.container = new PIXI.Container();
        this.app.stage.addChild(this.container);
        
        this.animationEntity = new AnimationEntity(
            GameConfig.animationSize,
            GameConfig.minFrames
        );
        this.container.addChild(this.animationEntity);
        
        this.bounds = this.calculateBounds();
        this.centerAnimation();
        this.setupInteraction();
    }

    private detectMobile(): boolean {
        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isMobileScreen = window.innerWidth < 768;
        return isMobileUA || isMobileScreen;
    }

    private calculateBounds(): { left: number; right: number; top: number; bottom: number } {
        const margin = GameConfig.animationSize / 2;
        const width = this.app.renderer.width;
        const height = this.app.renderer.height;
        
        return {
            left: margin,
            right: width - margin,
            top: margin,
            bottom: height - margin
        };
    }

    private centerAnimation(): void {
        const center = this.getCenter();
        this.animationEntity.setPosition(center.x, center.y);
    }

    private getCenter(): IPoint {
        return {
            x: this.app.renderer.width / 2,
            y: this.app.renderer.height / 2
        };
    }

    private setupInteraction(): void {
        this.app.stage.interactive = true;
        this.app.stage.hitArea = new PIXI.Rectangle(
            0, 0,
            this.app.renderer.width,
            this.app.renderer.height
        );

        this.pointerDownHandler = (event: PIXI.FederatedPointerEvent) => {
            const position = event.global;
            this.moveAnimationTo(position.x, position.y);
        };

        this.app.stage.on('pointerdown', this.pointerDownHandler);
        
        this.touchStartHandler = (event: PIXI.FederatedPointerEvent) => {
            event.stopPropagation();
            const position = event.global;
            this.moveAnimationTo(position.x, position.y);
        };

        this.app.stage.on('touchstart', this.touchStartHandler);
    }

    private moveAnimationTo(x: number, y: number): void {
        const targetX = Math.max(this.bounds.left, Math.min(this.bounds.right, x));
        const targetY = Math.max(this.bounds.top, Math.min(this.bounds.bottom, y));
        
        if (this.animationEntity.isMoving()) {
            this.animationEntity.interruptMovement();
        }
        
        this.animationEntity.moveTo({ x: targetX, y: targetY }, GameConfig.movementDuration);
    }

    update(delta: number): void {
        this.animationEntity.update(delta);
    }

    resize(width: number, height: number): void {
        this.bounds = this.calculateBounds();
        
        if (this.app.stage) {
            this.app.stage.hitArea = new PIXI.Rectangle(0, 0, width, height);
        }
        
        if (!this.animationEntity.isMoving()) {
            this.centerAnimation();
        }
    }

    destroy(): void {
        if (this.app.stage) {
            this.app.stage.off('pointerdown', this.pointerDownHandler);
            this.app.stage.off('touchstart', this.touchStartHandler);
        }
        this.container.destroy({ children: true });
    }
}