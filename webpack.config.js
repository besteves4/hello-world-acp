const path = require("path");
module.exports = {
   mode: "development",
   entry: "./src/index.js",
   output: {
     path: path.resolve(__dirname, "public"), 
     filename: "index.js" 
   },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [ { loader: "style-loader" }, { loader: "css-loader" } ],
      },
    ]
  },
  devServer: {
    contentBase: "./dist"
  },
  resolve: {
      fallback: { 
         stream: require.resolve("stream-browserify") ,
         crypto: require.resolve("crypto-browserify")
      }
  }
};