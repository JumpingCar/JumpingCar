import * as p5 from 'p5';
import { Ray } from './ray';
import { Boundary } from './boundary';
import Matrix from './matrix';
import NeuralNetwork from './neuralnetwork';

export class Car {
    pos : p5.Vector
    vel : p5.Vector
    acc : p5.Vector
    dead : boolean
    sight : number
    rays : Ray[]
    angle : number
    network: NeuralNetwork
    raySensor: number[]
    fitness: number
    radius: number

    constructor (p:p5, x:number, y:number) {
        this.pos = p.createVector(x, y);
        this.vel = p.createVector(1, 0);
        this.acc = p.createVector(1, 0);
        this.dead = false
        this.sight = 50
        this.angle = this.vel.angleBetween(p.createVector(1,0))
        this.network = new NeuralNetwork(3, 4, 2)
        this.raySensor = new Array(3).fill(this.sight)
        this.fitness = 0
        this.radius = 8

        this.rays = [
            new Ray(this.pos, this.angle - p.PI / 4),
            new Ray(this.pos, this.angle),
            new Ray(this.pos, this.angle + p.PI / 4)
        ]
    }

    static adjust(output: Matrix): boolean[] {
        const max = Math.max(output.matrix[0][0], output.matrix[1][0])

        return [
            max > 0.9 && max === output.matrix[0][0],
            max > 0.9 && max === output.matrix[1][0]
        ]
    }

    update(p: p5, input: number[]): void {
        const output = this.network.feedforward(input)
        const decisions = Car.adjust(output)

        if (!this.dead) {
            let theta : number;
            theta = -p.PI / 2 //turn left
            const left : p5.Vector = p.createVector(
                this.vel.x * p.cos(theta) - this.vel.y * p.sin(theta),
                this.vel.x * p.sin(theta) + this.vel.y * p.cos(theta)
            )

            theta = p.PI / 2 //turn right
            const right : p5.Vector =  p.createVector(
                this.vel.x * p.cos(theta) - this.vel.y * p.sin(theta),
                this.vel.x * p.sin(theta) + this.vel.y * p.cos(theta)
            )

            if (decisions[0])
                this.acc = left
            if (decisions[1])
                this.acc = right

            this.acc.setMag(0.12);
            this.vel.add(this.acc);
            this.vel.limit(10);

            this.pos.add(this.vel);
            this.fitness += this.vel.mag()
        }
    }

    look(p: p5, walls: Boundary[]): void {
        for (let i = 0; i < this.rays.length; i++) {
            const ray = this.rays[i]
            let record = this.sight
            for (const wall of walls) {
                const pt = ray.cast(p, wall)
                if (pt) {
                    p.stroke(255, 0, 0)
                    p.line(this.pos.x, this.pos.y, pt.x, pt.y)
                    const d = p5.Vector.dist(this.pos, pt)
                    this.raySensor[i] = d
                    if(d < record && d < this.sight) {
                        record = d;
                    }
                }
            }
            if (record < this.radius) {
                this.dead = true
                console.log(this.fitness)
            }
        }
    }

    show(p: p5): void {
        // p.stroke(255);
        p.fill(204, 102, 0)
        //p.strokeWeight(2);
        p.ellipse(this.pos.x, this.pos.y, this.radius * 2)
        for (const ray of this.rays) {
            ray.show(p);
        }
    }

    makeray(p: p5): void {
        this.angle = -this.vel.angleBetween(p.createVector(1, 0))
        this.rays = [
            new Ray(this.pos, this.angle - p.PI / 4),
            new Ray(this.pos, this.angle),
            new Ray(this.pos, this.angle + p.PI / 4)
        ]
    }
}
