import Matrix from './matrix'
import * as p5 from 'p5'

export default class NeuralNetwork {
    layers: Matrix[]
    weights: Matrix[]
    bias: Matrix[]

    constructor(...args: number[]) {
        if (args.length < 2)
            throw new Error("Not enough arguments")
        this.layers = []
        for (let i = 0; i < args.length; i++)
            this.layers.push(new Matrix(args[i], 1))

        this.weights = []
        for (let i = 0; i < this.layers.length - 1; i++)
            this.weights.push(new Matrix(this.layers[i + 1].row, this.layers[i].row))

        this.bias = []
        for (let i = 1; i < this.layers.length; i++)
            this.bias.push(new Matrix(this.layers[i].row, 1))
    }

    feedforward(inputs: number[]): Matrix {
        if (inputs.length !== this.layers[0].row)
            throw new Error("Input count does not match input layer nodes!")

        this.layers[0] = Matrix.from(inputs.map(n => [n]))

        for (let i = 1; i < this.layers.length; i++)
            this.layers[i] = Matrix.sigmoidVariant(
                Matrix.add(
                    Matrix.dot(this.weights[i - 1], this.layers[i - 1]),
                    this.bias[i - 1]
                ),
                100
            )

        return this.layers[this.layers.length - 1]
    }

    // flattened weights + flattened biases
    exportGenes(): number[] {
        const weights_flattened = this.weights.reduce((flattened, weight) => [...flattened, ...weight.flatten()], [])
        return this.bias.reduce((flattened, b) => [...flattened, ...b.flatten()], weights_flattened)
    }

    importGenes(genes: number[]): void {
        let count = 0

        for (let i = 0; i < this.weights.length; i++) {
            this.weights[i].construct(genes.slice(count, count + this.weights[i].row * this.weights[i].column))
            count += this.weights[i].row * this.weights[i].column
        }

        for (let i = 0; i < this.bias.length; i++) {
            this.bias[i].construct(genes.slice(count, count + this.bias[i].row * this.bias[i].column))
            count += this.bias[i].row * this.bias[i].column
        }
    }

    static crossover(nn1: NeuralNetwork, nn2: NeuralNetwork): number[][] {
        const parentGene1 : number[] = nn1.exportGenes()
        const parentGene2 : number[] = nn2.exportGenes()
        if (parentGene1.length !== parentGene2.length)
            throw new Error("Wrong Arity")

        // // Parent : 2 new children
        // children = children.concat([parentGene1, parentGene2])

        // 1 point Crossover : 2 new children
        const child1 : number[] = []
        const child2 : number[] = []
        const pivot1 : number = Math.floor(Math.random() * parentGene1.length)

        for (let i = 0; i < pivot1; i++) {
            child1.push(parentGene1[i])
            child2.push(parentGene2[i])
        }

        for (let i = pivot1; i < parentGene1.length; i++) {
            child1.push(parentGene2[i])
            child2.push(parentGene1[i])
        }

        return [child1, child2]

        // // 2 point Crossover : 2 new children
        // child1 = []
        // child2 = []
        // pivot1 = Math.floor(Math.random() * parentGene1.length)
        // const pivot2 : number = Math.floor(Math.random() * parentGene1.length)

        // for (let i = 0; i < Math.min(pivot1, pivot2); i++) {
        //     child1.push(parentGene1[i])
        //     child2.push(parentGene2[i])
        // }
        // for (let i = Math.min(pivot1, pivot2); i < Math.max(pivot1, pivot2); i++) {
        //     child1.push(parentGene2[i])
        //     child2.push(parentGene1[i])
        // }
        // for (let i = Math.max(pivot1, pivot2); i < parentGene1.length; i++) {
        //     child1.push(parentGene1[i])
        //     child2.push(parentGene2[i])
        // }

        // children = children.concat([child1, child2])

        // //uniform Crossover : 2 new children
        // child1 = []
        // child2 = []
        // const change : number[] = []
        // for (let i = 0; i < parentGene1.length; i++) {
        //     change.push(Math.floor(Math.random()*2)) // 'change' is array of 0 or 1.
        // }

        // for (let i = 0; i < parentGene1.length; i++) {
        //     if (change[i] == 0) {
        //         child1.push(parentGene1[i])
        //         child2.push(parentGene2[i])
        //     } else {
        //         child1.push(parentGene2[i])
        //         child2.push(parentGene1[i])
        //     }
        // }

        // return children.concat([child1, child2, parentGene1, parentGene2])
    }

    static mutation(genesList: number[][]): void {
        const mut1: number = Math.floor(Math.random() * genesList.length)
        const mut2: number = Math.floor(Math.random() * genesList.length)
        const pivot1: number[] = []
        const pivot2: number[] = []

        for (let i = 0; i < genesList[mut1].length; i++) {
            pivot1.push(Math.floor(Math.random()*2)) // 'pivot1' is array of 0 or 1.
            pivot2.push(Math.floor(Math.random()*2)) // 'pvito2' is array of 0 or 1.
        }

        for (let i = 0; i < genesList[mut1].length; i++) {
            if (pivot1[i] == 1)
                genesList[mut1][i] *= -1
        }

        for (let i = 0; i < genesList[mut2].length; i++) {
            if (pivot2[i] == 1)
                genesList[mut2][i] *= -1
        }
    }

    static mutateOne(genes: number[], threshold: number): void {
        genes.forEach((gene, idx) => {
            if (Math.random() < threshold)
                genes[idx] *= -1
        })
    }

    show(p: p5): void {
        const M = this.layers.reduce((acc, layer) => acc > layer.row ? acc : layer.row, -1)
        const nodeGap = 60
        const layerGap = 140
        const radius = 16

        p.push()
        p.translate(100, 40)
        p.textSize(22)
        p.stroke(255)
        p.strokeWeight(2)
        p.colorMode(p.HSB)
        for (let i = 0; i < this.weights.length; i++) {
            for (let r = 0; r < this.weights[i].row; r++) {
                for (let c = 0; c < this.weights[i].column; c++) {
                    if (this.weights[i].matrix[r][c] < 0)
                        p.stroke(0, 71, 75 - this.weights[i].matrix[r][c] / 2)
                    else
                        p.stroke(217, 80, 75 + this.weights[i].matrix[r][c] / 2)

                    p.line(layerGap * i, (M - this.layers[i].row + 2 * c) * nodeGap / 2, layerGap * (i + 1), (M - this.layers[i + 1].row + 2 * r) * nodeGap / 2)
                    // this.weights[r][c] // i_c -> (i+1)_r
                }
            }
        }

        p.noStroke()
        for (let i = 0; i < this.layers.length; i++) {
            for (let j = 0; j < this.layers[i].row; j++) {
                p.fill(182, this.layers[i].matrix[j][0], 100)
                p.circle(layerGap * i, (M - this.layers[i].row + 2 * j) * nodeGap / 2, radius * 2)

                if (i === 0)
                    p.text(Math.round(this.layers[i].matrix[j][0] * 100) / 100, layerGap * i - 75, (M - this.layers[i].row + 2 * j) * nodeGap / 2 + 10)
                else if (i === this.layers.length - 1)
                    p.text(Math.round(this.layers[i].matrix[j][0] * 100) / 100, layerGap * i + 20, (M - this.layers[i].row + 2 * j) * nodeGap / 2 + 10)
            }
        }
        p.pop()
    }
}
