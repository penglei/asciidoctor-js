import * as esbuild from "esbuild";

//!!! this script is in developing !!!

let exampleOnLoadPlugin = {
  name: "example",
  setup(build) {
    // Load ".txt" files and return an array of words
    build.onLoad({ filter: /\.txt$/ }, async (args) => {
      let text = await fs.promises.readFile(args.path, "utf8");
      return {
        contents: JSON.stringify(text.split(/\s+/)),
        loader: "json",
      };
    });
  },
};

let debugConsolePlugin = {
  name: "debug-log",
  setup(build) {
    build.onResolve({ filter: /^font\// }, (args) => {
      console.log(args);
      return { path: path.join(args.resolveDir, "public", args.path) };
    });

    //build.OnResolve()
  },
};

await esbuild.build({
  entryPoints: ["antora-ui-default/src/css/site.css"],
  bundle: true,
  loader: {
    ".png": "dataurl",
    ".svg": "text",
  },
  plugins: [debugConsolePlugin],
  outfile: "public/esbuild-out/site.css",
});
