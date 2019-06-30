const path = require('path')

module.exports = {
    entry: './src/bkstar123-ajax-uploader.js',
    output: {
        filename: 'bkstar123-ajax-uploader.min.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
                loader: 'babel-loader',
            }
        }]
    }
}