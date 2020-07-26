// Daniel Shiffman
// https://thecodingtrain.com/CodingChallenges/145-2d-ray-casting.html
// https://youtu.be/TOEi6T2mtHo
import * as p5 from 'p5';
import { Vector } from "p5";
import { Boundary } from './boundary';

// 2D Ray Casting

export class Ray {
    pos : Vector
    angle : number
    dir : Vector
    destination : Vector

    constructor(pos : Vector, angle : number, length : number) {
        this.pos = pos;
        this.dir = p5.Vector.fromAngle(angle, length);
    }

    lookAt(p : p5, x : number, y : number) : void{
        this.dir.x = x - this.pos.x;
        this.dir.y = y - this.pos.y;
        this.dir.normalize();
    }

    show(p:p5) :void {
        p.stroke(255);
        p.push();
        p.translate(this.pos.x, this.pos.y);
        p.line(0, 0, this.dir.x, this.dir.y);
        p.pop();
    }

    cast(p:p5, wall:Boundary) : Vector {
        const x1 = wall.a.x;
        const y1 = wall.a.y;
        const x2 = wall.b.x;
        const y2 = wall.b.y;

        const x3 = this.pos.x;
        const y3 = this.pos.y;
        const x4 = this.pos.x + this.dir.x;
        const y4 = this.pos.y + this.dir.y;

        const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (den == 0) {
            return;
        }

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;

        if (t > 0 && t < 1 && u > 0 && u < 1) {
            const pt = p.createVector();
            pt.x = x1 + t * (x2 - x1);
            pt.y = y1 + t * (y2 - y1);
            return pt;
        } else {
            return;
        }
    }
}

