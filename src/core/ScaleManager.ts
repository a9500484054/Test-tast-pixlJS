import { GameConfig } from "../config/GameConfig";

export class ScaleManager {
    private static instance: ScaleManager;
    private currentWidth = 0;
    private currentHeight = 0;
    private scaleFactor = 1;

    static getInstance(): ScaleManager {
        if (!ScaleManager.instance) {
            ScaleManager.instance = new ScaleManager();
        }
        return ScaleManager.instance;
    }

    getOptimalSize(
        containerWidth: number,
        containerHeight: number,
        isMobile = false
    ): {
        width: number;
        height: number;
        scale: number;
    } {
        const gameWidth = GameConfig.gameWidth;
        const gameHeight = GameConfig.gameHeight;
        const aspectRatio = gameWidth / gameHeight;

        // Для мобильных - используем всю доступную ширину/высоту
        if (isMobile) {
            // Пытаемся занять всю ширину
            let width = Math.min(containerWidth, GameConfig.mobileMaxWidth);
            let height = width / aspectRatio;
            
            // Если высота больше доступной - подгоняем по высоте
            if (height > containerHeight) {
                height = Math.min(containerHeight, GameConfig.mobileMaxHeight);
                width = height * aspectRatio;
            }
            
            // Если ширина все еще больше доступной - подгоняем
            if (width > containerWidth) {
                width = Math.min(containerWidth, GameConfig.mobileMaxWidth);
                height = width / aspectRatio;
            }
            
            // Если высота все еще больше доступной - подгоняем
            if (height > containerHeight) {
                height = Math.min(containerHeight, GameConfig.mobileMaxHeight);
                width = height * aspectRatio;
            }
            
            const scale = Math.min(width / gameWidth, height / gameHeight);
            
            this.scaleFactor = Math.max(scale, GameConfig.minScale);
            this.currentWidth = width;
            this.currentHeight = height;
            
            return {
                width,
                height,
                scale: this.scaleFactor
            };
        } else {
            // Для десктопа - ограничиваем максимальными размерами
            let maxWidth = Math.min(containerWidth, GameConfig.maxDesktopWidth);
            let maxHeight = Math.min(containerHeight, GameConfig.maxDesktopHeight);
            
            let scaleX = maxWidth / gameWidth;
            let scaleY = maxHeight / gameHeight;
            let scale = Math.min(scaleX, scaleY);
            
            scale = Math.max(scale, GameConfig.minScale);
            
            const width = Math.round(gameWidth * scale);
            const height = Math.round(gameHeight * scale);
            
            this.scaleFactor = scale;
            this.currentWidth = width;
            this.currentHeight = height;
            
            return {
                width,
                height,
                scale
            };
        }
    }

    getScaleFactor(): number {
        return this.scaleFactor;
    }

    getCurrentSize(): {
        width: number;
        height: number;
    } {
        return {
            width: this.currentWidth,
            height: this.currentHeight
        };
    }

    async toggleFullscreen(element: HTMLElement): Promise<void> {
        try {
            if (!document.fullscreenElement) {
                await element.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (error) {
            console.warn("Fullscreen unavailable:", error);
        }
    }

    isInFullscreen(): boolean {
        return !!document.fullscreenElement;
    }
}