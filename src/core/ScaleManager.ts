import { GameConfig } from '../config/GameConfig';
import { IScaleOptions } from '../types';

export class ScaleManager {
    private static instance: ScaleManager;
    private scaleFactor: number = 1;
    private isFullscreen: boolean = false;
    private currentWidth: number = 0;
    private currentHeight: number = 0;

    static getInstance(): ScaleManager {
        if (!ScaleManager.instance) {
            ScaleManager.instance = new ScaleManager();
        }
        return ScaleManager.instance;
    }

    calculateScale(options: IScaleOptions): number {
        const scaleX = options.width / options.maxWidth;
        const scaleY = options.height / options.maxHeight;
        
        let scale: number;
        switch (options.scaleMode) {
            case 'fit':
                scale = Math.min(scaleX, scaleY);
                break;
            case 'fill':
                scale = Math.max(scaleX, scaleY);
                break;
            case 'cover':
                scale = Math.min(scaleX, scaleY);
                break;
            default:
                scale = Math.min(scaleX, scaleY);
        }
        
        this.scaleFactor = Math.min(Math.max(scale, GameConfig.minScale), 1);
        return this.scaleFactor;
    }

    getScaleFactor(): number {
        return this.scaleFactor;
    }

    toggleFullscreen(element: HTMLElement): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
                    const requestFullscreen = element.requestFullscreen || 
                                            (element as any).webkitRequestFullscreen;
                    if (requestFullscreen) {
                        requestFullscreen.call(element);
                        this.isFullscreen = true;
                        resolve();
                    } else {
                        reject(new Error('Fullscreen API not supported'));
                    }
                } else {
                    const exitFullscreen = document.exitFullscreen || 
                                         (document as any).webkitExitFullscreen;
                    if (exitFullscreen) {
                        exitFullscreen.call(document);
                        this.isFullscreen = false;
                        resolve();
                    } else {
                        reject(new Error('Exit fullscreen not supported'));
                    }
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    isInFullscreen(): boolean {
        return this.isFullscreen || 
               !!document.fullscreenElement || 
               !!(document as any).webkitFullscreenElement;
    }

    getOptimalSize(
        containerWidth: number,
        containerHeight: number,
        isMobile: boolean = false
    ): { width: number; height: number; scale: number } {
        let maxWidth = containerWidth;
        let maxHeight = containerHeight;
        
        if (!isMobile) {
            maxWidth = Math.min(containerWidth, GameConfig.maxDesktopWidth);
            maxHeight = Math.min(containerHeight, GameConfig.maxDesktopHeight);
        } else {
            maxWidth = Math.min(containerWidth, GameConfig.mobileMaxWidth);
            maxHeight = Math.min(containerHeight, GameConfig.mobileMaxHeight);
        }

        const aspectRatio = GameConfig.gameWidth / GameConfig.gameHeight;
        let width = maxWidth;
        let height = maxHeight;
        
        const scaleX = width / GameConfig.gameWidth;
        const scaleY = height / GameConfig.gameHeight;
        const scale = Math.min(scaleX, scaleY);
        
        width = GameConfig.gameWidth * scale;
        height = GameConfig.gameHeight * scale;
        
        this.currentWidth = width;
        this.currentHeight = height;
        this.scaleFactor = scale;
        
        return { width, height, scale };
    }

    getCurrentSize(): { width: number; height: number } {
        return {
            width: this.currentWidth,
            height: this.currentHeight
        };
    }
}