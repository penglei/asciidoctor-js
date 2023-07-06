const gulp = require("gulp");
const merge = require("merge2");
const fs = require("fs-extra");
const path = require("path");
const stream = require("stream");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const gulpPostcss = require("gulp-postcss");
const postcssImport = require("postcss-import");
const postcssUrl = require("postcss-url");
const postcssCustomProperties = require("postcss-custom-properties");
const imagemin = require("gulp-imagemin");
const gulpEsbuild = require("gulp-esbuild");

//reference: https://dev.to/anitaparmar26/how-to-use-cssnano-in-gulp-3i2i

const srcDir = "src";
const destDir = "build-out";

const antoraSrcOpts = ((dir) => ({ base: dir, cwd: dir }))(
  "antora-ui-default/src"
);

function removeFiles(files, cb) {
  const map = (transform) =>
    new stream.Transform({ objectMode: true, transform });
  return gulp
    .src(files, { allowEmpty: true })
    .pipe(map((file, _, next) => fs.remove(file.path, next)))
    .on("end", cb);
}

function postcssPseudoElementFixer(css, _) {
  css.walkRules(/(?:^|[^:]):(?:before|after)/, (rule) => {
    rule.selector = rule.selectors
      .map((it) => it.replace(/(^|[^:]):(before|after)$/, "$1::$2"))
      .join(",");
  });
}

const postcssPlugins = (outputDir) => [
  postcssImport,
  (_, { messages, opts: { file } }) =>
    Promise.all(
      messages
        .reduce(
          (accum, { file: depPath, type }) =>
            type === "dependency" ? accum.concat(depPath) : accum,
          []
        )
        .map((importedPath) => fs.stat(importedPath).then(({ mtime }) => mtime))
    ).then((mtimes) => {
      const newestMtime = mtimes.reduce(
        (max, curr) => (!max || curr > max ? curr : max),
        file.stat.mtime
      );
      if (newestMtime > file.stat.mtime)
        file.stat.mtimeMs = +(file.stat.mtime = newestMtime);
    }),
  postcssUrl([
    {
      filter: (asset) =>
        new RegExp(
          "^[~][^/]*(?:font|typeface)[^/]*/.*/files/.+[.](?:ttf|woff2?)$"
        ).test(asset.url),
      url: (asset) => {
        const relpath = asset.pathname.substring(1);
        const abspath = require.resolve(relpath);
        const basename = path.basename(abspath);
        const destpath = path.join(outputDir, "font", basename);
        if (!fs.pathExistsSync(destpath)) {
          fs.copySync(abspath, destpath);
        }
        let urlRelativePath = path.join("..", "font", basename);
        return urlRelativePath;
      },
    },
  ]),
  postcssCustomProperties({ preserve: false }),
  autoprefixer,
  cssnano({ preset: "default" }),
  postcssPseudoElementFixer,
];

const build = (src, dest, cb) => {
  const sourceOpts = { base: src, cwd: src };
  const sourcemaps = true; //process.env.SOURCEMAPS === "true";

  let buildAsciidoctorForJavyWasm = gulp
    .src("js/javy_wasm_wrapper.js", { ...sourceOpts, sourcemaps })
    .pipe(
      gulpEsbuild({
        outfile: "javy_wasm_asciidoctor.js",
        bundle: true,
        minify: true,
      })
    )
    .pipe(
      gulp.dest(path.join(dest, "asciidoctor"), {
        sourcemaps: sourcemaps && ".",
      })
    );

  let buildSimpleAsciidoctor = gulp
    .src("js/simple_wrapper.js", { ...sourceOpts, sourcemaps })
    .pipe(
      gulpEsbuild({
        outfile: "simple_asciidoctor.js",
        bundle: true,
        minify: true,
      })
    )
    .pipe(
      gulp.dest(path.join(dest, "asciidoctor"), {
        sourcemaps: sourcemaps && ".",
      })
    );

  let asciidoctorWrappers = merge(
    buildAsciidoctorForJavyWasm,
    buildSimpleAsciidoctor
  );

  let buildAntoraStatic = (cssSrc, srcOpts, outDir) =>
    merge(
      gulp.src([cssSrc], { ...srcOpts, sourcemaps }).pipe(
        gulpPostcss((file) => {
          return {
            plugins: postcssPlugins(outDir),
            options: { file },
          };
        })
      ),

      gulp.src("font/*.{ttf,woff*(2)}", srcOpts),

      gulp.src("img/**/*.{gif,ico,jpg,png,svg}", srcOpts).pipe(
        imagemin(
          [
            imagemin.gifsicle(),
            imagemin.jpegtran(),
            imagemin.optipng(),
            imagemin.svgo({
              plugins: [
                { cleanupIDs: { preservePrefixes: ["icon-", "view-"] } },
                { removeViewBox: false },
                { removeDesc: false },
              ],
            }),
          ].reduce((accum, it) => (it ? accum.concat(it) : accum), [])
        )
      )
    ).pipe(
      gulp.dest(outDir, {
        sourcemaps: sourcemaps && ".",
      })
    );

  return merge(
    buildAntoraStatic(
      //src名字(css/site.css) 包含 `css` 目录很重要:
      //自定义function来output有点麻烦，习惯用默认的。
      //默认output的时候会自动放在位置 `$outDir/css/site.css`。
      //我们配置了font的output dir(`font`) 跟目录`css`在相同层级，
      //其相对路径URL用了 '..'
      "css/site.css",
      antoraSrcOpts,
      path.join(dest, "antora-ui-site")
    ),
    buildAntoraStatic(
      "css/asciidoctor.css",
      antoraSrcOpts,
      path.join(dest, "antora-ui-docpost")
    ),
    asciidoctorWrappers
  ).on("end", cb);
};

//-----------------------------------tasks---------------------------------------//

function cleanTask(cb) {
  return removeFiles([destDir], cb);
}
cleanTask.description = "Clean files and folders generated by build";

function buildTask(cb) {
  return build(srcDir, destDir, cb);
}
buildTask.description = "Build and stage the assets for bundling";

defaultTask = gulp.series(cleanTask, buildTask);
defaultTask.description = "Clean & Build";

exports.default = defaultTask;
exports.build = buildTask;
exports.clean = cleanTask;
