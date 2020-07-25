import Matrix from './matrix'

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
            this.layers[i] = Matrix.sigmoid(
                Matrix.add(
                    Matrix.dot(this.weights[i - 1], this.layers[i - 1]),
                    this.bias[i - 1]
                )
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
        if (parentGene1.length != parentGene2.length)
            throw new Error("Wrong Arity")

        let children : number[][] = []

        //Parent : 2 new children
        children = children.concat([parentGene1, parentGene2])

        //1 point Crossover : 2 new children
        let child1 : number[] = []
        let child2 : number[] = []
        let pivot1 : number = Math.floor(Math.random() * parentGene1.length)

        for (let i = 0; i < pivot1; i++) {
            child1.push(parentGene1[i])
            child2.push(parentGene2[i])
        }
        for (let i = pivot1; i < parentGene1.length; i++) {
            child1.push(parentGene2[i])
            child2.push(parentGene1[i])
        }

        children = children.concat([child1, child2])

        //2 point Crossover : 2 new children
        child1 = []
        child2 = []
        pivot1 = Math.floor(Math.random() * parentGene1.length)
        const pivot2 : number = Math.floor(Math.random() * parentGene1.length)

        for (let i = 0; i < Math.min(pivot1, pivot2); i++) {
            child1.push(parentGene1[i])
            child2.push(parentGene2[i])
        }
        for (let i = Math.min(pivot1, pivot2); i < Math.max(pivot1, pivot2); i++) {
            child1.push(parentGene2[i])
            child2.push(parentGene1[i])
        }
        for (let i = Math.max(pivot1, pivot2); i < parentGene1.length; i++) {
            child1.push(parentGene1[i])
            child2.push(parentGene2[i])
        }

        children = children.concat([child1, child2])

        //uniform Crossover : 2 new children
        child1 = []
        child2 = []
        const change : number[] = []
        for (let i = 0; i < parentGene1.length; i++) {
            change.push(Math.floor(Math.random()*2)) // 'change' is array of 0 or 1.
        }

        for (let i = 0; i < parentGene1.length; i++) {
            if (change[i] == 0) {
                child1.push(parentGene1[i])
                child2.push(parentGene2[i])
            } else {
                child1.push(parentGene2[i])
                child2.push(parentGene1[i])
            }
        }

        children = children.concat([child1, child2])

        return children // total 8 new children.
    }

    static mutation(genesList: number[][]): number[][] {
        const children: number[][] = genesList
        const mut1: number = Math.floor(Math.random() * genesList.length)
        const mut2: number = Math.floor(Math.random() * genesList.length)
        const child1: number[] = genesList[mut1]
        const child2: number[] = genesList[mut2]
        let pivot1: number[]
        let pivot2: number[]

        for (let i = 0; i < child1.length; i++) {
            pivot1.push(Math.floor(Math.random()*2)) // 'pivot1' is array of 0 or 1.
            pivot2.push(Math.floor(Math.random()*2)) // 'pvito2' is array of 0 or 1.
        }

        for (let i = 0; i < child1.length; i++) {
            if (pivot1[i] == 1) {
                child1[i] = (genesList[mut1][i]*(-1)) // change sign.
            }
        }
        for (let i = 0; i < child2.length; i++) {
            if (pivot2[i] == 1) {
                child2[i] = (genesList[mut2][i]*(-1)) // change sign.
            }
        }

        return children.concat([child1, child2]) // genesList gets 2 new children.
    }

    //crossover와 mutation을 거치면 2명의 부모로 부터 10명의 새로운 자식들이 태어남.
    //100명의 자식을 만들고 싶으면 2명의 부모 10쌍을 select하면 됨.
}
