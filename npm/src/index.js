'use strict';

var _inquirer = require('inquirer');

var _inquirer2 = _interopRequireDefault(_inquirer);

var _userhome = require('userhome');

var _userhome2 = _interopRequireDefault(_userhome);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _process = require('process');

var _range = require('lodash/range');

var _range2 = _interopRequireDefault(_range);

var _compact = require('lodash/compact');

var _compact2 = _interopRequireDefault(_compact);

var _uniq = require('lodash/uniq');

var _uniq2 = _interopRequireDefault(_uniq);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _fs = require('fs');

var _template = require('lodash/template');

var _template2 = _interopRequireDefault(_template);

var _safe = require('colors/safe');

var _safe2 = _interopRequireDefault(_safe);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var configNames = ['.work-templates.conf'];

var paths = (0, _process.cwd)().split(_path2.default.sep);

var walked_path = (0, _range2.default)(paths.length).reduce(function (all, ix) {
  if (ix > 0) {
    var newPaths = configNames.map(function (cName) {
      return paths.slice(0, ix + 1).join(_path2.default.sep) + _path2.default.sep + cName;
    });
    return all.concat(newPaths);
  }

  return all;
}, []);

var all_paths = (0, _uniq2.default)(walked_path.concat(configNames.map(function (p) {
  return (0, _userhome2.default)(p);
})));

console.log('Work Templates');
console.log('');
console.log('Loading config files...');

_async2.default.parallel(all_paths.map(function (configPath) {
  return function (cb) {
    (0, _fs.readFile)(configPath, function (err, data) {
      if (err) {
        cb(null, null);
      } else {
        var configData = JSON.parse(data.toString());
        configData.rootPath = _path2.default.dirname(configPath);

        cb(null, configData);
      }
    });
  };
}), function (err, results) {
  var validConfigs = (0, _compact2.default)(results);

  if (validConfigs.length == 0) {
    // do some error handling
  } else {
    (function () {
      var iterator = 0;

      var templates = validConfigs.reduce(function (acc, config) {
        console.log('\nTemplates at: ' + config.rootPath);

        var lines = config.templates.map(function (templatePath) {
          console.log('[' + iterator + '] ' + templatePath);
          iterator++;
          return {
            path: config.rootPath + _path2.default.sep + templatePath,
            root: config.rootPath
          };
        });

        return acc.concat(lines);
      }, []);

      console.log('');
      promptTemplateChoice(templates);
    })();
  }
});

function promptTemplateChoice(options) {
  _inquirer2.default.prompt([{
    'type': 'input',
    'name': 'optionIx',
    'message': 'Which template would you like to use?'
  }]).then(function (_ref) {
    var optionIx = _ref.optionIx;

    runTemplateQuestions(options[optionIx]);
  });
}

function runTemplateQuestions(template) {
  var templateModule = require(template.path);

  _inquirer2.default.prompt(templateModule.questions()).then(function (results) {
    var files = templateModule.setup(template.root, results);
    _async2.default.parallel(files.map(function (file) {
      return function (cb) {
        var src = template.path + _path2.default.sep + file.src;
        var templateContents = (0, _fs.readFileSync)(src, "utf8");
        var contents = (0, _template2.default)(templateContents)(file.data);

        var destDir = _path2.default.dirname(file.dest);

        (0, _mkdirp2.default)(destDir, function (err) {
          if (err) {
            cb(err);
          }

          (0, _fs.writeFile)(file.dest, contents, function (err) {
            cb(err, file);
          });
        });
      };
    }), function (err, results) {
      console.log(_safe2.default.green('Template successfully rendered.'));
      results.forEach(function (file) {
        var projectPath = file.dest.replace(template.root, '');
        console.log(' --> ', _safe2.default.blue(projectPath));
      });
    });
  }).catch(function (err) {
    console.log(_safe2.default.red(err));
  });
}