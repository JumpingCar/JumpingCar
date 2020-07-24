import * as p5 from 'p5'

export default class Track {
    points: p5.Vector[]
    hull: p5.Vector[]

    public setup(p: p5): void {
        p.background(230)

        const pointCount = Math.floor(Math.random() * 10 + 10)
        this.points = []
        for (let i = 0; i < pointCount; i++)
            this.points.push(p.createVector(Math.random() * p.width - p.width / 2, Math.random() * p.height - p.height / 2))

        this.points.sort((a: p5.Vector, b: p5.Vector): number => a.x - b.x)
        this.initializeConvexHull()
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
    }

    public draw(p: p5): void {
        p.background(230)
        p.translate(p.width / 2, p.height / 2)

        for (let i = 0; i < this.points.length; i++) {
            p.circle(this.points[i].x, this.points[i].y, 10)
        }

        for (let i = 0; i < this.hull.length; i++) {
            if (i === this.hull.length - 1) p.line(this.hull[i].x, this.hull[i].y, this.hull[0].x, this.hull[0].y)
            else p.line(this.hull[i].x, this.hull[i].y, this.hull[i + 1].x, this.hull[i + 1].y)
        }
    }
}
