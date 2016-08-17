var gulp = require('gulp');
var inlineCss = require('gulp-inline-css');
var htmlReplace = require('gulp-html-replace');
var uploadImages = require('./gulp-static-image-uploader');

gulp.task('default', inlineStyles);

function inlineStyles() {
    return gulp.src('./src/emails/**/*.html')
        .pipe(inlineCss({
            // applies inlining to <style> tags
            applyStyleTags: false,

            // applies inlining to external <link> css
            applyLinkTags: true,

            // removes <style> tags
            removeStyleTags: true,

            // removes <link> tags
            removeLinkTags: true,

            // preserves any media queries in style tags when removeStyleTags is true
            preserveMediaQueries: true,

            // takes css pixel width and applies it as attribute
            applyWidthAttributes: true,

            // adds border,cellpadding,cellspacing = 0 to all tables
            applyTableAttributes: false,

            // removes class and id attributes from html
            removeHtmlSelectors: false
        }))
        .pipe(htmlReplace({
            js: {
                src: 'dev_scripts',
                tpl: '<!-- script removed -->'
            }
        }))
        .pipe(uploadImages({}))
        .pipe(gulp.dest('./build/'));
}