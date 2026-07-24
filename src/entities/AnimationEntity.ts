import * as PIXI from "pixi.js";
import { AnimationConfig } from "../config/GameConfig";
import {
    IPoint,
    IAnimationState,
    IParticleData
} from "../types";
import { BezierUtils } from "../utils/BezierUtils";


export class AnimationEntity extends PIXI.Container {


    private graphics: PIXI.Graphics;

    private particles: PIXI.Sprite[] = [];

    private state: IAnimationState;


    private shapeSize:number;

    private totalFrames:number;

    private frameCounter = 0;


    private moveStartPosition:IPoint = {
        x:0,
        y:0
    };


    private moveStartTime = 0;

    private moveDuration = 1200;



    constructor(
        size:number,
        totalFrames:number = 5
    ){

        super();


        this.shapeSize = size;


        this.totalFrames =
            Math.max(totalFrames,5);



        this.state = {

            isPlaying:true,

            currentFrame:0,

            totalFrames:this.totalFrames,

            position:{
                x:0,
                y:0
            },

            targetPosition:null,

            isMoving:false,

            progress:0,

            startPosition:{
                x:0,
                y:0
            }

        };



        this.graphics =
            new PIXI.Graphics();


        this.addChild(
            this.graphics
        );


        this.createParticles();


        this.drawShape();


    }





    private createParticles(){

        for(
            let i=0;
            i<AnimationConfig.particleCount;
            i++
        ){


            const sprite =
                new PIXI.Sprite(
                    PIXI.Texture.WHITE
                );


            const size =
                AnimationConfig.particleSizeMin +
                Math.random() *
                (
                    AnimationConfig.particleSizeMax -
                    AnimationConfig.particleSizeMin
                );


            sprite.width=size;

            sprite.height=size;


            sprite.anchor.set(0.5);



            sprite.tint =
                AnimationConfig.colors[
                    i %
                    AnimationConfig.colors.length
                ];



            const angle =
                Math.random() *
                Math.PI *
                2;



            const radius =
                100 +
                Math.random()*120;



            const data:IParticleData={

                angle,

                radius,

                speed:
                    0.003 +
                    Math.random()*0.01,


                offset:
                    Math.random() *
                    Math.PI *
                    2,


                initialX:
                    Math.cos(angle)*radius,


                initialY:
                    Math.sin(angle)*radius,


                phase:
                    Math.random()

            };



            sprite.position.set(
                data.initialX,
                data.initialY
            );



            (sprite as any).data=data;



            this.particles.push(sprite);


            this.addChild(sprite);

        }


    }







    private drawShape(){


        const size =
            this.shapeSize;



        this.graphics.clear();



        this.graphics.beginFill(
            AnimationConfig.colors[0],
            0.18
        );


        this.graphics.drawCircle(
            0,
            0,
            size*0.5
        );


        this.graphics.endFill();



        const radius =
            size*0.35;



        const sides =
            AnimationConfig.polygonSides;



        for(
            let i=0;
            i<sides;
            i++
        ){


            const a1 =
                i/sides*
                Math.PI*2;


            const a2 =
                (i+1)/sides*
                Math.PI*2;



            this.graphics.beginFill(
                AnimationConfig.colors[
                    i %
                    AnimationConfig.colors.length
                ],
                0.5
            );


            this.graphics.moveTo(
                0,
                0
            );


            this.graphics.lineTo(
                Math.cos(a1)*radius,
                Math.sin(a1)*radius
            );


            this.graphics.lineTo(
                Math.cos(a2)*radius,
                Math.sin(a2)*radius
            );


            this.graphics.closePath();


            this.graphics.endFill();


        }



        this.graphics.beginFill(
            0xffffff,
            0.9
        );


        this.graphics.drawCircle(
            0,
            0,
            6
        );


        this.graphics.endFill();


    }








    update(delta:number){


        if(!this.state.isPlaying)
            return;



        const dt =
            Math.min(
                delta / 16.666,
                3
            );



        this.updateParticles(dt);



        this.rotation +=
            AnimationConfig.rotationSpeed *
            dt;



        const pulse =
            1 +
            Math.sin(
                performance.now() *
                AnimationConfig.pulseSpeed
            ) *
            0.05;



        this.scale.set(
            pulse
        );



        if(
            this.state.isMoving
        ){

            this.updateMovement();

        }



        this.frameCounter += dt;


        if(
            this.frameCounter > 3
        ){

            this.frameCounter=0;


            this.state.currentFrame =
                (
                    this.state.currentFrame+1
                )
                %
                this.totalFrames;

        }


    }









    private updateMovement(){


        if(
            !this.state.targetPosition
        )
            return;



        const elapsed =
            performance.now() -
            this.moveStartTime;



        const progress =
            Math.min(
                elapsed /
                this.moveDuration,
                1
            );



        const eased =
            BezierUtils.easeInOutCubic(
                progress
            );



        this.x =
            this.moveStartPosition.x +
            (
                this.state.targetPosition.x -
                this.moveStartPosition.x
            )
            *
            eased;



        this.y =
            this.moveStartPosition.y +
            (
                this.state.targetPosition.y -
                this.moveStartPosition.y
            )
            *
            eased;



        this.state.progress =
            progress;



        if(progress>=1){


            this.x =
                this.state.targetPosition.x;


            this.y =
                this.state.targetPosition.y;



            this.state.isMoving=false;


            this.state.targetPosition=null;


        }


    }








    private updateParticles(delta:number){


        const time =
            performance.now()/1000;



        for(
            const particle of this.particles
        ){


            const data =
                (particle as any)
                .data as IParticleData;



            data.angle +=
                data.speed *
                delta;



            const r =
                data.radius +
                Math.sin(
                    time +
                    data.offset
                )
                *
                20;



            particle.position.set(

                Math.cos(data.angle)
                *
                r,


                Math.sin(data.angle)
                *
                r

            );


        }


    }








    moveTo(
        target:IPoint,
        duration:number=1200
    ){


        this.moveStartPosition={
            x:this.x,
            y:this.y
        };


        this.state.targetPosition={
            x:target.x,
            y:target.y
        };


        this.state.isMoving=true;


        this.moveStartTime =
            performance.now();


        this.moveDuration =
            duration;



    }






    interruptMovement(){


        this.state.isMoving=false;

        this.state.targetPosition=null;


    }






    isMoving(){

        return this.state.isMoving;

    }





    setPosition(
        x:number,
        y:number
    ){

        this.x=x;

        this.y=y;


    }





    getCurrentPosition(){

        return {
            x:this.x,
            y:this.y
        };

    }







    getState(){

        return {
            ...this.state
        };

    }







    destroy(){

        this.particles.forEach(
            p=>p.destroy()
        );


        this.particles=[];


        super.destroy({
            children:true
        });


    }


}