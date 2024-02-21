const path = require('path');

module.exports = {
    entry: './app.js',
    target: 'node',
    mode: 'development',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        parserOpts: {
                            sourceType: 'module',
                        },
                    },
                },
            },
        ],
    },
};
