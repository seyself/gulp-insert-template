'use strict';

var through = require('through2');
var gutil = require('gulp-util');
var path = require('path');
var _ = require('lodash');
var fs = require('fs');

module.exports = function (options)
{
  function transform(file, encoding, callback)
  {
    console.log("'gulp-insert-template': " + path.relative(process.cwd(), file.path));

    if (file.isNull())
    {
      this.push(file);
      return callback();
    }

    if (file.isStream())
    {
      this.emit('error', new gutil.PluginError('gulp-insert-template', 'Streaming not supported'));
      return callback();
    }

    var templatePathList = [];
    var content = file.contents.toString();
    var matches = content.match(/<!--\s*template:\s*(.+)\s*-->/i);
    if (matches)
    {
      var currentPath = process.cwd();
      var templatePath = matches[1];
      if (templatePath.indexOf('/') == 0)
      {
        templatePath = templatePath.substr(1);
      }
      templatePath = path.resolve(currentPath, templatePath);
      var template = fs.readFileSync(templatePath, 'utf8');
      var exports = getExportContentsData(content);
      content = _.template(template)(exports);
    }

    file.contents = new Buffer(content);
    this.push(file);
    callback();
  }

  function flush(callback) 
  {
    callback();
  }

  return through.obj(transform, flush);
};

function getExportContentsData(text)
{
  var data = {};
  text.replace(/<_([^>]+)>((.|\s)*?)<\/_\1>/igm, function(text, tagName, content){
    data[tagName] = content;
  });
  return data;
}

