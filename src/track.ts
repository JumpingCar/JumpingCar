import * as p5 from 'p5'

export default class Track {
    points: p5.Vector[]
    hull: p5.Vector[]
    controlPoints: p5.Vector[][]
    curve: boolean[]

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
        this.initializeCurve(p)
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

    public draw(p: p5): void {
        p.background(230)
        p.translate(p.width / 2, p.height / 2)

        // p.fill(255)
        // for (let i = 0; i < this.points.length; i++) {
        //     p.circle(this.points[i].x, this.points[i].y, 10)
        // }

        p.fill(0)
        for (let i = 0; i < this.hull.length; i++) {
            p.circle(this.hull[i].x, this.hull[i].y, 10)
        }
        p.fill(230)

        for (let i = 0; i < this.hull.length; i++) {
            const next = (i + 1) % this.hull.length

            p.stroke(255, 0, 0)
            // p.circle(this.controlPoints[i][0].x, this.controlPoints[i][0].y, 10)
            // p.line(this.controlPoints[i][0].x, this.controlPoints[i][0].y, this.hull[next].x, this.hull[next].y)
            // p.line(this.controlPoints[i][1].x, this.controlPoints[i][1].y, this.hull[i].x, this.hull[i].y)
            // p.circle(this.controlPoints[i][1].x, this.controlPoints[i][1].y, 10)
            p.stroke(0)
            p.curve(
                this.controlPoints[i][0].x, this.controlPoints[i][0].y,
                this.hull[i].x, this.hull[i].y,
                this.hull[next].x, this.hull[next].y,
                this.controlPoints[i][1].x, this.controlPoints[i][1].y
            )
        }

        p.fill(0, 255, 0)
        p.stroke(0, 0, 255)
        for (let i = 0; i < this.hull.length; i++) {
            const next = (i + 1) % this.hull.length
            for (let j = 0; j <= 6; j++) {
                const x = p.curvePoint(this.controlPoints[i][0].x, this.hull[i].x, this.hull[next].x, this.controlPoints[i][1].x, j / 6)
                const y = p.curvePoint(this.controlPoints[i][0].y, this.hull[i].y, this.hull[next].y, this.controlPoints[i][1].y, j / 6)

                const tx = p.curveTangent(this.controlPoints[i][0].x, this.hull[i].x, this.hull[next].x, this.controlPoints[i][1].x, j / 6)
                const ty = p.curveTangent(this.controlPoints[i][0].y, this.hull[i].y, this.hull[next].y, this.controlPoints[i][1].y, j / 6)
                const angle = p.atan2(ty, tx) - p.PI / 2.0
                p.line(x - p.cos(angle) * 20, y - p.sin(angle) * 20, x + p.cos(angle) * 20, y + p.sin(angle) * 20)

                p.circle(x, y, 8)
            }
        }
        p.stroke(0)
    }

    pushApart(p: p5): void {
        const dist = 50
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
            const dirVec = p5.Vector.sub(this.hull[next], this.hull[i]).normalize().mult(500)

            const rotationAngle = p.PI / 2
            const cwVec = p.createVector(
                dirVec.x * p.cos(rotationAngle) - dirVec.y * p.sin(rotationAngle),
                dirVec.x * p.sin(rotationAngle) + dirVec.y * p.cos(rotationAngle)
            )
            const ccVec = p.createVector(
                dirVec.x * p.cos(-rotationAngle) - dirVec.y * p.sin(-rotationAngle),
                dirVec.x * p.sin(-rotationAngle) + dirVec.y * p.cos(-rotationAngle)
            )

            const nextCP = p5.Vector.add(this.hull[next], this.curve[i] ? ccVec : cwVec)
            if (i === 0) {
                this.controlPoints.push([ null, nextCP ])
            } else {
                const parVec = p5.Vector.sub(this.controlPoints[i - 1][1], this.hull[i - 1])
                const cp1 = p5.Vector.sub(this.hull[next], parVec)
                this.controlPoints.push([ cp1, nextCP ])
            }
        }

        this.controlPoints[0][0] = p5.Vector.sub(this.hull[0], p5.Vector.sub(this.controlPoints[this.controlPoints.length - 1][1], this.hull[this.hull.length - 1]))
    }
}
