import * as p5 from 'p5';
import { Ray } from './ray';
import { Boundary } from './boundary';
import Matrix from './matrix';
import NeuralNetwork from './neuralnetwork';
import { Section } from './track'
import MathUtils from './utils/MathUtils'
import { jumpRay } from './jumpRay';

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
    obstacle: Boundary
    currentSection: number
    color: [number, number, number]
    isJumping : boolean
    jumpTime : number
    jumpDuration : number
    jumpRay : jumpRay
    jumpDistance : number
    jumpInput : number
    distance: number
    closeEncounter: number

    constructor (p: p5, startingPoint: p5.Vector, direction: p5.Vector, walls: Boundary[], obstacle: Boundary, sections: Section[]) {
        this.sight = 120
        this.reset(p, true, startingPoint, direction, walls, obstacle, [], sections)
        this.network = new NeuralNetwork(this.raySensor.length + 1, 8, 4)
        this.color = [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)]
    }

    static selection(cars: Car[], pairs: number): Car[][] {
        const maxFitness = cars.reduce((acc, cur) => Math.max(acc, cur.fitness), -1)

        // car of highest fitness gets 10 quotas
        const fitnessList = cars.reduce((list, car, idx) => {
            const quota = Math.floor(car.fitness / maxFitness * 10)
            return [ ...list, ...Array(quota).fill(idx) ]
        }, [])

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        return Array(pairs).fill(0).reduce((acc, _) => {
            const mom = fitnessList[Math.floor(Math.random() * fitnessList.length)]
            const dad = fitnessList[Math.floor(Math.random() * fitnessList.length)]
            return [ ...acc, [cars[mom], cars[dad]] ]
        }, [])
    }

    static adjust(output: Matrix): boolean[] {
        const maxIndex = [0, 1, 2, 3].reduce((acc, cur) => output.matrix[cur][0] > output.matrix[acc][0] ? cur : acc, 0)

        return [ 0 === maxIndex, 1 === maxIndex, 2 === maxIndex, 3 === maxIndex ]
    }

    update(p: p5, sections: Section[]): void {
        const output = this.network.feedforward(p.concat(this.raySensor, [this.jumpInput]))
        const decisions = Car.adjust(output)
        const max = Math.max(Math.max(output.matrix[0][0], output.matrix[1][0]), output.matrix[2][0])
        if (!this.dead) {

            if(this.isJumping) {

                if(this.jumpTime < this.jumpDuration / 2) {
                    this.radius += 0.2 //중력가속도
                    this.jumpTime += 1
                }

                if(this.jumpTime >= this.jumpDuration / 2) {
                    this.radius -= 0.2
                    this.jumpTime += 1
                }

                if(this.jumpTime >  this.jumpDuration) {
                    this.isJumping = false
                    this.jumpTime = 0
                    this.jumpDuration = 0
                    this.jumpInput = -100
                    this.jumpDistance = 0;
                }

                this.pos.add(this.vel);
                this.distance += this.vel.mag()

            } else {

            let theta : number;
            theta = -p.PI / 4 //turn left
            const left : p5.Vector = p.createVector(
                this.vel.x * p.cos(theta) - this.vel.y * p.sin(theta),
                this.vel.x * p.sin(theta) + this.vel.y * p.cos(theta)
            )

            theta = p.PI / 4 //turn right
            const right : p5.Vector =  p.createVector(
                this.vel.x * p.cos(theta) - this.vel.y * p.sin(theta),
                this.vel.x * p.sin(theta) + this.vel.y * p.cos(theta)
            )
            if (decisions[3]) {
                this.isJumping = true
                const v0 = this.vel.mag()
                this.vel = this.jumpRay.dir
                this.vel.setMag(v0)
                this.jumpDistance = this.jumpRay.dir.mag()
                this.jumpDuration = this.jumpDistance / v0
                this.pos.add(this.vel);
                this.distance += this.vel.mag()

            } else {
                if (decisions[0]) {
                    this.acc = left
                    this.acc.limit(1)
                    this.acc.rotate(-max / 100 * p.PI / 5)
                } else if (decisions[1]) {
                    this.acc = right
                    this.acc.limit(1)
                    this.acc.rotate(max / 100 * p.PI / 5)
                } else if (decisions[2]) {
                    this.acc.limit(0.02)
                }
                this.vel.add(this.acc);
                if (decisions[2])
                    this.vel.limit(5)
                else
                    this.vel.limit(10);
                this.pos.add(this.vel);
                this.distance += this.vel.mag()
                }
            }
        }
        this.show(p)
        this.makeray(p, sections)
        this.look(p)
        this.lookJump(p)
    }

    look(p: p5): void {
        for (let i = 0; i < this.rays.length; i++) {
            const ray = this.rays[i]
            let record = this.sight
            for (const wall of this.walls) {
                const pt = ray.cast(p, wall)
                if (pt) {
                    p.stroke(255, 92, 92)
                    p.line(this.pos.x, this.pos.y, pt.x, pt.y)
                    p.stroke(255)
                    const d = p5.Vector.dist(this.pos, pt)
                    this.raySensor[i] = this.sight - d
                    if(d < record && d < this.sight) {
                        record = d;
                    }
                    if (d * 4 < this.sight) {
                        this.closeEncounter += 1
                    }
                }
            }
            if (record < this.radius) {
                this.dead = true
                this.fitness = Math.sqrt((this.currentSection + 1) * this.distance / 100) - this.closeEncounter / this.rays.length
                if (this.fitness < 0)
                    this.fitness = 1
                // console.log("Current Distance ", this.distance)
                // console.log('Current Section: ', this.currentSection)
                // console.log('Close Encounter: ', this.closeEncounter)
            }
        }
    }

    lookJump(p: p5): void {
        if (!this.isJumping && this.obstacle !== null) {
            const jumpray = this.jumpRay
            const pt = jumpray.cast(p, this.obstacle)
            if (pt) {
                p.stroke(255, 92, 92)
                p.line(this.pos.x, this.pos.y, pt.x, pt.y)
                p.stroke(255)
                this.jumpInput = p5.Vector.dist(this.pos, pt)
            }
        }
        else
            this.jumpInput = - 100;
    }

    show(p: p5): void {
        p.fill(...this.color)
        p.noStroke()
        p.circle(this.pos.x, this.pos.y, this.radius * 2)
        for (const ray of this.rays) {
            ray.show(p);
        }
        p.stroke(255)
    }

    makeray(p: p5, sections: Section[]): void {
        this.angle = -this.vel.angleBetween(p.createVector(1, 0))
        this.rays = [
            new Ray(this.pos, this.angle - p.PI / 2, this.sight),
            new Ray(this.pos, this.angle - p.PI / 2.8, this.sight),
            new Ray(this.pos, this.angle - p.PI / 3.6, this.sight),
            new Ray(this.pos, this.angle - p.PI / 8, this.sight),
            new Ray(this.pos, this.angle, this.sight),
            new Ray(this.pos, this.angle + p.PI / 8, this.sight),
            new Ray(this.pos, this.angle + p.PI / 3.6, this.sight),
            new Ray(this.pos, this.angle + p.PI / 2.8, this.sight),
            new Ray(this.pos, this.angle + p.PI / 2, this.sight)
        ]

        //jumpRay
        const next = sections[(this.currentSection + 1) % sections.length]
        const nextnext = sections[(this.currentSection + 2) % sections.length]
        const destination = p5.Vector.add(next.mid, nextnext.mid).div(2);
        this.jumpRay = new jumpRay(this.pos, destination);
    }

    setWalls(walls: Boundary[]): void {
        this.walls = walls
    }

    updateCurrentSection(p: p5, sections: Section[]): void {
        const cur = sections[this.currentSection % sections.length]
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
            this.currentSection += 1
        }
    }

    applyGenes(genes: number[]): void {
        this.network.importGenes(genes)
    }

    reset(p: p5, first: boolean, startingPoint: p5.Vector, direction: p5.Vector, walls: Boundary[], obstacle: Boundary,  genes: number[], sections: Section[]): void {
        this.pos = startingPoint.copy()
        this.vel = direction.copy()
        this.acc = direction.copy()
        this.currentSection = 0
        this.radius = 14
        this.walls = walls
        this.obstacle = obstacle
        if (!first)
            this.network.importGenes(genes)
        this.makeray(p, sections)
        this.dead = false
        this.fitness = 0
        this.closeEncounter = 0
        this.raySensor = new Array(this.rays.length).fill(-this.sight)
        this.distance = 0
        this.jumpDistance = 0
        this.isJumping = false
        this.jumpTime = 0;
        this.jumpDuration = 0;
        this.jumpInput = -100;
    }
}
