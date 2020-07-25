import * as p5 from 'p5'
import { Car } from './car'
import { Boundary } from './boundary'

export interface Section {
    left: p5.Vector
    right: p5.Vector
    mid: p5.Vector
}

export default class Track {
    points: p5.Vector[]
    hull: p5.Vector[]
    controlPoints: p5.Vector[][]
    sections: Section[]
    curve: boolean[]
    maxDistance: number
    cars: Car[]
    population: number

    public setup(p: p5): void {
        p.background(230)
        const pointCount = Math.floor(Math.random() * 20 + 10)
        this.points = []
        for (let i = 0; i < pointCount; i++)
            this.points.push(p.createVector(
                0.5 * (Math.random() * p.width  - p.width  / 2),
                0.5 * (Math.random() * p.height - p.height / 2)
            ))

        this.points.sort((a: p5.Vector, b: p5.Vector): number => a.x - b.x)
        this.initializeConvexHull()
        for (let i = 0; i < 5; i++) {
            this.fixAngles(p)
            this.pushApart(p)
        }

        this.maxDistance = -1
        for (let i = 0; i < this.hull.length; i++) {
            const dist = p5.Vector.sub(this.hull[i], this.hull[(i + 1) % this.hull.length]).mag()
            if (this.maxDistance < dist)
                this.maxDistance = dist
        }

        this.initializeCurve(p)
        const startingPoint = p5.Vector.add(this.sections[0].mid, this.sections[1].mid).mult(0.5)

        this.population = 10
        this.cars = []
        const initialWalls = [
            new Boundary(p, this.sections[0].left.x, this.sections[0].left.y, this.sections[0].right.x, this.sections[0].right.y),
            new Boundary(p, this.sections[0].left.x, this.sections[0].left.y, this.sections[1].left.x, this.sections[1].left.y),
            new Boundary(p, this.sections[0].right.x, this.sections[0].right.y, this.sections[1].right.x, this.sections[1].right.y)
        ]

        const perpVec = p5.Vector.sub(this.sections[0].right, this.sections[0].left).normalize().rotate(p.HALF_PI)
        for (let i = 0; i < this.population; i++) {
            this.cars.push(new Car(p, startingPoint, perpVec, initialWalls))
        }
    }

    public draw(p: p5): void {
        p.translate(p.width / 2 - this.cars[0].pos.x, p.height / 2 - this.cars[0].pos.y)

        for (const car of this.cars) {
            car.update(p)
            car.show(p)
            car.updateCurrentSection(p, this.sections)
        }

        // draw track
        p.strokeWeight(3)
        p.stroke(107, 164, 255)
        for (let i = 0; i < this.sections.length; i++) {
            const next = (i + 1) % this.sections.length
            p.line(this.sections[i].left.x, this.sections[i].left.y, this.sections[i].right.x, this.sections[i].right.y)
            p.line(this.sections[i].left.x, this.sections[i].left.y, this.sections[next].left.x, this.sections[next].left.y)
            p.line(this.sections[i].right.x, this.sections[i].right.y, this.sections[next].right.x, this.sections[next].right.y)
        }
        p.stroke(0)
        p.strokeWeight(1)
    }

    initializeConvexHull(): void {
        this.hull = []
        const leftMost = this.points[0]
        let nextVertex = this.points[1]
        let currentVertex = leftMost
        this.hull.push(currentVertex)
        for (;;) {
            for (let index = 0; index < this.points.length; index++) {
                const checking = this.points[index]

                const a = p5.Vector.sub(nextVertex, currentVertex)
                const b = p5.Vector.sub(checking, currentVertex)
                const cross = a.cross(b)

                if (cross.z < 0)
                    nextVertex = checking
            }

            if (nextVertex === leftMost)
                break

            this.hull.push(nextVertex)
            currentVertex = nextVertex
            nextVertex = leftMost
        }

        if (this.hull.length % 2 === 1)
            this.hull = this.hull.slice(0, this.hull.length - 1)
    }

    pushApart(p: p5): void {
        const dist = 200
        for (let i = 0; i < this.hull.length; i++)
        for (let j = i + 1; j < this.hull.length; j++)
            if (this.hull[i].dist(this.hull[j]) < dist) {
                const hl = this.hull[i].dist(this.hull[j])
                const diff = dist - hl
                const hx = (this.hull[j].x - this.hull[i].x) * diff / hl
                const hy = (this.hull[j].y - this.hull[i].y) * diff / hl
                const vec = p.createVector(hx, hy)
                this.hull[j].add(vec)
                this.hull[i].sub(vec)
            }
    }

    fixAngles(p: p5): void {
        for (let i = 0; i < this.hull.length; i++) {
            const previous = (i - 1 < 0) ? this.hull.length - 1 : i - 1
            const next = (i + 1) % this.hull.length
            const curToPrev = p5.Vector.sub(this.hull[previous], this.hull[i])
            const curToNext = p5.Vector.sub(this.hull[next], this.hull[i])

            const angle = p.acos(p5.Vector.dot(curToPrev, curToNext) / (curToPrev.mag() * curToNext.mag()))

            if (angle >= 2 / 3 * p.PI)
                continue

            const theta = -2 / 3 * p.PI + angle

            this.hull[next] = p5.Vector.add(this.hull[i], p.createVector(
                curToNext.x * p.cos(theta) - curToNext.y * p.sin(theta),
                curToNext.x * p.sin(theta) + curToNext.y * p.cos(theta)
            ))
        }
    }

    initializeCurve(p: p5): void {
        this.curve = this.hull.map((_, idx) => idx % 2 === 0)
        this.controlPoints = []
        for (let i = 0; i < this.hull.length; i++) {
            const next = (i + 1) % this.hull.length
            const dirVec = p5.Vector.sub(this.hull[next], this.hull[i]).normalize().mult(300)

            const rotationAngle = p.PI / 3
            const cwVec = p.createVector(
                dirVec.x * p.cos(rotationAngle) - dirVec.y * p.sin(rotationAngle),
                dirVec.x * p.sin(rotationAngle) + dirVec.y * p.cos(rotationAngle)
            )

            const nextCP = p5.Vector.add(this.hull[i], cwVec)
            if (i === 0) {
                this.controlPoints.push([ null, nextCP ])
            } else {
                const parVec = p5.Vector.sub(this.controlPoints[i - 1][1], this.hull[i - 1])
                const cp1 = p5.Vector.sub(this.hull[next], parVec)
                this.controlPoints.push([ cp1, nextCP ])
            }
        }

        this.controlPoints[0][0] = p5.Vector.sub(
            this.hull[0],
            p5.Vector.sub(
                this.controlPoints[this.controlPoints.length - 1][1],
                this.hull[this.hull.length - 1]
            )
        )

        this.sections = []
        for (let i = 0; i < this.hull.length; i++) {
            const next = (i + 1) % this.hull.length
            const distance = p5.Vector.sub(this.hull[next], this.hull[i]).mag()
            const steps = Math.floor(distance / this.maxDistance * 10)
            for (let j = 1; j < steps; j++) {
                const x = p.curvePoint(this.controlPoints[i][0].x, this.hull[i].x, this.hull[next].x, this.controlPoints[i][1].x, j / steps)
                const y = p.curvePoint(this.controlPoints[i][0].y, this.hull[i].y, this.hull[next].y, this.controlPoints[i][1].y, j / steps)
                const tx = p.curveTangent(this.controlPoints[i][0].x, this.hull[i].x, this.hull[next].x, this.controlPoints[i][1].x, j / steps)
                const ty = p.curveTangent(this.controlPoints[i][0].y, this.hull[i].y, this.hull[next].y, this.controlPoints[i][1].y, j / steps)
                const angle = p.atan2(ty, tx) - p.PI / 2.0
                this.sections.push({
                    left: p5.Vector.mult(p.createVector(x - p.cos(angle) * 30, y - p.sin(angle) * 30), 2),
                    right: p5.Vector.mult(p.createVector(x + p.cos(angle) * 30, y + p.sin(angle) * 30), 2),
                    mid: p5.Vector.mult(p.createVector(x, y), 2)
                })
            }
        }
    }
}
