const path = require("path");
module.exports = {
  mode: "development",
  entry: {
    index: path.join(__dirname, "src", "index.dev.ts"),
  },
  output: {
    filename: "event-path.dev.js",
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
  plugins: [
    // new webpack.HotModuleReplacementPlugin(),
  ],
  resolve: {
    extensions: [".js", ".ts"],
  },
  externals: [],
  devtool: "cheap-module-source-map",
};
