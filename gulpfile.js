'use strict';

const { src, dest, watch, parallel, series } = require('gulp');
const scss = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const browserSync = require('browser-sync').create();
const autoprefixer = require('gulp-autoprefixer');
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const fontFormat = require('gulp-fonter');
const fontsFormat = require('gulp-ttf2woff2');
const include = require('gulp-include');
const postcss = require('gulp-postcss');
const url = require('postcss-url');
const path = require('path');
const del = require('del');

function compileStyles() {
    return src([
        'node_modules/swiper/swiper-bundle.css',
        'app/scss/style.scss'
    ])
        .pipe(scss({ outputStyle: 'compressed' }).on('error', scss.logError))
        .pipe(autoprefixer({ overrideBrowserslist: ['last 3 versions'] }))
        .pipe(concat('style.min.css'))
        .pipe(dest('app/css/'))
        .pipe(browserSync.stream());
}

function includePages() {
    return src('app/pages/*.html')
        .pipe(include({
            includePaths: 'app/components',
        }))
        .pipe(dest('app/'))
        .pipe(browserSync.stream());
}

function fonts() {
    return src('app/fonts/*.*')
        .pipe(fontFormat({
            formats: ['woff', 'ttf']
        }))
        .pipe(src('app/fonts/*.ttf'))
        .pipe(fontsFormat())
        .pipe(dest('build/fonts/'));
}

function images() {
    return src('app/images/**/*')
        .pipe(imagemin([
            imagemin.gifsicle({ interlaced: true }),
            imagemin.mozjpeg({ quality: 75, progressive: true }),
            imagemin.optipng({ optimizationLevel: 5 }),
            imagemin.svgo({
                plugins: [
                    { removeViewBox: true },
                    { cleanupIDs: false }
                ]
            })
        ]))
        .pipe(dest('build/images'))
        .pipe(webp())
        .pipe(dest('build/images'));
}

function script() {
    return src([
        'node_modules/swiper/swiper-bundle.js',
        'app/js/*.js',
        '!app/js/main.min.js'
    ])
        .pipe(concat('main.min.js'))
        .pipe(uglify())
        .pipe(dest('app/js/'))
        .pipe(browserSync.stream());
}

function watching() {
    browserSync.init({
        server: {
            baseDir: "app/",
        },
    });
    watch(['app/scss/**/*.scss'], compileStyles);
    watch(['app/js/*.js', '!app/js/main.min.js'], script);
    watch(['app/components/*', 'app/pages/*'], includePages);
    watch(['app/images/**/*.*'], series(images, browserSync.reload));
    watch(['app/**/*.html']).on('change', browserSync.reload);
}

async function clean() {
    return del.sync('build/', { force: true });
}

function building() {
    return src([
        'app/css/style.min.css',
        'app/js/main.min.js',
        'app/**/*.html',
    ], { base: 'app' })
        .pipe(dest('build'));
}

exports.compileStyles = compileStyles;
exports.fonts = fonts;
exports.images = images;
exports.script = script;
exports.includePages = includePages;
exports.watching = watching;
exports.clean = clean;
exports.building = building;

exports.default = parallel(compileStyles, fonts, script, includePages, watching);
exports.build = series(clean, images, fonts, compileStyles, building);


