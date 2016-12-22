var gulp = require('gulp')
var babel = require('gulp-babel')
var changed = require('gulp-changed')
var using = require('gulp-using')
var chokidar = require('chokidar')
var debounce = require('debounce')


gulp.task('scripts', function() {
  return gulp.src([
    'src/**/*.js',
  ], { base: './' })
    .pipe(changed('npm'))
    .pipe(babel({'presets': ['es2015', 'stage-1']}))
    .pipe(gulp.dest('npm'))
    .pipe(using({prefix: 'ES5 ->'}))
})

var runTasks = function(tasks) {
  return debounce(function(e, b) { gulp.start(tasks) }, 500)
}

gulp.task('default', ['scripts'], function() {
  chokidar.watch('src/**/*.js')
          .on('all', runTasks(['scripts']))
})
