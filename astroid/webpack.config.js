const HtmlWebPackPlugin = require("html-webpack-plugin");
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const path = require("path");

const htmlPlugin = new HtmlWebPackPlugin({
  template: "./src/index.html",
  filename: "./index.html",
  inject: false
});

const config = {
  target: "electron-main",
  devtool: "inline-source-map",
  entry: {
    main: "./src/main.ts",
    index: "./src/index.tsx"
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist")
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
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    plugins: [new TsconfigPathsPlugin()]
  },
  node: {
    __dirname: false,
    __filename: false
  },
	plugins: [ htmlPlugin ]
};

module.exports = (env, argv) => {
  return config;
};

