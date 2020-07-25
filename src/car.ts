import * as p5 from 'p5';
import { Ray } from './ray';
import { Boundary } from './boundary';
import Matrix from './matrix';
import NeuralNetwork from './neuralnetwork';
import { Section } from './track'
import MathUtils from './utils/MathUtils'

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
    walls: Boundary[]
    currentSection: number

    constructor (p: p5, startingPoint: p5.Vector, direction: p5.Vector, walls: Boundary[]) {
        this.pos = startingPoint.copy()
        this.vel = direction.copy()
        this.acc = direction.copy()
        this.dead = false
        this.sight = 50
        this.angle = this.vel.angleBetween(p.createVector(1,0))
        this.network = new NeuralNetwork(3, 4, 2)
        this.raySensor = new Array(3).fill(this.sight)
        this.fitness = 0
        this.radius = 8
        this.walls = walls
        this.currentSection = 0
        this.rays = [
            new Ray(this.pos, this.angle - p.PI / 4),
            new Ray(this.pos, this.angle),
            new Ray(this.pos, this.angle + p.PI / 4)
        ]
    }

    static selection(cars: Car[], pairs: number): Car[] {
        const fitnessSum = cars.reduce((acc, cur) => acc + cur.fitness, 0)

        // car of highest fitness gets 10 quotas
        const fitnessList = cars.reduce((list, car, idx) => {
            const quota = Math.floor(car.fitness / fitnessSum * 10)
            return [ ...list, Array(quota).fill(idx)  ]
        }, [])

        return Array(pairs).fill(0).reduce((acc, _) => {
            const mom = fitnessList[Math.floor(Math.random() * fitnessList.length)]
            const dad = fitnessList[Math.floor(Math.random() * fitnessList.length)]
            return [ ...acc, [mom, dad] ]
        }, [])
    }

    static adjust(output: Matrix): boolean[] {
        const max = Math.max(output.matrix[0][0], output.matrix[1][0])

        return [
            max > 0.5 && max === output.matrix[0][0],
            max > 0.5 && max === output.matrix[1][0]
        ]
    }

    update(p: p5): void {
        this.makeray(p)
        this.look(p)

        const output = this.network.feedforward(this.raySensor)
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
        }
    }

    look(p: p5): void {
        for (let i = 0; i < this.rays.length; i++) {
            const ray = this.rays[i]
            let record = this.sight
            for (const wall of this.walls) {
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
                this.fitness = this.currentSection
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

    setWalls(walls: Boundary[]): void {
        this.walls = walls
    }

    updateCurrentSection(p: p5, sections: Section[]): void {
        const cur = sections[this.currentSection]
        const next = sections[(this.currentSection + 1) % sections.length]
        const nextnext = sections[(this.currentSection + 2) % sections.length]

        const tri1 = MathUtils.triangleSize(this.pos, cur.left, cur.right)
        const tri2 = MathUtils.triangleSize(this.pos, cur.right, next.right)
        const tri3 = MathUtils.triangleSize(this.pos, next.right, next.left)
        const tri4 = MathUtils.triangleSize(this.pos, next.left, cur.left)
        const sum = tri1 + tri2 + tri3 + tri4

        const quadrilateral = MathUtils.triangleSize(cur.left, cur.right, next.right) + MathUtils.triangleSize(next.right, next.left, cur.left)

        if (Math.abs(quadrilateral - sum) >= 1e-2) {
            this.walls = [
                new Boundary(p, next.left.x, next.left.y, nextnext.left.x, nextnext.left.y),
                new Boundary(p, next.right.x, next.right.y, nextnext.right.x, nextnext.right.y)
            ]
            this.currentSection  = (this.currentSection + 1) % sections.length
        }
    }
}
