// Daniel Shiffman
// https://thecodingtrain.com/CodingChallenges/145-2d-ray-casting.html
// https://youtu.be/TOEi6T2mtHo

import * as p5 from "p5";

// 2D Ray Casting

export class Boundary {
    a:p5.Vector
    b:p5.Vector

    constructor(p:p5, x1:number, y1:number, x2:number, y2:number) {
      this.a = p.createVector(x1, y1);
      this.b = p.createVector(x2, y2);
    }
  
    show(p:p5) {
      p.stroke(255);
      p.strokeWeight(3);
      p.line(this.a.x, this.a.y, this.b.x, this.b.y);
    }
  }
  