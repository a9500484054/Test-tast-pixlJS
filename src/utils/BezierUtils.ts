import { IPoint } from '../types';

export class BezierUtils {
    static quadraticBezier(
        t: number,
        p0: IPoint,
        p1: IPoint,
        p2: IPoint
    ): IPoint {
        const mt = 1 - t;
        const x = mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x;
        const y = mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y;
        return { x, y };
    }

    static cubicBezier(
        t: number,
        p0: IPoint,
        p1: IPoint,
        p2: IPoint,
        p3: IPoint
    ): IPoint {
        const mt = 1 - t;
        const x = mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 
                 3 * mt * t * t * p2.x + t * t * t * p3.x;
        const y = mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 
                 3 * mt * t * t * p2.y + t * t * t * p3.y;
        return { x, y };
    }

    static generateControlPoint(
        start: IPoint,
        end: IPoint,
        amplitude: number = 100
    ): IPoint {
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const perpAngle = angle + Math.PI / 2;
        
        const randomOffset = (Math.random() - 0.5) * 200;
        const distance = amplitude + randomOffset;
        
        return {
            x: midX + Math.cos(perpAngle) * distance,
            y: midY + Math.sin(perpAngle) * distance
        };
    }

    static calculateSinusoidalPath(
        start: IPoint,
        end: IPoint,
        steps: number,
        amplitude: number = 50
    ): IPoint[] {
        const points: IPoint[] = [];
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = start.x + (end.x - start.x) * t;
            const y = start.y + (end.y - start.y) * t + 
                     Math.sin(t * Math.PI * 3) * amplitude * (1 - Math.abs(2 * t - 1));
            points.push({ x, y });
        }
        return points;
    }

    static easeInOutCubic(t: number): number {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    static easeOutElastic(t: number): number {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : 
               Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }

    static easeInOutQuad(t: number): number {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
}