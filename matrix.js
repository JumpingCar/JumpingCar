export default class Matrix {
    // randomly initializes a matrix of the given row and column with random values of range [-1, 1)
    constructor(row, column) {
        this.matrix = Array(row).fill(0).map(_ => Array(column).fill(Math.random() * 2 - 1))
    }

    add(other) {
        Matrix.add(this, other)
    }

    dot(other) {
        Matrix.multiply(this, other)
    }

    get row() {
        return this.matrix.length
    }

    get column() {
        return this.matrix[0].length
    }

    static add(mat1, mat2) {
        if (!(mat1 instanceof Matrix && mat2 instanceof Matrix))
            throw new Error("Arguments must be matrices!")

        if (!(mat1.row === mat2.row && mat1.column === mat2.column))
            throw new Error("Sizes of matrices are different!")

        const row = mat1.row
        const column = mat1.column

        const newMatrix = new Matrix(row, column)
        for (let i = 0; i < row; i++)
            for (let j = 0; j < column; j++)
                newMatrix.matrix[i][j] = mat1.matrix[i][j] + mat2.matrix[i][j]

        return newMatrix
    }

    static dot(mat1, mat2) {
        if (!(mat1 instanceof Matrix && mat2 instanceof Matrix))
            throw new Error("Arguments must be matrices!")

        if (mat1.column !== mat2.row)
            throw new Error("Sizes of matrices are invalid!")

        const newMatrix = Matrix.zero(mat1.row, mat2.column)
        for (let i = 0; i < newMatrix.row; i++)
            for (let j = 0; j < newMatrix.column; j++)
                for (let k = 0; k < mat1.column; k++)
                    newMatrix.matrix[i][j] += mat1.matrix[i][k] * mat2.matrix[k][j]

        return newMatrix
    }

    static from(array) {
        const matrix = new Matrix(array.length, array[0].length)

        for (let i = 0; i < matrix.row; i++)
            for (let j = 0; j < matrix.column; j++)
                matrix.matrix[i][j] = array[i][j]

        return matrix
    }

    static zero(row, column) {
        const matrix = new Matrix(row, column)

        for (let i = 0; i < row; i++)
            for (let j = 0; j < column; j++)
                matrix.matrix[i][j] = 0

        return matrix
    }

    static apply(mat, func) {
        if (!(mat instanceof Matrix))
            throw new Error("Argument must be a Matrix!")

        const matrix = new Matrix(mat.row, mat.column)

        for (let i = 0; i < matrix.row; i++)
            for (let j = 0; j < matrix.column; j++)
                matrix.matrix[i][j] = func(mat.matrix[i][j])
        
        return matrix
    }

    static sigmoid(mat) {
        return Matrix.apply(mat, x => (1 / (1 + Math.exp(-x))))
    }

    toString() {
        return '[\n  ' + this.matrix.map(row => row.map(e => e.toString().padStart(3, ' ')).join(' ')).join('\n  ') + '\n]'
    }
}
