import { Game } from './core/Game';

if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function(callback: FrameRequestCallback): number {
        return window.setTimeout(callback, 1000 / 60);
    } as any;
}

if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function(id: number): void {
        window.clearTimeout(id);
    };
}

const handleError = (error: Error) => {
    console.error('Application error:', error);
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = `
            <div style="
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                color: #fff;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                text-align: center;
                padding: 20px;
                background: #0a0a1a;
            ">
                <div>
                    <h1 style="font-size: 24px; margin-bottom: 10px;">⚠️ Произошла ошибка</h1>
                    <p style="color: #888;">${error.message || 'Неизвестная ошибка'}</p>
                    <button onclick="location.reload()" style="
                        margin-top: 20px;
                        padding: 10px 30px;
                        background: #4ecdc4;
                        border: none;
                        border-radius: 5px;
                        color: #fff;
                        font-size: 16px;
                        cursor: pointer;
                    ">Обновить страницу</button>
                </div>
            </div>
        `;
    }
};

const app = document.getElementById('app');
if (!app) {
    throw new Error('App container not found');
}

app.innerHTML = '';

let game: Game | null = null;

try {
    game = new Game(app);
} catch (error) {
    handleError(error as Error);
}

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    handleError(event.error || new Error('Unknown error'));
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled rejection:', event.reason);
    handleError(event.reason || new Error('Unhandled promise rejection'));
});

if (import.meta.env && import.meta.env.DEV) {
    (window as any).__game = game;
}

console.log('Application started successfully');

document.addEventListener('visibilitychange', () => {
    if (document.hidden && game) {
        console.log('Page hidden, reducing performance');
    } else if (!document.hidden && game) {
        console.log('Page visible, resuming');
    }
});