const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    entry: './src/index.ts',
    mode: 'development',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    resolve: {
        extensions: ['.js', '.ts']
    },
    devtool: 'source-map',
    module: {
        rules: [{
            test: /\.ts$/,
            loader: 'babel-loader'
        }, {
            enforce: 'pre',
            test: /\.js$/,
            loader: 'source-map-loader'
        }]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html'
        })
    ]
}
