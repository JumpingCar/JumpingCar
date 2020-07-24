import * as p5 from 'p5';
import { Ray } from './ray';
import { Boundary } from './boundary';
export class Car {
    pos : p5.Vector
    vel : p5.Vector
    acc : p5.Vector
    dead : Boolean
    sight : number
    rays : Ray[] //무슨타입?
    angle : number

    constructor (p:p5, x:number, y:number) {
        this.pos = p.createVector(x, y);
        this.vel = p.createVector(1, 0);
        this.acc = p.createVector(1, 0);
        this.dead = false
        this.sight = 50
        this.rays = []
        this.angle = this.vel.angleBetween(p.createVector(1,0))
        for (let a = this.angle - p.PI/4 ; a < this.angle + p.PI/2 ; a+= p.PI/4) { //-45, 0 45도 3개의 ray
            this.rays.push(new Ray(this.pos, a))
        }
    }
    
    update(p:p5, Left_Right: Boolean[]) {
        if (!this.dead) {
        let theta : number;

            theta = -p.PI/2 //turn left
            let left : p5.Vector = p.createVector(
                this.vel.x * p.cos(theta) - this.vel.y * p.sin(theta),
                this.vel.x * p.sin(theta) + this.vel.y * p.cos(theta)
            )    

            theta = p.PI/2 //turn right
            let right : p5.Vector =  p.createVector(
                this.vel.x * p.cos(theta) - this.vel.y * p.sin(theta),
                this.vel.x * p.sin(theta) + this.vel.y * p.cos(theta)
            )
            
            
            if (Left_Right[0])
                this.acc = left
            if (Left_Right[1])
                this.acc = right
            
            this.acc.setMag(0.12);
            this.vel.add(this.acc);
            this.vel.limit(10);

            this.pos.add(this.vel);
        }
    }

    look(p:p5, walls : Boundary[]){
        for (let i = 0; i < this.rays.length; i++) {
            const ray = this.rays[i]
            let record = this.sight
            for (let wall of walls) {
                const pt = ray.cast(p, wall)
                if (pt) { // pt의 의미?
                    p.stroke(255, 0, 0)
                    p.line(this.pos.x, this.pos.y, pt.x, pt.y)
                    const d = p5.Vector.dist(this.pos, pt)
                    if(d < record && d < this.sight) {
                        record = d;
                    }
                }
            }
            if (record < 5) {
                this.dead = true
            }
        }
    }
    show(p:p5) {
        // p.stroke(255);
        p.fill(204, 102, 0)
        //p.strokeWeight(2);
        p.ellipse(this.pos.x, this.pos.y, 16)
        for (let ray of this.rays) {
            ray.show(p);
          }  
    }

    makeray(p:p5){
        this.rays = []
        this.angle = -this.vel.angleBetween(p.createVector(1, 0))
        this.rays.push(new Ray(this.pos, this.angle))
        for (let a = this.angle - p.PI/4 ; a < this.angle + p.PI/2 ; a+= p.PI/4) { //-45, 0 45도 3개의 ray
            this.rays.push(new Ray(this.pos, a))
        }
    }
    
    
}
