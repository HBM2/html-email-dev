/**
 * Created by pwinkel on 8/17/2016.
 * gulp plugin that will take images from an HTML / CSS file, upload them somewhere, and replace the img src
 */
var cheerio = require('cheerio');
var through = require('through2');
var PluginError = require('gulp-util').PluginError;

const PLUGIN_NAME = 'gulp-static-image-uploader';

const DEFAULT_OPTIONS = {
    processHTML: true,
    processCSS: true,
    destination: 'C:\\'
};

module.exports = function() {
    return through.obj(function(file, encoding, callback) {
        var chunks = [];

        if (file.isNull()) {
            // nothing to do
            return callback(null, file);
        }

        if (file.isStream()) {
            // file.contents is a Stream - https://nodejs.org/api/stream.html
            this.emit('error', new PluginError(PLUGIN_NAME, 'Streams not supported!'));

            // or, if you can handle Streams:
            //file.contents = file.contents.pipe(...
            return callback(null, file);
        } else if (file.isBuffer()) {
            // file.contents is a Buffer - https://nodejs.org/api/buffer.html
            // this.emit('error', new PluginError(PLUGIN_NAME, 'Buffers not supported!'));

            // or, if you can handle Buffers:
            //file.contents = ...
            var $ = cheerio.load(file.contents.toString());
            var images = $('img');
            if (images.length) {
                console.log(images.length + ' images found in ' + file.path)
            }
            for(var i = 0; i < images.length; i++) {
                console.log(images[i].attribs.src);
            }

            return callback(null, file);
        }
    });
};
