"use strict";

var gulp = require("gulp");
var less = require("gulp-less");
var plumber = require("gulp-plumber");
var postcss = require("gulp-postcss");
var posthtml = require("gulp-posthtml");
var include = require("posthtml-include");
var htmlmin = require("gulp-htmlmin");
var autoprefixer = require("autoprefixer");
var csso = require("gulp-csso");
var imagemin = require("gulp-imagemin");
var svgstore = require("gulp-svgstore");
var rename = require("gulp-rename");
var server = require("browser-sync").create();
var run = require("run-sequence");
var del = require("del");
var pump = require("pump");
var uglify = require("gulp-uglify");

gulp.task("sprite", function() {
    return gulp
        .src("source/img/*.svg")
        .pipe(
            svgstore({
                inlineSvg: true
            })
        )
        .pipe(rename("sprite.svg"))
        .pipe(gulp.dest("build/img"));
});

gulp.task("imagemin", function() {
    return gulp
        .src("source/img/**/*.{png,jpg,svg}")
        .pipe(
            imagemin([
                imagemin.optipng({ optimizationLevel: 3 }),
                imagemin.jpegtran({ progressive: true }),
                imagemin.svgo()
            ])
        )
        .pipe(gulp.dest("build/img"));
});

gulp.task("clean", function() {
    return del("build");
});

gulp.task("copy", function() {
    return gulp
        .src(["source/fonts/**/*.{woff,woff2}", "source/img**"], {
            base: "source"
        })
        .pipe(gulp.dest("build"));
});

gulp.task("style", function() {
    gulp.src("source/less/style.less")
        .pipe(plumber())
        .pipe(less())
        .pipe(
            postcss([
                autoprefixer({
                    browsers: ["last 16 versions"],
                    cascade: false
                })
            ])
        )
        .pipe(csso())
        .pipe(rename("style.min.css"))
        .pipe(gulp.dest("build/css"));
    gulp.src("source/css/normalize.css")
        .pipe(plumber())
        .pipe(csso())
        .pipe(gulp.dest("build/css"));
    server.stream();
});

gulp.task("js", function(cb) {
    pump(
        [
            gulp.src("source/js/**/*.js"),
            uglify(),
            gulp.dest("build/js"),
            server.stream()
        ],
        cb
    );
});

gulp.task("html", function() {
    return gulp
        .src("source/*.html")
        .pipe(posthtml([include()]))
        .pipe(
            htmlmin({
                // collapseWhitespace: true,
                // collapseInlineTagWhitespace: true,
                // removeComments: true,
                // removeEmptyAttributes: true
            })
        )
        .pipe(gulp.dest("build"))
        .pipe(server.stream());
});

gulp.task("build", function(done) {
    run("clean", "copy", "style", "imagemin", "js", "html", done);
});

gulp.task("serve", function() {
    server.init({
        server: "build/",
        notify: false,
        open: true,
        cors: true,
        ui: false,
        browser: "chrome"
    });

    gulp.watch("source/less/**/*.less", ["style"]);
    gulp.watch("source/*.html", ["html"]);
    gulp.watch("source/js/**/*.js", ["js"]);
});
