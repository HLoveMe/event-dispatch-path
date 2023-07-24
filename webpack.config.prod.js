const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
module.exports = {
  mode: "production",
  entry: {
    index: path.join(__dirname, "src", "index.prod.ts"),
  },
  output: {
    filename: "event-path.prod.js",
    path: path.join(__dirname, "dist", "esm"),
    libraryTarget: "umd",
  },
  module: {
    rules: [
      {
        test: /\.(ts)$/,
        loader: "ts-loader",
        options: {
          configFile: "tsconfig.json",
        },
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components|build)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              [
                "@babel/preset-env",
                {
                  useBuiltIns: "usage",
                },
              ],
            ],
            plugins: [
              [
                "@babel/plugin-transform-runtime",
                {
                  helpers: true,
                  corejs: 3,
                  regenerator: true,
                  useESModules: false,
                  absoluteRuntime: false,
                },
              ],
            ],
          },
        },
      },
    ],
  },
  plugins: [],
  resolve: {
    extensions: [".js", ".ts"],
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
  externals: [],
};
