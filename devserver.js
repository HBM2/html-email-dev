var browserSync = require('browser-sync').create();

browserSync.init({
    server: true
});

browserSync.watch('./src/emails/*.html').on('change', browserSync.reload);
browserSync.watch('./src/styles/*.css').on('change', browserSync.reload);
browserSync.watch('./src/scripts/*.js').on('change', browserSync.reload);