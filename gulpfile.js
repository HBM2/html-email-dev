var gulp = require('gulp');
var inlineCss = require('gulp-inline-css');
var htmlEmailCustom = require('./gulp-html-email-custom');
var litmus = require('gulp-litmus');
var htmlmin = require('gulp-html-minifier');
var nodemailer = require('nodemailer');

gulp.task('default', buildHtmlEmails);

function buildHtmlEmails() {
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
        .pipe(htmlEmailCustom())
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(litmus(require('./config/litmus.config')))
        .pipe(gulp.dest('./build/'));
}