const CleanWebpackPlugin = require('clean-webpack-plugin').CleanWebpackPlugin;
const HtmlWebPackPlugin = require("html-webpack-plugin");
const path = require("path");

const htmlPlugin = new HtmlWebPackPlugin({
  template: "./src/index.html",
  filename: "./index.html"
});

module.exports = {
	target: "electron-renderer",
	devtool: "source-map",
	entry: "./src/index.tsx", // Point to main file
	output: {
		filename: "index.js",
		path: path.resolve(__dirname, "dist")
	},
	resolve: {
		extensions: ['.js', '.jsx', '.ts', '.tsx']
	},
	performance: {
		hints: false
	},
	module: {
		rules: [
			{
				test: /\.scss$/,
				use: [
					"style-loader", 						// creates style nodes from JS strings
					"css-loader", 							// translates CSS into CommonJS
					"sass-loader" 							// compiles Sass to CSS, using Node Sass by default
				]
			},
			{
				test: /\.css$/,
				use: [
					"style-loader", 						// creates style nodes from JS strings
					"css-loader"							// translates CSS into CommonJS
				]
			},
			{
				test: /\.(js|jsx|tsx|ts)$/,   // All ts and tsx files will be process by
				loader: 'babel-loader',			// first babel-loader, then ts-loader
				exclude: /node_modules/				// ignore node_modules
			}
		]
	},
	plugins: [ htmlPlugin ]
};
