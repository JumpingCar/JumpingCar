import Matrix from './matrix.js'

class NeuralNetwork {
    layers: Matrix[]
    weights: Matrix[]
    bias: Matrix[]

    constructor(...args) {
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

    feedforward(inputs) {
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
    exportGenes() {
        let weights_flattened = this.weights.reduce((flattened, weight) => [...flattened, ...weight.flatten()], [])
        return this.bias.reduce((flattened, b) => [...flattened, ...b.flatten()], weights_flattened)
    }

    importGenes(genes) {
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

    static crossover(nn1, nn2) {
        const parentGene1 = nn1.exportGenes()
        const parentGene2 = nn2.exportGenes()
        if (parentGene1.length != parentGene2.length)
            throw new Error("Wrong Arity")

        let children = []


        //Parent : 2 new children
        children = children.concat([parentGene1, parentGene2])

        //1 point Crossover : 2 new children
        let child1 = []
        let child2 = []
        let pivot1 = Math.floor(Math.random() * parentGene1.length)

        for (let i = 0; i < pivot; i++) {
            child1.push(parentGene1[i])
            child2.push(parentGene2[i])
        }
        for (let i = pivot; i < parentGene1.length; i++) {
            child1.push(parentGene2[i])
            child2.push(parentGene1[i])
        }

        children = children.concat([child1, child2])

        //2 point Crossover : 2 new children
        let child1 = []
        let child2 = []
        let pivot1 = Math.floor(Math.random() * parentGene1.length)
        let pivot2 = Math.floor(Math.random() * parentGene1.length)

        for (let i = 0; i < Math.min(pivot1, pivot2); i++) {
            child1.push(parentGene1[i])
            child2.push(parentGene2[i])
        }
        for (let i = min(pivot1, pivot2); i < max(pivot1, pivot2); i++) {
            child1.push(parentGene2[i])
            child2.push(parentGene1[i])
        }
        for (let i = max(pivot1, pivot2); i < parentGene1.length; i++) {
            child1.push(parentGene1[i])
            child2.push(parentGene2[i])
        }

        children = children.concat([child1, child2])

        //uniform Crossover : 2 new children
        let child1 = []
        let child2 = []
        let change = []
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


        return children // total 8 new children
    }

}
