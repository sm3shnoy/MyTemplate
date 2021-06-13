"use strict";

const { src, dest, parallel, series, watch } = require("gulp");
const plumber = require("gulp-plumber");
const sourcemap = require("gulp-sourcemaps");
const sass = require("gulp-sass");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const server = require("browser-sync").create();
const csso = require("gulp-csso");
const rename = require("gulp-rename");
const imagemin = require("gulp-imagemin");
const webp = require("gulp-webp");
const svgstore = require("gulp-svgstore");
const posthtml = require("gulp-posthtml");
const include = require("posthtml-include");
const del = require("del");
const concat = require("gulp-concat");

function browserSync() {
  server.init({
    server: "build/",
    notify: false,
    open: true,
    cors: true,
    ui: false,
  });

  watch('source/scss/**/*.scss', css);
  watch('source/img/icon-*.svg', series(sprite, html, refresh));
  watch('source/*.html', series(html, refresh));
  watch('source/js/*.js', series(scripts, refresh));
}

function refresh(done) {
  server.reload();
  done();
}

function clean() {
  return del("build");
}

function html() {
  return src("source/*.html")
    .pipe(posthtml([include()]))
    .pipe(dest("build"));
}

function css() {
  return src("source/scss/style.scss")
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(sass())
    .pipe(postcss([autoprefixer()]))
    .pipe(csso())
    .pipe(rename("style.min.css"))
    .pipe(sourcemap.write("."))
    .pipe(dest("build/css"))
    .pipe(server.stream());
}

function cssLibs() {
  return src("source/scss/vendor/*.css")
    .pipe(csso())
    .pipe(rename("vendor.min.css"))
    .pipe(dest("build/css"))
    .pipe(server.stream());
}

function images() {
  return src("source/img/**/*.{png,jpg,svg}")
    .pipe(
      imagemin([
        imagemin.optipng({ optimizationLevel: 3 }),
        imagemin.mozjpeg({ progressive: true }),
        imagemin.svgo(),
      ])
    )
    .pipe(dest("source/img"));
}

function webpInit() {
  return src("source/img/**/*.{png,jpg}")
    .pipe(webp({ quality: 90 }))
    .pipe(dest("source/img"));
}

function sprite() {
  return src("source/img/icon-*.svg")
    .pipe(svgstore({ inlineSvg: true }))
    .pipe(rename("sprite.svg"))
    .pipe(dest("build/img"));
}

function copy() {
  return src(
    ["source/fonts/**/*.{woff,woff2}", "source/img/**", "source//*.ico"],
    {
      base: "source",
    }
  ).pipe(dest("build"));
}

function scripts() {
  return src("source/js/*.js")
  .pipe(concat("main.js"))
  .pipe(dest("build/js/"));
}

function scriptlibs() {
  return src("source/js/vendor/*.js")
    .pipe(concat("vendor.js"))
    .pipe(dest("build/js/"));
}

const build = series(clean, copy, cssLibs, css, sprite, html, scriptlibs, scripts);

exports.images = images;
exports.webp = webpInit;
exports.sprite = sprite;

exports.server = browserSync;
exports.build = build;
exports.default = series(build, browserSync);
