const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  plugins: [
    // Copy HTML file to dist
    {
      apply: (compiler) => {
        compiler.hooks.emit.tapAsync('CopyHtmlPlugin', (compilation, callback) => {
          const fs = require('fs');
          const htmlContent = fs.readFileSync('./src/index.html', 'utf8');
          compilation.assets['index.html'] = {
            source: () => htmlContent,
            size: () => htmlContent.length
          };
          callback();
        });
      }
    }
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 3000,
    open: true,
  },
};