/**
 * Created by pwinkel on 8/17/2016.
 * gulp plugin that does some custom processing for HTML email templates
 *  - find images in a HTML file, upload them somewhere, and replace the img src
 *  - remove script tags
 *  - remove html comments
 *  - minify html
 */
var cheerio = require('cheerio');
var through = require('through2');
var PluginError = require('gulp-util').PluginError;
var moment = require('moment');
var fs = require('fs');
var path = require('path');
var username = require('username');
var nodemailer = require('nodemailer');
var Promise = require('bluebird');
var litmusConfig = require('./config/litmus.config');

const PLUGIN_NAME = 'gulp-static-image-uploader';

const DEFAULT_OPTIONS = {
    processHTML: true,
    processCSS: true,
    destination: 'C:\\'
};

module.exports = function() {
    return through.obj(function(file, encoding, callback) {
        console.log('---------------------');

        // The type of file.contents should always be the same going out as it was when it came in

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

            // load html into cheerio, its similar to jQuery CSS selector engine
            var $ = cheerio.load(file.contents.toString());
            var images = $('img');
            if (images.length) {
                console.log(images.length + ' images found in ' + file.path)
            }
            // for each image in the HTML...
            for(var i = 0; i < images.length; i++) {
                // we have the HTML - relative image path in the src...
                var originalImgSrc = images[i].attribs.src;

                //if originalImgSrc starts with {{ then skip
                if(originalImgSrc.indexOf('{{') >= 0){
                  continue;
                }

                // convert HTML relative image path to absolute filesystem path
                var imageFilePath = path.resolve(file.dirname, images[i].attribs.src);

                // create cache-buster filename
                var timestamp = moment().unix();

                // append timestamp to filename
                var newFileName = path.basename(file.path, '.html') + '-' +
                    path.parse(imageFilePath).name + '-' +
                    timestamp + path.parse(imageFilePath).ext;

                // upload image to destination
                // for now copy to \\hbmphotoprod01\HBMPhotos\email-images
                fs.createReadStream(imageFilePath)
                    .pipe(fs.createWriteStream('\\\\hbmphotoprod01\\HBMPhotos\\email-images\\' + newFileName));

                // update the img.src to point at the destination
                images[i].attribs.src = 'http://photos.hbm2.com/email-images/' + newFileName;

                console.log(originalImgSrc + ' uploaded to ' + images[i].attribs.src);

            }

            // get rid of any script tags in the html
            $('script').remove();

            // remove html comments from email
            //$('*').contents().filter(isComment).remove();

            // add comment into head with some build info
            var buildComment = '<!-- built by ' + username.sync() + ' on ' + moment().toString() + ' -->';
            $('head').prepend(buildComment);

            // now that we updated image src paths using cheerio, redo the file html and pass it along to gulp
            file.contents = new Buffer($.html());

            // send the email to litmus
            // sendEmail({
            //     from: 'pdub87@gmail.com',
            //     to: litmusConfig.litmusTestAddress,
            //     subject: $('title').text(),
            //     text: 'plaintext email',
            //     html: $.html()
            // }).then(function() {
            //     console.log('sendEmail finished');
            //     return callback(null, file);
            // });

            return callback(null, file);
        }
    });
};

function isComment(index, node) {
    return node.type === 'comment';
}

function sendEmail(mailOptions) {
    return new Promise(function(resolve,reject) {
        var smtpConfig = require('./config/smtp.config');
        var transporter = nodemailer.createTransport(smtpConfig);
        transporter.sendMail(mailOptions, function(err, info){
            if (err !== null) {
                reject(err);
            } else {
                if (info.accepted.length) {
                    for(var i = 0; i > info.accepted.length; i++) {
                        console.log('sent email to ' + info.accepted[i]);
                    }
                }
                if (info.rejected.length) {
                    for(var i = 0; i > info.rejected.length; i++) {
                        console.log('email was REJECTED when sending to ' + info.rejected[i]);
                    }
                }
                resolve();
            }
        });
    });
}
