import * as PIXI from "pixi.js";
import { GameConfig } from "../config/GameConfig";
import { AnimationEntity } from "../entities/AnimationEntity";

export class AnimationManager {

    private readonly app: PIXI.Application;

    private readonly container: PIXI.Container;

    private readonly animation: AnimationEntity;

    private bounds = {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
    };

    constructor(app: PIXI.Application) {

        this.app = app;

        this.container = new PIXI.Container();

        this.app.stage.addChild(this.container);

        this.animation = new AnimationEntity(
            GameConfig.animationSize,
            GameConfig.minFrames
        );

        this.container.addChild(this.animation);

        this.updateBounds();

        this.center();

        this.initInteraction();

    }

    private initInteraction(): void {

        this.app.stage.eventMode = "static";

        this.app.stage.hitArea = this.app.screen;

        this.app.stage.on(
            "pointerdown",
            this.onPointerDown,
            this
        );

    }

    private onPointerDown(event: PIXI.FederatedPointerEvent): void {

        const p = event.global;

        this.moveTo(p.x, p.y);

    }

    private updateBounds(): void {

        const margin = GameConfig.animationSize / 2;

        this.bounds.left = margin;

        this.bounds.top = margin;

        this.bounds.right =
            this.app.screen.width - margin;

        this.bounds.bottom =
            this.app.screen.height - margin;

        this.app.stage.hitArea = this.app.screen;

    }

    private clamp(value: number, min: number, max: number): number {

        return Math.max(min, Math.min(max, value));

    }

    private moveTo(x: number, y: number): void {

        const targetX = this.clamp(
            x,
            this.bounds.left,
            this.bounds.right
        );

        const targetY = this.clamp(
            y,
            this.bounds.top,
            this.bounds.bottom
        );

        if (this.animation.isMoving()) {

            this.animation.interruptMovement();

        }

        this.animation.moveTo(
            {
                x: targetX,
                y: targetY
            },
            GameConfig.movementDuration
        );

    }

    private center(): void {

        this.animation.setPosition(

            this.app.screen.width / 2,

            this.app.screen.height / 2

        );

    }

    update(delta: number): void {

        this.animation.update(delta);

    }

    resize(width: number, height: number): void {

        this.app.stage.hitArea = new PIXI.Rectangle(
            0,
            0,
            width,
            height
        );

        this.updateBounds();

        if (!this.animation.isMoving()) {

            this.center();

        }

    }

    destroy(): void {

        this.app.stage.off(
            "pointerdown",
            this.onPointerDown,
            this
        );

        this.container.destroy({
            children: true
        });

    }

}