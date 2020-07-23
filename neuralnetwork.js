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
        if (inputs.length !== this.layers[0].length)
            throw new Error("Input count does not match input layer nodes!")

        this.layers[0] = inputs

        for (let i = 0; i < )
    }
}
