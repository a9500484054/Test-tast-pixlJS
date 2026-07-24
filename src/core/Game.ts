import * as PIXI from "pixi.js";
import { GameConfig } from "../config/GameConfig";
import { AnimationManager } from "./AnimationManager";
import { ScaleManager } from "./ScaleManager";

export class Game {
    private app!: PIXI.Application;
    private animationManager!: AnimationManager;
    private readonly container: HTMLElement;
    private readonly scaleManager = ScaleManager.getInstance();
    private resizeObserver?: ResizeObserver;
    private canvasWrapper: HTMLDivElement;

    constructor(container: HTMLElement) {
        this.container = container;
        
        // Создаем обертку для центрирования канваса
        this.canvasWrapper = document.createElement('div');
        this.canvasWrapper.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
            pointer-events: none;
        `;
        this.container.appendChild(this.canvasWrapper);
        
        this.init();
    }

    private async init(): Promise<void> {
        this.app = new PIXI.Application({
            width: GameConfig.gameWidth,
            height: GameConfig.gameHeight,
            backgroundColor: GameConfig.backgroundColor,
            antialias: true,
            autoDensity: true,
            resolution: Math.min(window.devicePixelRatio || 1, 2)
        });

        const canvas = this.app.view as HTMLCanvasElement;
        canvas.style.cssText = `
            display: block;
            touch-action: none;
            pointer-events: auto;
            position: relative;
            width: 100%;
            height: 100%;
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        `;
        
        this.canvasWrapper.appendChild(canvas);

        this.animationManager = new AnimationManager(this.app);

        this.app.ticker.add((delta) => {
            this.animationManager.update(delta);
        });

        this.setupResize();
        this.resize();
    }

    private setupResize(): void {
        this.resizeObserver = new ResizeObserver(() => {
            this.resize();
        });
        this.resizeObserver.observe(this.container);

        window.addEventListener("resize", this.resize);
        window.addEventListener("orientationchange", () => {
            setTimeout(() => {
                this.resize();
            }, 150);
        });
    }

    private resize = (): void => {
        if (!this.app) return;

        const rect = this.container.getBoundingClientRect();
        const containerWidth = rect.width || window.innerWidth;
        const containerHeight = rect.height || window.innerHeight;

        const size = this.scaleManager.getOptimalSize(
            containerWidth,
            containerHeight,
            this.isMobile()
        );

        const canvas = this.app.view as HTMLCanvasElement;
        
        // Для мобильных устройств используем 100% ширины/высоты с сохранением пропорций
        if (this.isMobile()) {
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.maxWidth = '100vw';
            canvas.style.maxHeight = '100vh';
            canvas.style.objectFit = 'contain';
        } else {
            canvas.style.width = `${size.width}px`;
            canvas.style.height = `${size.height}px`;
            canvas.style.maxWidth = 'none';
            canvas.style.maxHeight = 'none';
            canvas.style.objectFit = 'none';
        }

        this.app.renderer.resize(
            GameConfig.gameWidth,
            GameConfig.gameHeight
        );

        this.animationManager.resize(
            this.app.screen.width,
            this.app.screen.height
        );
    };

    private isMobile(): boolean {
        return (
            /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(
                navigator.userAgent
            ) ||
            window.innerWidth < 768
        );
    }

    destroy(): void {
        this.resizeObserver?.disconnect();
        this.animationManager.destroy();
        this.app.destroy(true);
    }
}