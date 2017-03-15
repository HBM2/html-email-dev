var browserSync = require('browser-sync').create();

browserSync.init({
    server: true
});

browserSync.watch('./src/**/*.html').on('change', browserSync.reload);
browserSync.watch('./src/**/*.css').on('change', browserSync.reload);
browserSync.watch('./src/**/*.js').on('change', browserSync.reload);