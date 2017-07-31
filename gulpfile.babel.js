const gulp = require('gulp');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const concat = require('gulp-concat'); //合并css
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const mockServer = require("gulp-mock-server");
const connect = require("gulp-connect");
const Proxy = require("gulp-connect-proxy");
const scss =require("gulp-less");
const cssMinify = require("gulp-clean-css");  //css压缩
const htmlImport = require('gulp-html-import');
const htmlmin = require('gulp-htmlmin');
const autoprefixer = require('gulp-autoprefixer');
const rev = require('gulp-rev');
// 编译并压缩js
gulp.task('convertJS', () => {
  return gulp.src('app/js/index.js')
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(uglify())
    .pipe(gulp.dest('app/javas'))
})

gulp.task('import_html', () => {
    gulp.src('app/index.html')
        .pipe(htmlImport('app/components/'))
        .pipe(rename('main.html'))
        .pipe(gulp.dest('app')); 
})
//解析scss  
gulp.task('convertCSS', () => {
  return gulp.src(['app/css/style.scss'])
   .pipe(scss())
   .pipe(rename('main.css'))
    .pipe( gulp.dest("app/css/"))
})
//压缩html
gulp.task('buildHtml',() => {
   var options = {
        removeComments: true,//清除HTML注释
        collapseWhitespace: true,//压缩HTML
        minifyJS: true,//压缩页面JS
        minifyCSS: true//压缩页面CSS
    };
    gulp.src('app/main.html')
        .pipe(htmlmin(options))
        .pipe(rename('index.html'))
        .pipe(gulp.dest('dist/'));
})
//合并压缩scss  
gulp.task('bulidCss', () => {
  return gulp.src(['app/css/main.css'])
    .pipe( cssMinify() )  
    .pipe(rename(function(path){
      path.basename += '.min';
    }))
    //.pipe(rev())  
  .pipe(gulp.dest('dist/css'));
    //.pipe(rev.manifest()) //- 生成一个rev-manifest.json
    //.pipe(gulp.dest('rev'));  
})
// 拷贝到dist
gulp.task("buildJs", () =>  {
   return gulp.src('app/main.js')
    .pipe( gulp.dest("dist/js"))
});
// 监视文件变化，自动执行任务
gulp.task('watch', () =>  {
  gulp.watch('app/css/*.scss', ['convertCSS',"reload"]);
  gulp.watch('app/js/*.js', ['convertJS', 'browserify',"reload"]);
  gulp.watch('app/*.html', ["reload","import_html"]);
})

// browserify
gulp.task("browserify", () =>  {
    var b = browserify({
        entries: "app/javas/index.js"
    });
    return b.bundle()
        .pipe(source("main.js"))
        .pipe(gulp.dest("app"));
});
//开启服务器
  gulp.task("mock",() => {
    gulp.src('.')
      .pipe(mockServer({
        allowCrossOrigin: true,
        port: 8090
      }));
  })
  //开启服务器
  gulp.task("webserver",() => {
    connect.server({
      port : "2222",
      livereload : true,
      root: "./",
      middleware:function(connect,opt){
        opt.route = "server/data/";
        var proxy = new Proxy(opt);
        return [proxy]
      }
    })
  })

  gulp.task('revs', function() {
    gulp.src(['./rev/*.json', './application/**/header.php'])   //- 读取 rev-manifest.json 文件以及需要进行css名替换的文件
        .pipe(revCollector())                                   //- 执行文件内css名的替换
        .pipe(gulp.dest('./application/'));                     //- 替换后的文件输出的目录
});

  gulp.task("reload",() => {
    gulp.src([
      "app/*.html",
      "app/css/*.css"
      ])
    .pipe(connect.reload())
  })

gulp.task('default', [
  'convertJS',
  'import_html',
  'convertCSS', 
  'browserify',
  'watch',
  "reload",
  "webserver",
  "mock"]);
gulp.task('build', ["bulidCss","buildHtml","buildJs"]);