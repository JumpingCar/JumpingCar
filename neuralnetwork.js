import Matrix from './matrix.js'

class NeuralNetwork {
    constructor(...args) {
        if (args.length < 2)
            throw new Error("Not enough arguments")
        this.layers = args.reduce((acc, layer) => [...acc, Array(layer).fill(0)], [])
        this.weights = []
        for (let i = 0; i < layers.length - 1; i++)
            weights.push(new Matrix(layers[i + 1].length, layers[i].length))

        this.bias = []
        for (let i = 1; i < layers.length; i++)
            weights.push(new Matrix(layers[i].length, 1))
    }

    feedforward(inputs) {
        if (inputs.length !== this.layers[0].length)
            throw new Error("Input count does not match input layer nodes!")

        this.layers[0] = inputs

        for (let i = 0; i < )
    }
}
