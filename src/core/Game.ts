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
    private canvasWrapper: HTMLDivElement;

    constructor(container: HTMLElement) {
        this.container = container;
        this.scaleManager = ScaleManager.getInstance();
        this.isMobile = this.detectMobile();
        
        this.canvasWrapper = document.createElement('div');
        this.canvasWrapper.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            justify-content: center;
            align-items: center;
            pointer-events: none;
        `;
        this.container.appendChild(this.canvasWrapper);
        
        this.init();
    }

    private async init(): Promise<void> {
        try {
            await this.initApplication();
            this.setupResize();
            this.setupFullscreenHandling();
            this.setupDebugInfo();
            this.initialized = true;
        } catch (error) {
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

        const canvas = this.app.view as HTMLCanvasElement;
        canvas.style.display = 'block';
        canvas.style.position = 'relative';
        canvas.style.pointerEvents = 'auto';
        canvas.style.zIndex = '1';
        this.canvasWrapper.appendChild(canvas);

        this.animationManager = new AnimationManager(this.app);
        
        this.app.ticker.add(() => {
            if (this.animationManager) {
                this.animationManager.update(this.app.ticker.deltaMS);
            }
        });

        setTimeout(() => this.resizeApp(), 100);
        setTimeout(() => this.resizeApp(), 300);
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
        if (!this.initialized || !this.app) return;

        const containerRect = this.container.getBoundingClientRect();
        const containerWidth = containerRect.width || window.innerWidth;
        const containerHeight = containerRect.height || window.innerHeight;

        const { width, height } = this.scaleManager.getOptimalSize(
            containerWidth,
            containerHeight,
            this.isMobile
        );

        const canvas = this.app.view as HTMLCanvasElement;
        
        if (this.isMobile) {
            this.canvasWrapper.style.width = '100%';
            this.canvasWrapper.style.height = '100%';
            this.canvasWrapper.style.transform = 'none';
            this.canvasWrapper.style.top = '0';
            this.canvasWrapper.style.left = '0';
            
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
            canvas.style.maxWidth = '100vw';
            canvas.style.maxHeight = '100vh';
            canvas.style.objectFit = 'contain';
        } else {
            this.canvasWrapper.style.width = `${width}px`;
            this.canvasWrapper.style.height = `${height}px`;
            this.canvasWrapper.style.transform = 'translate(-50%, -50%)';
            this.canvasWrapper.style.top = '50%';
            this.canvasWrapper.style.left = '50%';
            
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.maxWidth = 'none';
            canvas.style.maxHeight = 'none';
            canvas.style.objectFit = 'none';
        }

        this.app.renderer.resize(
            GameConfig.gameWidth,
            GameConfig.gameHeight
        );

        if (this.app.stage) {
            this.app.stage.hitArea = new PIXI.Rectangle(0, 0, width, height);
        }

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
                bottom: 10px;
                left: 10px;
                color: #fff;
                background: rgba(0,0,0,0.7);
                padding: 8px 12px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 11px;
                z-index: 9999;
                pointer-events: none;
                opacity: 0.7;
                line-height: 1.4;
            `;
            document.body.appendChild(this.debugElement);
            
            let frames = 0;
            let lastTime = Date.now();
            
            this.app.ticker.add(() => {
                frames++;
                const now = Date.now();
                if (now - lastTime >= 1000) {
                    if (this.debugElement) {
                        const size = this.scaleManager.getCurrentSize();
                        this.debugElement.textContent = 
                            `FPS: ${frames}\n` +
                            `Size: ${Math.round(size.width)}x${Math.round(size.height)}\n` +
                            `Mode: ${this.isMobile ? 'Mobile' : 'Desktop'}\n` +
                            `Container: ${Math.round(window.innerWidth)}x${Math.round(window.innerHeight)}`;
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