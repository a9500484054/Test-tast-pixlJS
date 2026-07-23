import * as PIXI from 'pixi.js';
import { GameConfig } from '../config/GameConfig';
import { ScaleManager } from './ScaleManager';
import { AnimationManager } from './AnimationManager';

export class Game {
    private app!: PIXI.Application;
    private animationManager!: AnimationManager;
    private scaleManager: ScaleManager;
    private container: HTMLElement;
    private resizeObserver: ResizeObserver | null = null;
    private isMobile: boolean = false;
    private initialized: boolean = false;
    private fullscreenEntered: boolean = false;
    private debugElement: HTMLDivElement | null = null;

    constructor(container: HTMLElement) {
        this.container = container;
        this.scaleManager = ScaleManager.getInstance();
        this.isMobile = this.detectMobile();
        this.init();
    }

    private async init(): Promise<void> {
        try {
            await this.initApplication();
            this.setupResize();
            this.setupFullscreenHandling();
            this.setupDebugInfo();
            this.initialized = true;
            console.log('Game initialized successfully');
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showErrorFallback();
        }
    }

    private async initApplication(): Promise<void> {
        this.app = new PIXI.Application({
            width: GameConfig.gameWidth,
            height: GameConfig.gameHeight,
            backgroundColor: GameConfig.backgroundColor,
            antialias: true,
            resolution: Math.min(window.devicePixelRatio || 1, 2),
            autoDensity: true,
            powerPreference: 'high-performance'
        });

        this.container.appendChild(this.app.view as HTMLCanvasElement);
        (this.app.view as HTMLCanvasElement).style.display = 'block';

        this.animationManager = new AnimationManager(this.app);
        
        this.app.ticker.add(() => {
            if (this.animationManager) {
                this.animationManager.update(this.app.ticker.deltaMS);
            }
        });

        this.resizeApp();
    }

    private detectMobile(): boolean {
        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isMobileScreen = window.innerWidth < 768;
        return isMobileUA || isMobileScreen;
    }

    private setupResize(): void {
        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                this.resizeApp();
            });
            this.resizeObserver.observe(this.container);
        } else {
            // Fallback для IE11
            window.addEventListener('resize', () => this.resizeApp());
        }

        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.resizeApp(), 300);
        });

        window.addEventListener('resize', () => {
            this.resizeApp();
        });
    }

    private resizeApp(): void {
        if (!this.initialized) return;

        const containerRect = this.container.getBoundingClientRect();
        const containerWidth = containerRect.width || window.innerWidth;
        const containerHeight = containerRect.height || window.innerHeight;

        const { width, height } = this.scaleManager.getOptimalSize(
            containerWidth,
            containerHeight,
            this.isMobile
        );

        const canvas = this.app.view as HTMLCanvasElement;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        canvas.style.position = 'absolute';
        canvas.style.left = `${(containerWidth - width) / 2}px`;
        canvas.style.top = `${(containerHeight - height) / 2}px`;

        this.app.renderer.resize(
            GameConfig.gameWidth,
            GameConfig.gameHeight
        );

        if (this.animationManager) {
            this.animationManager.resize(width, height);
        }
    }

    private setupFullscreenHandling(): void {
        if (this.isMobile && !this.fullscreenEntered) {
            const enterFullscreen = async (event: Event) => {
                event.preventDefault();
                try {
                    if (!this.scaleManager.isInFullscreen()) {
                        await this.scaleManager.toggleFullscreen(this.container);
                        this.fullscreenEntered = true;
                        setTimeout(() => this.resizeApp(), 300);
                    }
                } catch (error) {
                    console.warn('Fullscreen activation failed:', error);
                }
            };

            this.container.addEventListener('click', enterFullscreen);
            this.container.addEventListener('touchstart', enterFullscreen, { passive: false });
        }

        const fullscreenChangeHandler = () => {
            setTimeout(() => this.resizeApp(), 100);
        };

        document.addEventListener('fullscreenchange', fullscreenChangeHandler);
        document.addEventListener('webkitfullscreenchange', fullscreenChangeHandler);
        document.addEventListener('mozfullscreenchange', fullscreenChangeHandler);
        document.addEventListener('MSFullscreenChange', fullscreenChangeHandler);
    }

    private setupDebugInfo(): void {
        const isDev = process.env.NODE_ENV === 'development';
        if (isDev) {
            this.debugElement = document.createElement('div');
            this.debugElement.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                color: #fff;
                background: rgba(0,0,0,0.7);
                padding: 5px 10px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 12px;
                z-index: 9999;
                pointer-events: none;
                opacity: 0.5;
            `;
            document.body.appendChild(this.debugElement);
            
            let frames = 0;
            let lastTime = Date.now();
            
            this.app.ticker.add(() => {
                frames++;
                const now = Date.now();
                if (now - lastTime >= 1000) {
                    if (this.debugElement) {
                        this.debugElement.textContent = `FPS: ${frames}`;
                    }
                    frames = 0;
                    lastTime = now;
                }
            });
        }
    }

    private showErrorFallback(): void {
        this.container.innerHTML = `
            <div style="
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100%;
                color: white;
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 20px;
                background: #0a0a1a;
            ">
                <div>
                    <h2>⚠️ Ошибка загрузки</h2>
                    <p>Пожалуйста, обновите страницу или используйте другой браузер</p>
                    <button onclick="location.reload()" style="
                        margin-top: 20px;
                        padding: 10px 30px;
                        background: #4ecdc4;
                        border: none;
                        border-radius: 5px;
                        color: #fff;
                        font-size: 16px;
                        cursor: pointer;
                    ">Обновить</button>
                </div>
            </div>
        `;
    }

    destroy(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if (this.animationManager) {
            this.animationManager.destroy();
        }
        if (this.app) {
            this.app.destroy(true, true);
        }
        if (this.debugElement) {
            this.debugElement.remove();
            this.debugElement = null;
        }
        this.initialized = false;
    }

    toggleFullscreen(): Promise<void> {
        return this.scaleManager.toggleFullscreen(this.container);
    }

    isInFullscreen(): boolean {
        return this.scaleManager.isInFullscreen();
    }
}