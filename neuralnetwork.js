import Matrix from './matrix.js'

class NeuralNetwork {
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
}
