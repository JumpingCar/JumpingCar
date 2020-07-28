import * as p5 from 'p5'
import { Car } from './car'
import { Boundary } from './boundary'
import NeuralNetwork from './neuralnetwork'

export interface Section {
    left: p5.Vector
    right: p5.Vector
    mid: p5.Vector
}

interface SerializedSection {
    left: {
        x: number,
        y: number
    },
    mid: {
        x: number,
        y: number
    },
    right: {
        x: number,
        y: number
    },
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
    deadCount: number
    furthest: number
    generations: number
    fittest: number

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
        const startingPoint = p5.Vector.add(p5.Vector.mult(this.sections[0].mid, 0.8), p5.Vector.mult(this.sections[1].mid, 0.2))

        this.generations = 0
        this.furthest = 0
        this.population = 100
        this.deadCount = 0
        this.fittest = 0
        this.cars = []
        const initialWalls = [
            new Boundary(p, this.sections[0].left.x, this.sections[0].left.y, this.sections[0].right.x, this.sections[0].right.y),
            new Boundary(p, this.sections[0].left.x, this.sections[0].left.y, this.sections[1].left.x, this.sections[1].left.y),
            new Boundary(p, this.sections[0].right.x, this.sections[0].right.y, this.sections[1].right.x, this.sections[1].right.y)
        ]

        const perpVec = p5.Vector.sub(this.sections[0].right, this.sections[0].left).normalize().rotate(p.HALF_PI)
        for (let i = 0; i < this.population; i++) {
            this.cars.push(new Car(p, startingPoint, perpVec, initialWalls, i))
        }

        const exportGenesButton = p.select('#gene-export')
        const importGenesButton = p.select('#gene-import')
        const geneEditor = p.select('#gene-editor-textarea')
        exportGenesButton.mousePressed(() => {
            const exportValue = this.cars.map(car => car.network.exportGenes().join(' ')).join('\n')
            geneEditor.value(exportValue)
        })

        importGenesButton.mousePressed(() => {
            const importValue: string = geneEditor.value().toString()
            const genes: number[][] = importValue.split('\n').map(row => row.split(' ').map(val => parseFloat(val)))

            this.generations = 0
            this.deadCount = 0
            this.fittest = 0

            const startingPoint = p5.Vector.add(p5.Vector.mult(this.sections[0].mid, 0.8), p5.Vector.mult(this.sections[1].mid, 0.2))
            const perpVec = p5.Vector.sub(this.sections[0].right, this.sections[0].left).normalize().rotate(p.HALF_PI)
            const initialWalls = [
                new Boundary(p, this.sections[0].left.x, this.sections[0].left.y, this.sections[0].right.x, this.sections[0].right.y),
                new Boundary(p, this.sections[0].left.x, this.sections[0].left.y, this.sections[1].left.x, this.sections[1].left.y),
                new Boundary(p, this.sections[0].right.x, this.sections[0].right.y, this.sections[1].right.x, this.sections[1].right.y)
            ]

            this.cars.forEach((car, idx) => car.reset(p, startingPoint, perpVec, initialWalls, genes[idx]))
        })

        const exportMapButton = p.select('#map-export')
        const importMapButton = p.select('#map-import')
        const mapEditor = p.select('#map-editor-textarea')
        exportMapButton.mousePressed(() => {
            const mapData = JSON.stringify(this.sections.map(section => ({
                left: { x: section.left.x, y: section.left.y },
                mid: { x: section.mid.x, y: section.mid.y },
                right: { x: section.right.x, y: section.right.y }
            })))
            mapEditor.value(mapData)
        })

        importMapButton.mousePressed(() => {
            if (mapEditor.value() === '')
                return

            this.generations = 0
            this.deadCount = 0
            this.fittest = 0

            this.sections = JSON.parse(mapEditor.value().toString()).map((section: SerializedSection) => ({
                left: p.createVector(section.left.x, section.left.y),
                mid: p.createVector(section.mid.x, section.mid.y),
                right: p.createVector(section.right.x, section.right.y),
            }))

            const startingPoint = p5.Vector.add(p5.Vector.mult(this.sections[0].mid, 0.8), p5.Vector.mult(this.sections[1].mid, 0.2))
            const perpVec = p5.Vector.sub(this.sections[0].right, this.sections[0].left).normalize().rotate(p.HALF_PI)
            const initialWalls = [
                new Boundary(p, this.sections[0].left.x, this.sections[0].left.y, this.sections[0].right.x, this.sections[0].right.y),
                new Boundary(p, this.sections[0].left.x, this.sections[0].left.y, this.sections[1].left.x, this.sections[1].left.y),
                new Boundary(p, this.sections[0].right.x, this.sections[0].right.y, this.sections[1].right.x, this.sections[1].right.y)
            ]

            this.cars.forEach(car => car.toStartingPoint(p, startingPoint, perpVec, initialWalls))
        })
    }

    public draw(p: p5): void {
        p.push()
        p.translate(p.width / 2 - this.cars[this.furthest].pos.x, p.height / 2 - this.cars[this.furthest].pos.y)

        if (this.deadCount === this.population) {
            this.deadCount = 0
            this.generateNextGenAlt(p)
            this.generations += 1
            document.getElementById("#count").innerHTML = `Generations: ${this.generations}`
            document.getElementById("#alive").innerHTML = `Alive: ${this.population - this.deadCount} / ${this.population}`
            this.furthest = 0
            return
        }

        for (let i = 0; i < this.cars.length; i++) {
            if (!this.cars[i].dead) {
                this.cars[i].update(p)

                if (
                    this.cars[this.furthest].currentSection < this.cars[i].currentSection && !this.cars[i].dead
                    || this.cars[this.furthest].dead
                )
                    this.furthest = i

                if (this.cars[i].dead) {
                    this.deadCount += 1
                    document.getElementById("#alive").innerHTML = `Alive: ${this.population - this.deadCount} / ${this.population}`
                    if (this.fittest < this.cars[i].fitness) {
                        this.fittest = this.cars[i].fitness
                        document.getElementById("#fittest").innerHTML = `Fittest: ${Math.round(this.fittest * 100) / 100}`
                    }
                }

                this.cars[i].updateCurrentSection(p, this.sections)
            } else {
                this.cars[i].show(p)
            }
        }

        document.getElementById("#lap-count").innerHTML = `Lap Count: ${Math.floor(this.cars[this.furthest].currentSection / this.sections.length)}`

        // draw track
        p.strokeWeight(3)
        p.stroke(107, 164, 255)
        for (let i = 0; i < this.sections.length; i++) {
            const next = (i + 1) % this.sections.length
            p.line(this.sections[i].left.x, this.sections[i].left.y, this.sections[i].right.x, this.sections[i].right.y)
            p.line(this.sections[i].left.x, this.sections[i].left.y, this.sections[next].left.x, this.sections[next].left.y)
            p.line(this.sections[i].right.x, this.sections[i].right.y, this.sections[next].right.x, this.sections[next].right.y)
        }
        p.stroke(255)
        p.strokeWeight(1)

        p.pop()
        this.cars[this.furthest].network.show(p);
    }

    static colorDictionary(idx: number): [number, number, number] {
        const topCount = 8
        const randomCount = 12
        const offspringCount = 40
        const softMutationCount = 20
        const hardMutationCount = 20

        if (idx < topCount)
            return [252, 53, 3]
        else if (idx < topCount + randomCount)
            return [252, 152, 3]
        else if (idx < topCount + randomCount + hardMutationCount)
            return [173, 252, 3]
        else if (idx < topCount + randomCount + hardMutationCount + softMutationCount)
            return [3, 161, 252]
        else
            return [186, 3, 252]
    }

    generateNextGen(p: p5): void {
        const parentPairs: Car[][] = Car.selection(this.cars, this.population / 2 - 1)

        const sorted = this.cars.sort((p1, p2) => p2.fitness - p1.fitness)

        const children: number[][] = parentPairs.reduce((nextgen, pair) => {
            const children: number[][] = NeuralNetwork.crossover(pair[0].network, pair[1].network)
            return [...nextgen, ...children]
        }, [] as number[][]).concat([sorted[0].network.exportGenes(), sorted[1].network.exportGenes()])


        NeuralNetwork.mutation(children)

        const startingPoint = p5.Vector.add(this.sections[0].mid, this.sections[1].mid).mult(0.5)
        const perpVec = p5.Vector.sub(this.sections[0].right, this.sections[0].left).normalize().rotate(p.HALF_PI)
        const initialWalls = [
            new Boundary(p, this.sections[0].left.x, this.sections[0].left.y, this.sections[0].right.x, this.sections[0].right.y),
            new Boundary(p, this.sections[0].left.x, this.sections[0].left.y, this.sections[1].left.x, this.sections[1].left.y),
            new Boundary(p, this.sections[0].right.x, this.sections[0].right.y, this.sections[1].right.x, this.sections[1].right.y)
        ]

        this.cars.forEach((car, idx) => car.reset(p, startingPoint, perpVec, initialWalls, children[idx]))
    }

    generateNextGenAlt(p: p5): void {
        const sorted = [...this.cars].sort((p1, p2) => p2.fitness - p1.fitness)

        // 50 total
        // 3 are top 3
        // 7 are random
        // 30 are offsprings
        // 10 are mutated

        // 100 total
        // 8 are top 8          --> 8
        // 12 are random        --> 20
        // 60 are offsprings    --> 60
        // 20 are mutated       --> 20

        const topCount = 8
        const randomCount = 12
        const offspringCount = 40
        const softMutationCount = 20
        const hardMutationCount = 20

        const topParents = [...Array(topCount).keys()].map(idx => sorted[idx].network.exportGenes())
        const random = [...Array(randomCount).keys()].map(_ => (new NeuralNetwork(9, 6, 3)).exportGenes())

        const parentPairs = Car.selection(this.cars, (offspringCount + hardMutationCount + softMutationCount) / 2)
        const offsprings: number[][] = parentPairs.reduce((nextgen, pair) => {
            const children: number[][] = NeuralNetwork.crossover(pair[0].network, pair[1].network)
            return [...nextgen, ...children]
        }, [] as number[][])

        for (let i = 0; i < hardMutationCount; i++)
            NeuralNetwork.mutateOne(offsprings[i], 0.2)

        for (let i = 0; i < softMutationCount; i++)
            NeuralNetwork.mutateOne(offsprings[hardMutationCount + i], 0.05)

        // 0 ~ 7: topParent
        // 8 ~ 19: random
        // 20 ~ 39: soft mutation
        // 40 ~ 59: hard mutation
        // 60 ~ 99: offspring/
        const children = [...topParents, ...random, ...offsprings]

        const startingPoint = p5.Vector.add(p5.Vector.mult(this.sections[0].mid, 0.8), p5.Vector.mult(this.sections[1].mid, 0.2))
        const perpVec = p5.Vector.sub(this.sections[0].right, this.sections[0].left).normalize().rotate(p.HALF_PI)
        const initialWalls = [
            new Boundary(p, this.sections[0].left.x, this.sections[0].left.y, this.sections[0].right.x, this.sections[0].right.y),
            new Boundary(p, this.sections[0].left.x, this.sections[0].left.y, this.sections[1].left.x, this.sections[1].left.y),
            new Boundary(p, this.sections[0].right.x, this.sections[0].right.y, this.sections[1].right.x, this.sections[1].right.y)
        ]

        this.cars.forEach((car, idx) => car.reset(p, startingPoint, perpVec, initialWalls, children[idx]))
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
    }

    pushApart(p: p5): void {
        const dist = 100
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
