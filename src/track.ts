import * as p5 from 'p5'

interface Section {
    x1: number
    y1: number
    x2: number
    y2: number
    x: number
    y: number
}

export default class Track {
    points: p5.Vector[]
    hull: p5.Vector[]
    controlPoints: p5.Vector[][]
    sections: Section[]
    curve: boolean[]
    maxDistance: number

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
    }

    public draw(p: p5): void {
        p.background(230)
        p.translate(p.width / 2 - this.sections[0].x, p.height / 2 - this.sections[0].y)

        p.stroke(0, 0, 255)
        for (let i = 0; i < this.sections.length; i++) {
            const next = (i + 1) % this.sections.length
            p.line(this.sections[i].x1, this.sections[i].y1, this.sections[i].x2, this.sections[i].y2)
            p.line(this.sections[i].x1, this.sections[i].y1, this.sections[next].x1, this.sections[next].y1)
            p.line(this.sections[i].x2, this.sections[i].y2, this.sections[next].x2, this.sections[next].y2)
        }
        p.stroke(0)
    }

    initializeConvexHull(): void {
        this.hull = []
        const leftMost = this.points[0]
        let nextVertex = this.points[1]
        let currentVertex = leftMost
        this.hull.push(currentVertex)
        while (true) {
            let nextIndex: number

            for (let index = 0; index < this.points.length; index++) {
                let checking = this.points[index]

                const a = p5.Vector.sub(nextVertex, currentVertex)
                const b = p5.Vector.sub(checking, currentVertex)
                const cross = a.cross(b)

                if (cross.z < 0) {
                    nextVertex = checking
                    nextIndex = index
                }
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
                    x1: x - p.cos(angle) * 30, y1: y - p.sin(angle) * 30,
                    x2: x + p.cos(angle) * 30, y2: y + p.sin(angle) * 30,
                    x: x, y: y
                })
            }
        }
    }
}
