const { RspackManifestPlugin } = require("rspack-manifest-plugin");
const path = require("path");
const { rspack } = require("@rspack/core");
const { spawn } = require("node:child_process");

const outputDirectory = "./public/assets/generated";
const publicPath = "/assets/generated/";

class BiomePlugin {
  path;
  failOnWarning;
  constructor(options) {
    this.path = options?.path;
    this.failOnWarning = options?.failOnWarning ?? true;
  }

  apply(compiler) {
    compiler.hooks.emit.tapAsync("BiomePlugin", (compilation, callback) => {
      console.log("Linting with Biome");
      if (!this.path) {
        console.error("The Biome plugin needs a path to lint.");
      }

      const childProcess = spawn(
        "node",
        [
          "./node_modules/@biomejs/biome/bin/biome",
          "lint",
          "--log-level=warn",
          this.path,
        ],
        { shell: true, stdio: "inherit" }
      );

      childProcess.on("close", (code) => {
        if (code !== 0 && this.failOnWarning) {
          compilation.errors.push(new Error("Biome found errors in the code."));
        }
        callback();
      });
    });
  }
}

const isProd = (env) => env.config === "prod";
const isDevDebug = (env) => env.config === "dev";

const getFilename = (env, ext) => {
  // Add content hash to production builds for cache busting
  return isProd(env) ? `[name].[contenthash:8].${ext}` : `[name].${ext}`;
};

const getMode = (_env) => "production";

const getEntry = (_env) => ({ 
  client: "./src/App.ts",
  server: "./src/App.ts" // Same file, will be bundled differently
});

const getPlugins = (env) => [
  new BiomePlugin({
    path: "./src",
    failOnWarning: isProd(env),
  }),

  ...(isDevDebug(env)
    ? [
        new rspack.DefinePlugin({
          "process.env.NODE_ENV": JSON.stringify("development"),
        }),
      ]
    : []),

  new rspack.CssExtractRspackPlugin({
    filename: getFilename(env, "css"),
  }),

  new RspackManifestPlugin({
    fileName: "asset-manifest.json",
    generate: (seed, files) => {
      const manifestFiles = files.reduce((manifest, file) => {
        manifest[file.name] = file.path;
        return manifest;
      }, seed);
      const entrypointFiles = files
        .filter((x) => x.isInitial && !x.name.endsWith(".map"))
        .map((x) => x.path);
      return {
        files: manifestFiles,
        entrypoints: entrypointFiles,
      };
    },
  }),
];

const getDevtool = (env) => (isDevDebug(env) ? "source-map" : false);

const getOptimization = (env) => ({
  optimization: {
    runtimeChunk: "single",
    splitChunks: {
      chunks: (chunk) => chunk.name !== 'server', // Don't split server bundle
      automaticNameDelimiter: "-",
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendor",
          chunks: (chunk) => chunk.name !== 'server', // Exclude server from vendor bundle
        },
      },
    },
    minimize: isProd(env),
  },
});

const getOutput = (env) => ({
  assetModuleFilename: "assets/[hash][ext][query]",
  filename: (pathData) => {
    // Server bundle gets fixed name for SSR, client bundles get hashed names
    if (pathData.chunk?.name === 'server') {
      return 'server.js';
    }
    return getFilename(env, "js");
  },
  chunkFilename: getFilename(env, "js"),
  globalObject: "this",
  publicPath: publicPath,
  path: path.resolve(__dirname, outputDirectory),
  ...(isProd(env)
    ? {}
    : {
        devtoolModuleFilenameTemplate: (info) =>
          path.resolve(info.absoluteResourcePath).replace(/\\/g, "/"),
      }),
});

module.exports = (env = {}) => [
  // Client configuration - with code splitting and hashed filenames
  {
    name: 'client',
    mode: getMode(env),
    entry: { client: "./src/App.ts" },
    devtool: getDevtool(env),
    optimization: {
      runtimeChunk: "single",
      splitChunks: {
        chunks: "all", // Split everything for optimal loading
        automaticNameDelimiter: "-",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendor",
            chunks: "all",
          },
        },
      },
      minimize: isProd(env),
    },
    plugins: getPlugins(env),
    output: {
      ...getOutput(env),
      filename: getFilename(env, "js"),
      chunkFilename: getFilename(env, "js"),
      clean: false, // Don't clean - both configs write to same directory
    },
    target: "web",
    resolve: {
      extensions: [".js", ".jsx", ".json", ".ts", ".tsx"],
      roots: [path.resolve("./src")],
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "react-dom/server": "react-dom/server.edge",
      },
      conditionNames: isDevDebug(env)
        ? ["development", "browser", "import", "module", "default"]
        : ["production", "browser", "import", "module", "default"],
    },
    module: {
      rules: [
        {
          test: /\.(tsx|ts|js|jsx|mjs)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: "builtin:swc-loader",
              options: {
                jsc: {
                  parser: { syntax: "typescript", tsx: true, decorators: true },
                  target: "es2015",
                },
              },
            },
          ],
        },
        {
          test: /\.(eot|otf|ttf|woff|woff2)$/,
          type: "asset/resource",
        },
        {
          test: /\.(bmp|gif|jpg|jpeg|png|svg)$/,
          type: "asset/resource",
        },
        {
          test: /\.(css|scss|sass)$/,
          use: [
            {
              loader: rspack.CssExtractRspackPlugin.loader,
              options: { esModule: false },
            },
            "css-loader",
            "postcss-loader",
            {
              loader: "sass-loader",
              options: {
                implementation: require("sass"),
              },
            },
          ],
        },
      ],
    },
  },
  
  // Server configuration - single bundle, no splitting
  {
    name: 'server',
    mode: getMode(env),
    entry: { server: "./src/App.ts" },
    devtool: getDevtool(env),
    optimization: {
      splitChunks: false, // No code splitting for server
      minimize: false, // Don't minify server bundle for easier debugging
    },
    plugins: [
      new rspack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify(getMode(env)),
      }),
    ],
    output: {
      path: path.resolve(__dirname, outputDirectory),
      filename: "server.js", // Fixed name for SSR
      clean: false, // Don't clean - client files are already there
    },
    target: "web",
    resolve: {
      extensions: [".js", ".jsx", ".json", ".ts", ".tsx"],
      roots: [path.resolve("./src")],
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "react-dom/server": "react-dom/server.edge",
      },
      conditionNames: isDevDebug(env)
        ? ["development", "browser", "import", "module", "default"]
        : ["production", "browser", "import", "module", "default"],
    },
    module: {
      rules: [
        {
          test: /\.(tsx|ts|js|jsx|mjs)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: "builtin:swc-loader",
              options: {
                jsc: {
                  parser: { syntax: "typescript", tsx: true, decorators: true },
                  target: "es2015",
                },
              },
            },
          ],
        },
        // Ignore assets in server bundle
        {
          test: /\.(eot|otf|ttf|woff|woff2|bmp|gif|jpg|jpeg|png|svg)$/,
          type: "asset/resource",
        },
        {
          test: /\.(css|scss|sass)$/,
          use: [
            {
              loader: rspack.CssExtractRspackPlugin.loader,
              options: { esModule: false },
            },
            "css-loader",
            "postcss-loader",
            {
              loader: "sass-loader",
              options: {
                implementation: require("sass"),
              },
            },
          ],
        },
      ],
    },
  },
];
