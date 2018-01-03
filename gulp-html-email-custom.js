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
var Entities = require('html-entities').XmlEntities;
const entities = new Entities();

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

            var filePath = file.path;
            if (filePath.indexOf('newsfeed-eod-email') > -1) {
                var ok = true;
            }

            // get html from file
            var rawHtml = file.contents.toString();

            // save images that are in v:fill elements... do this before loading HTML into cheerio..
            var vFillRegex = /(<v:fill\s*.*src=['|"]?)(.[^'|"]*)(['|"]?\s*\/?>)/g;
            var retArr = [];
            rawHtml = rawHtml.replace(vFillRegex, function(match, p1, p2, p3) {
                // p2 is capture group that has the image file name, the part we want to replace
                if (p2) {
                    // save image out
                    var newImage = saveImage(p2, file);
                    // replace original filename
                    return p1 + newImage + p3;
                }

                return match;
            });

            // load html into cheerio, its similar to jQuery CSS selector engine
            var $ = cheerio.load(rawHtml);

            var html = $.html();

            // find images in the HTML
            var imageArray = [];

            // look for image tags
            var images = $('img');

            // put any images in the imageArray
            for(var i = 0; i < images.length; i++) {
                // we have the HTML - relative image path in the src...
                var originalImgSrc = images[i].attribs.src;

                // save image, replace image src
                images[i].attribs.src = saveImage(originalImgSrc, file);
            }

            // look for images in background attributes
            var backgroundAttributes = $('[background]');
            for(var i = 0; i < backgroundAttributes.length; i++) {
                // save image out, replace background with new image url
                backgroundAttributes[i].attribs.background = saveImage(backgroundAttributes[i].attribs.background, file);
            }

            // look for images in background-image css styles..
            // find all elements with a style attribute
            var styleElements = $('[style]');
            for (var i = 0; i < styleElements.length; i++) {
                var style = styleElements[i].attribs.style;
                var regex = /(.*)(background-image:\s*url\s*\(\s*["|']?)(.[^']*)\s*(["|']?\s*\))(.*)/;

                var result = regex.exec(style);
                // result[3] is capturing group with the image file name
                if (result && result[3].length){
                    // save file out, get url to file
                    var newImageUrl = saveImage(result[3], file);

                    // update style attribute with new absolute url
                    styleElements[i].attribs.style = styleElements[i].attribs.style.replace(regex, "$1$2" + newImageUrl + "$4$5");
                }
            }

            // save the images out
            for(var i = 0; i < imageArray.length; i++) {
                saveImage(imageArray[i], file);
            }

            // get rid of any script tags in the html
            $('script').remove();

            // remove html comments from email
            //$('*').contents().filter(isComment).remove();

            // add comment into head with some build info
            var buildComment = '<!-- THIS FILE WAS AUTOGENERATED!! DONT EDIT THIS! Make changes to the following template: ' + path.basename(file.path, '.html') + '  in hbm-email-dev project from github! built by ' + username.sync() + ' on ' + moment().toString() + ' -->';
            $('head').prepend(buildComment);

            // now that we updated image src paths using cheerio, redo the file html and pass it along to gulp
            var html = $.html();
            var decodedHtml = entities.decode(html);
            file.contents = new Buffer(decodedHtml);

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

function saveImage(image, file) {
    //if originalImgSrc starts with {{ then skip
    if(image.indexOf('{{') >= 0){
        return image;
    }
    // skip images that are already hosted externally
    if(image.indexOf('http') >= 0) {
        return image;
    }

    // convert HTML relative image path to absolute filesystem path
    var imageFilePath = path.resolve(file.dirname, image);

    // create cache-buster filename
    var timestamp = moment().unix();

    // append timestamp to filename
    var newFileName = path.basename(file.path, '.html') + '-' +
        path.parse(imageFilePath).name + '-' +
        timestamp + path.parse(imageFilePath).ext;

    // upload image to destination
    // for now copy to \\hbmphotoprod01\HBMPhotos\email-images
    fs.createReadStream(imageFilePath)
        .pipe(fs.createWriteStream('\\\\hbmphotoprod01.hbm2.com\\HBMPhotos\\email-images\\' + newFileName));

    console.log(image + ' uploaded to ' + 'http://photos.hbm2.com/email-images/' + newFileName);

    // update the img.src to point at the destination
    return 'https://photos.hbm2.com/email-images/' + newFileName;
}

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
