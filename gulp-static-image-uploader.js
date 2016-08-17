/**
 * Created by pwinkel on 8/17/2016.
 * gulp plugin that will find images in a HTML file, upload them somewhere, and replace the img src
 */
var cheerio = require('cheerio');
var through = require('through2');
var PluginError = require('gulp-util').PluginError;
var moment = require('moment');
var fs = require('fs');
var path = require('path');

const PLUGIN_NAME = 'gulp-static-image-uploader';

const DEFAULT_OPTIONS = {
    processHTML: true,
    processCSS: true,
    destination: 'C:\\'
};

module.exports = function() {
    return through.obj(function(file, encoding, callback) {
        // The type of file.contents should always be the same going out as it was when it came in

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
            // return callback(null, file);
        } else if (file.isBuffer()) {
            // file.contents is a Buffer - https://nodejs.org/api/buffer.html
            // this.emit('error', new PluginError(PLUGIN_NAME, 'Buffers not supported!'));

            // file.basename = 'fav-update-proto.html'
            // file.dirname = 'C:\Users\pwinkel\WebstormProjects\html-email-dev\src\emails'

            // or, if you can handle Buffers:
            //file.contents = ...
            var $ = cheerio.load(file.contents.toString());
            var images = $('img');
            if (images.length) {
                console.log(images.length + ' images found in ' + file.path)
            }
            // for each image in the HTML...
            for(var i = 0; i < images.length; i++) {
                // we have the HTML - relative image path in the src...
                console.log(images[i].attribs.src);

                // convert HTML relative image path to absolute filesystem path
                var imageFilePath = path.resolve(file.dirname, images[i].attribs.src);

                // create cache-buster filename
                var timestamp = moment().unix();

                // append timestamp to filename
                var newFileName = path.parse(imageFilePath).name + '-' + timestamp + path.parse(imageFilePath).ext;

                // upload image to destination
                // for now copy to \\hbmphotoprod01\HBMPhotos\email-images
                fs.createReadStream(imageFilePath)
                    .pipe(fs.createWriteStream('\\\\hbmphotoprod01\\HBMPhotos\\email-images\\' + newFileName));

                // update the img.src to point at the destination
                images[i].attribs.src = 'http://photos.hbm2.com/email-images/' + newFileName;
            }

            // now that we updated image src paths using cheerio, redo the file html and pass it along to gulp
            file.contents = new Buffer($.html());

            return callback(null, file);
        }
    });
};
