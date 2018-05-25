'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _stream = require('stream');

var _arrayUniq = require('array-uniq');

var _arrayUniq2 = _interopRequireDefault(_arrayUniq);

var _arrayDiffer = require('array-differ');

var _arrayDiffer2 = _interopRequireDefault(_arrayDiffer);

var _easydate = require('easydate');

var _easydate2 = _interopRequireDefault(_easydate);

var _fsWriteStreamAtomic = require('fs-write-stream-atomic');

var _fsWriteStreamAtomic2 = _interopRequireDefault(_fsWriteStreamAtomic);

var _getRes = require('get-res');

var _getRes2 = _interopRequireDefault(_getRes);

var _logSymbols = require('log-symbols');

var _logSymbols2 = _interopRequireDefault(_logSymbols);

var _mem = require('mem');

var _mem2 = _interopRequireDefault(_mem);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _rimraf = require('rimraf');

var _rimraf2 = _interopRequireDefault(_rimraf);

var _screenshotStream = require('screenshot-stream');

var _screenshotStream2 = _interopRequireDefault(_screenshotStream);

var _viewportList = require('viewport-list');

var _viewportList2 = _interopRequireDefault(_viewportList);

var _protocolify = require('protocolify');

var _protocolify2 = _interopRequireDefault(_protocolify);

var _filenamifyUrl = require('filenamify-url');

var _filenamifyUrl2 = _interopRequireDefault(_filenamifyUrl);

var _lodash = require('lodash.template');

var _lodash2 = _interopRequireDefault(_lodash);

var _pify = require('pify');

var _pify2 = _interopRequireDefault(_pify);

var _plur = require('plur');

var _plur2 = _interopRequireDefault(_plur);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const getResMem = (0, _mem2.default)(_getRes2.default);
const viewportListMem = (0, _mem2.default)(_viewportList2.default);

let listener;

class Pageres extends _events2.default {

  constructor(options) {
    super();

    this.options = (0, _assign2.default)({}, options);
    this.options.filename = this.options.filename || '<%= url %>-<%= size %><%= crop %>';
    this.options.format = this.options.format || 'png';

    this.stats = {};
    this.items = [];
    this.sizes = [];
    this.urls = [];
    this._src = [];
  }

  src(url, sizes, options) {
    if (url === undefined) {
      return this._src;
    }

    this._src.push({ url: url, sizes: sizes, options: options });
    return this;
  }

  dest(dir) {
    if (dir === undefined) {
      return this._dest;
    }

    this._dest = dir;
    return this;
  }

  run() {
    var _this = this;

    return (0, _asyncToGenerator3.default)(function* () {
      yield _promise2.default.all(_this.src().map(function (src) {
        // eslint-disable-line array-callback-return
        const options = (0, _assign2.default)({}, _this.options, src.options);
        const sizes = (0, _arrayUniq2.default)(src.sizes.filter(/./.test, /^\d{2,4}x\d{2,4}$/i));
        const keywords = (0, _arrayDiffer2.default)(src.sizes, sizes);

        if (!src.url) {
          throw new Error('URL required');
        }

        _this.urls.push(src.url);

        if (sizes.length === 0 && keywords.indexOf('w3counter') !== -1) {
          return _this.resolution(src.url, options);
        }

        if (keywords.length > 0) {
          return _this.viewport({ url: src.url, sizes: sizes, keywords: keywords }, options);
        }

        for (const size of sizes) {
          _this.sizes.push(size);
          _this.items.push(_this.create(src.url, size, options));
        }
      }));

      _this.stats.urls = (0, _arrayUniq2.default)(_this.urls).length;
      _this.stats.sizes = (0, _arrayUniq2.default)(_this.sizes).length;
      _this.stats.screenshots = _this.items.length;

      if (!_this.dest()) {
        return _this.items;
      }

      yield _this.save(_this.items);

      return _this.items;
    })();
  }

  resolution(url, options) {
    var _this2 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      for (const item of yield getResMem()) {
        _this2.sizes.push(item.item);
        _this2.items.push(_this2.create(url, item.item, options));
      }
    })();
  }

  viewport(obj, options) {
    var _this3 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      for (const item of yield viewportListMem(obj.keywords)) {
        _this3.sizes.push(item.size);
        obj.sizes.push(item.size);
      }

      for (const size of (0, _arrayUniq2.default)(obj.sizes)) {
        _this3.items.push(_this3.create(obj.url, size, options));
      }
    })();
  }

  save(streams) {
    var _this4 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      let end = (() => {
        var _ref = (0, _asyncToGenerator3.default)(function* () {
          return yield _promise2.default.all(files.map(function (file) {
            return (0, _pify2.default)(_rimraf2.default)(file);
          }));
        });

        return function end() {
          return _ref.apply(this, arguments);
        };
      })();

      const files = [];

      if (!listener) {
        listener = process.on('SIGINT', (0, _asyncToGenerator3.default)(function* () {
          yield end();
          process.exit(1);
        }));
      }

      return yield _promise2.default.all(streams.map(function (stream) {
        return new _promise2.default((() => {
          var _ref3 = (0, _asyncToGenerator3.default)(function* (resolve, reject) {
            yield (0, _pify2.default)(_mkdirp2.default)(_this4.dest());

            const dest = _path2.default.join(_this4.dest(), stream.filename);
            const write = (0, _fsWriteStreamAtomic2.default)(dest);

            files.push(write.__atomicTmp);

            stream.on('warning', _this4.emit.bind(_this4, 'warning'));
            stream.on('warn', _this4.emit.bind(_this4, 'warn'));
            stream.on('error', function (err) {
              return end().then(reject(err));
            });

            write.on('finish', resolve);
            write.on('error', function (err) {
              return end().then(reject(err));
            });

            stream.pipe(write);
          });

          return function (_x, _x2) {
            return _ref3.apply(this, arguments);
          };
        })());
      }));
    })();
  }

  create(uri, size, options) {
    const sizes = size.split('x');
    const stream = (0, _screenshotStream2.default)((0, _protocolify2.default)(uri), size, options);

    // Coercing to string here to please Flow
    // TODO: Should fix the Flow type so this isn't necessary
    const filename = (0, _lodash2.default)(`${String(options.filename)}.${String(options.format)}`);

    if (_path2.default.isAbsolute(uri)) {
      uri = _path2.default.basename(uri);
    }

    let namifiedUri;
    if (options.nameType === 'only') {
      var host = _url2.default.parse(uri).host;
      namifiedUri = (0, _filenamifyUrl2.default)(uri.replace('#', '')).substr(host.length);
    } else if (options.nameType === 'full') {
      namifiedUri = (0, _filenamifyUrl2.default)(uri.replace('#', ''));
    } else {
      namifiedUri = (0, _filenamifyUrl2.default)(uri);
    }

    stream.filename = filename({
      crop: options.crop ? '-cropped' : '',
      date: (0, _easydate2.default)('YMd'),
      time: (0, _easydate2.default)('hms'),
      size: size,
      width: sizes[0],
      height: sizes[1],
      url: namifiedUri
    });

    return stream;
  }

  successMessage() {
    const stats = this.stats;
    const screenshots = stats.screenshots,
          sizes = stats.sizes,
          urls = stats.urls;

    const words = {
      screenshots: (0, _plur2.default)('screenshot', screenshots),
      sizes: (0, _plur2.default)('size', sizes),
      urls: (0, _plur2.default)('url', urls)
    };

    console.log(`\n${_logSymbols2.default.success} Generated ${screenshots} ${words.screenshots} from ${urls} ${words.urls} and ${sizes} ${words.sizes}`);
  }
}
exports.default = Pageres;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9pbmRleC5qcyJdLCJuYW1lcyI6WyJnZXRSZXNNZW0iLCJnZXRSZXMiLCJ2aWV3cG9ydExpc3RNZW0iLCJ2aWV3cG9ydExpc3QiLCJsaXN0ZW5lciIsIlBhZ2VyZXMiLCJFdmVudEVtaXR0ZXIiLCJjb25zdHJ1Y3RvciIsIm9wdGlvbnMiLCJmaWxlbmFtZSIsImZvcm1hdCIsInN0YXRzIiwiaXRlbXMiLCJzaXplcyIsInVybHMiLCJfc3JjIiwic3JjIiwidXJsIiwidW5kZWZpbmVkIiwicHVzaCIsImRlc3QiLCJkaXIiLCJfZGVzdCIsInJ1biIsImFsbCIsIm1hcCIsImZpbHRlciIsInRlc3QiLCJrZXl3b3JkcyIsIkVycm9yIiwibGVuZ3RoIiwiaW5kZXhPZiIsInJlc29sdXRpb24iLCJ2aWV3cG9ydCIsInNpemUiLCJjcmVhdGUiLCJzY3JlZW5zaG90cyIsInNhdmUiLCJpdGVtIiwib2JqIiwic3RyZWFtcyIsImZpbGVzIiwicmltcmFmIiwiZmlsZSIsImVuZCIsInByb2Nlc3MiLCJvbiIsImV4aXQiLCJyZXNvbHZlIiwicmVqZWN0IiwibWtkaXJwIiwicGF0aCIsImpvaW4iLCJzdHJlYW0iLCJ3cml0ZSIsIl9fYXRvbWljVG1wIiwiZW1pdCIsImJpbmQiLCJ0aGVuIiwiZXJyIiwicGlwZSIsInVyaSIsInNwbGl0IiwiU3RyaW5nIiwiaXNBYnNvbHV0ZSIsImJhc2VuYW1lIiwibmFtaWZpZWRVcmkiLCJuYW1lVHlwZSIsImhvc3QiLCJwYXJzZSIsInJlcGxhY2UiLCJzdWJzdHIiLCJjcm9wIiwiZGF0ZSIsInRpbWUiLCJ3aWR0aCIsImhlaWdodCIsInN1Y2Nlc3NNZXNzYWdlIiwid29yZHMiLCJjb25zb2xlIiwibG9nIiwibG9nU3ltYm9scyIsInN1Y2Nlc3MiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7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cUJBQVdDLE9BQVEsY0FBYTlDLFdBQVksSUFBRzBDLE1BQU0xQyxXQUFZLFNBQVF0QixJQUFLLElBQUdnRSxNQUFNaEUsSUFBSyxRQUFPRCxLQUFNLElBQUdpRSxNQUFNakUsS0FBTSxFQUF6STtBQUNEO0FBcExrRTtrQkFBaERSLE8iLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBAZmxvd1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHVybCBmcm9tICd1cmwnO1xyXG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50cyc7XHJcbmltcG9ydCB7UmVhZGFibGV9IGZyb20gJ3N0cmVhbSc7XHJcbmltcG9ydCBhcnJheVVuaXEgZnJvbSAnYXJyYXktdW5pcSc7XHJcbmltcG9ydCBhcnJheURpZmZlciBmcm9tICdhcnJheS1kaWZmZXInO1xyXG5pbXBvcnQgZWFzeWRhdGUgZnJvbSAnZWFzeWRhdGUnO1xyXG5pbXBvcnQgZnNXcml0ZVN0cmVhbUF0b21pYyBmcm9tICdmcy13cml0ZS1zdHJlYW0tYXRvbWljJztcclxuaW1wb3J0IGdldFJlcyBmcm9tICdnZXQtcmVzJztcclxuaW1wb3J0IGxvZ1N5bWJvbHMgZnJvbSAnbG9nLXN5bWJvbHMnO1xyXG5pbXBvcnQgbWVtIGZyb20gJ21lbSc7XHJcbmltcG9ydCBta2RpcnAgZnJvbSAnbWtkaXJwJztcclxuaW1wb3J0IHJpbXJhZiBmcm9tICdyaW1yYWYnO1xyXG5pbXBvcnQgc2NyZWVuc2hvdFN0cmVhbSBmcm9tICdzY3JlZW5zaG90LXN0cmVhbSc7XHJcbmltcG9ydCB2aWV3cG9ydExpc3QgZnJvbSAndmlld3BvcnQtbGlzdCc7XHJcbmltcG9ydCBwcm90b2NvbGlmeSBmcm9tICdwcm90b2NvbGlmeSc7XHJcbmltcG9ydCBmaWxlbmFtaWZ5VXJsIGZyb20gJ2ZpbGVuYW1pZnktdXJsJztcclxuaW1wb3J0IHRlbXBsYXRlIGZyb20gJ2xvZGFzaC50ZW1wbGF0ZSc7XHJcbmltcG9ydCBwaWZ5IGZyb20gJ3BpZnknO1xyXG5pbXBvcnQgcGx1ciBmcm9tICdwbHVyJztcclxuXHJcbnR5cGUgUGFnZXJlc1N0cmVhbSA9IFJlYWRhYmxlICYge2ZpbGVuYW1lOiBzdHJpbmd9O1xyXG5cclxudHlwZSBPcHRpb25zID0ge1xyXG4gIGRlbGF5PzogbnVtYmVyO1xyXG50aW1lb3V0PzogbnVtYmVyO1xyXG5jcm9wPzogYm9vbGVhbjtcclxuY3NzPzogc3RyaW5nO1xyXG5jb29raWVzPzogQXJyYXk8c3RyaW5nPiB8IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9O1xyXG5maWxlbmFtZT86IHN0cmluZztcclxuc2VsZWN0b3I/OiBzdHJpbmc7XHJcbmhpZGU/OiBBcnJheTxzdHJpbmc+O1xyXG51c2VybmFtZT86IHN0cmluZztcclxucGFzc3dvcmQ/OiBzdHJpbmc7XHJcbnNjYWxlPzogbnVtYmVyO1xyXG5mb3JtYXQ/OiBzdHJpbmc7XHJcbnVzZXJBZ2VudD86IHN0cmluZztcclxuaGVhZGVycz86IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9O1xyXG59O1xyXG5cclxudHlwZSBTcmMgPSB7XHJcbiAgdXJsOiBzdHJpbmc7XHJcbnNpemVzOiBBcnJheTxzdHJpbmc+O1xyXG5vcHRpb25zOiBPcHRpb25zO1xyXG59O1xyXG5cclxudHlwZSBWaWV3cG9ydCA9IHtcclxuICB1cmw6IHN0cmluZztcclxuc2l6ZXM6IEFycmF5PHN0cmluZz47XHJcbmtleXdvcmRzOiBBcnJheTxzdHJpbmc+O1xyXG59O1xyXG5cclxudHlwZSBTcmNGbjxEZXN0VmFsdWU+ID1cclxuJiAoKF86IHZvaWQsIF86IHZvaWQsIF86IHZvaWQpID0+IEFycmF5PFNyYz4pXHJcbiYgKCh1cmw6IHN0cmluZywgc2l6ZXM6IEFycmF5PHN0cmluZz4sIG9wdGlvbnM6IE9wdGlvbnMpID0+IFBhZ2VyZXM8RGVzdFZhbHVlPik7XHJcblxyXG50eXBlIERlc3RGbjxEZXN0VmFsdWU+ID1cclxuJiAoKF86IHZvaWQpID0+IERlc3RWYWx1ZSlcclxuJiAoKGRpcjogRGVzdFZhbHVlKSA9PiBQYWdlcmVzPERlc3RWYWx1ZT4pO1xyXG5cclxuY29uc3QgZ2V0UmVzTWVtID0gbWVtKGdldFJlcyk7XHJcbmNvbnN0IHZpZXdwb3J0TGlzdE1lbSA9IG1lbSh2aWV3cG9ydExpc3QpO1xyXG5cclxubGV0IGxpc3RlbmVyO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUGFnZXJlczxEZXN0VmFsdWU6IHN0cmluZz4gZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xyXG4gIG9wdGlvbnM6IE9wdGlvbnM7XHJcbiAgc3RhdHM6IE9iamVjdDtcclxuICBpdGVtczogQXJyYXk8UGFnZXJlc1N0cmVhbT47XHJcbiAgc2l6ZXM6IEFycmF5PHN0cmluZz47XHJcbiAgdXJsczogQXJyYXk8c3RyaW5nPjtcclxuICBfc3JjOiBBcnJheTxTcmM+O1xyXG4gIF9kZXN0OiBEZXN0VmFsdWU7XHJcblxyXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IE9wdGlvbnMpIHtcclxuICAgIHN1cGVyKCk7XHJcblxyXG4gICAgdGhpcy5vcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucyk7XHJcbiAgICB0aGlzLm9wdGlvbnMuZmlsZW5hbWUgPSB0aGlzLm9wdGlvbnMuZmlsZW5hbWUgfHwgJzwlPSB1cmwgJT4tPCU9IHNpemUgJT48JT0gY3JvcCAlPic7XHJcbiAgICB0aGlzLm9wdGlvbnMuZm9ybWF0ID0gdGhpcy5vcHRpb25zLmZvcm1hdCB8fCAncG5nJztcclxuXHJcbiAgICB0aGlzLnN0YXRzID0ge307XHJcbiAgICB0aGlzLml0ZW1zID0gW107XHJcbiAgICB0aGlzLnNpemVzID0gW107XHJcbiAgICB0aGlzLnVybHMgPSBbXTtcclxuICAgIHRoaXMuX3NyYyA9IFtdO1xyXG4gIH1cclxuXHJcbiAgc3JjOiBTcmNGbjxEZXN0VmFsdWU+O1xyXG4gIHNyYyh1cmw6IHN0cmluZywgc2l6ZXM6IEFycmF5PHN0cmluZz4sIG9wdGlvbnM6IE9wdGlvbnMpIHtcclxuICAgIGlmICh1cmwgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5fc3JjO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX3NyYy5wdXNoKHt1cmwsIHNpemVzLCBvcHRpb25zfSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIGRlc3Q6IERlc3RGbjxEZXN0VmFsdWU+O1xyXG4gIGRlc3QoZGlyOiBEZXN0VmFsdWUpIHtcclxuICAgIGlmIChkaXIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5fZGVzdDtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9kZXN0ID0gZGlyO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBhc3luYyBydW4oKTogUHJvbWlzZTxQYWdlcmVzU3RyZWFtW10+IHtcclxuICAgIGF3YWl0IFByb21pc2UuYWxsKHRoaXMuc3JjKCkubWFwKHNyYyA9PiB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYXJyYXktY2FsbGJhY2stcmV0dXJuXHJcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLm9wdGlvbnMsIHNyYy5vcHRpb25zKTtcclxuICAgICAgY29uc3Qgc2l6ZXMgPSBhcnJheVVuaXEoc3JjLnNpemVzLmZpbHRlcigvLi8udGVzdCwgL15cXGR7Miw0fXhcXGR7Miw0fSQvaSkpO1xyXG4gICAgICBjb25zdCBrZXl3b3JkcyA9IGFycmF5RGlmZmVyKHNyYy5zaXplcywgc2l6ZXMpO1xyXG5cclxuICAgICAgaWYgKCFzcmMudXJsKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVUkwgcmVxdWlyZWQnKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy51cmxzLnB1c2goc3JjLnVybCk7XHJcblxyXG4gICAgICBpZiAoc2l6ZXMubGVuZ3RoID09PSAwICYmIGtleXdvcmRzLmluZGV4T2YoJ3czY291bnRlcicpICE9PSAtMSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlc29sdXRpb24oc3JjLnVybCwgb3B0aW9ucyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChrZXl3b3Jkcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudmlld3BvcnQoe3VybDogc3JjLnVybCwgc2l6ZXMsIGtleXdvcmRzfSwgb3B0aW9ucyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZvciAoY29uc3Qgc2l6ZSBvZiBzaXplcykge1xyXG4gICAgICAgIHRoaXMuc2l6ZXMucHVzaChzaXplKTtcclxuICAgICAgICB0aGlzLml0ZW1zLnB1c2godGhpcy5jcmVhdGUoc3JjLnVybCwgc2l6ZSwgb3B0aW9ucykpO1xyXG4gICAgICB9XHJcbiAgICB9KSk7XHJcblxyXG4gICAgdGhpcy5zdGF0cy51cmxzID0gYXJyYXlVbmlxKHRoaXMudXJscykubGVuZ3RoO1xyXG4gICAgdGhpcy5zdGF0cy5zaXplcyA9IGFycmF5VW5pcSh0aGlzLnNpemVzKS5sZW5ndGg7XHJcbiAgICB0aGlzLnN0YXRzLnNjcmVlbnNob3RzID0gdGhpcy5pdGVtcy5sZW5ndGg7XHJcblxyXG4gICAgaWYgKCF0aGlzLmRlc3QoKSkge1xyXG4gICAgICByZXR1cm4gdGhpcy5pdGVtcztcclxuICAgIH1cclxuXHJcbiAgICBhd2FpdCB0aGlzLnNhdmUodGhpcy5pdGVtcyk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuaXRlbXM7XHJcbiAgfVxyXG5cclxuICBhc3luYyByZXNvbHV0aW9uKHVybDogc3RyaW5nLCBvcHRpb25zOiBPcHRpb25zKSB7XHJcbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgYXdhaXQgZ2V0UmVzTWVtKCkpIHtcclxuICAgICAgdGhpcy5zaXplcy5wdXNoKGl0ZW0uaXRlbSk7XHJcbiAgICAgIHRoaXMuaXRlbXMucHVzaCh0aGlzLmNyZWF0ZSh1cmwsIGl0ZW0uaXRlbSwgb3B0aW9ucykpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgYXN5bmMgdmlld3BvcnQob2JqOiBWaWV3cG9ydCwgb3B0aW9uczogT3B0aW9ucykge1xyXG4gICAgZm9yIChjb25zdCBpdGVtIG9mIGF3YWl0IHZpZXdwb3J0TGlzdE1lbShvYmoua2V5d29yZHMpKSB7XHJcbiAgICAgIHRoaXMuc2l6ZXMucHVzaChpdGVtLnNpemUpO1xyXG4gICAgICBvYmouc2l6ZXMucHVzaChpdGVtLnNpemUpO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAoY29uc3Qgc2l6ZSBvZiBhcnJheVVuaXEob2JqLnNpemVzKSkge1xyXG4gICAgICB0aGlzLml0ZW1zLnB1c2godGhpcy5jcmVhdGUob2JqLnVybCwgc2l6ZSwgb3B0aW9ucykpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgYXN5bmMgc2F2ZShzdHJlYW1zOiBBcnJheTxQYWdlcmVzU3RyZWFtPikge1xyXG4gICAgY29uc3QgZmlsZXMgPSBbXTtcclxuXHJcbiAgICBhc3luYyBmdW5jdGlvbiBlbmQoKSB7XHJcbiAgICAgIHJldHVybiBhd2FpdCBQcm9taXNlLmFsbChmaWxlcy5tYXAoZmlsZSA9PiBwaWZ5KHJpbXJhZikoZmlsZSkpKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIWxpc3RlbmVyKSB7XHJcbiAgICAgIGxpc3RlbmVyID0gcHJvY2Vzcy5vbignU0lHSU5UJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgIGF3YWl0IGVuZCgpO1xyXG4gICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGF3YWl0IFByb21pc2UuYWxsKHN0cmVhbXMubWFwKHN0cmVhbSA9PlxyXG4gICAgICBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgYXdhaXQgcGlmeShta2RpcnApKHRoaXMuZGVzdCgpKTtcclxuXHJcbiAgICAgICAgY29uc3QgZGVzdCA9IHBhdGguam9pbih0aGlzLmRlc3QoKSwgc3RyZWFtLmZpbGVuYW1lKTtcclxuICAgICAgICBjb25zdCB3cml0ZSA9IGZzV3JpdGVTdHJlYW1BdG9taWMoZGVzdCk7XHJcblxyXG4gICAgICAgIGZpbGVzLnB1c2god3JpdGUuX19hdG9taWNUbXApO1xyXG5cclxuICAgICAgICBzdHJlYW0ub24oJ3dhcm5pbmcnLCB0aGlzLmVtaXQuYmluZCh0aGlzLCAnd2FybmluZycpKTtcclxuICAgICAgICBzdHJlYW0ub24oJ3dhcm4nLCB0aGlzLmVtaXQuYmluZCh0aGlzLCAnd2FybicpKTtcclxuICAgICAgICBzdHJlYW0ub24oJ2Vycm9yJywgZXJyID0+IGVuZCgpLnRoZW4ocmVqZWN0KGVycikpKTtcclxuXHJcbiAgICAgICAgd3JpdGUub24oJ2ZpbmlzaCcsIHJlc29sdmUpO1xyXG4gICAgICAgIHdyaXRlLm9uKCdlcnJvcicsIGVyciA9PiBlbmQoKS50aGVuKHJlamVjdChlcnIpKSk7XHJcblxyXG4gICAgICAgIHN0cmVhbS5waXBlKHdyaXRlKTtcclxuICAgICAgfSlcclxuICAgICkpO1xyXG4gIH1cclxuXHJcbiAgY3JlYXRlKHVyaTogc3RyaW5nLCBzaXplOiBzdHJpbmcsIG9wdGlvbnM6IE9wdGlvbnMpIHtcclxuICAgIGNvbnN0IHNpemVzID0gc2l6ZS5zcGxpdCgneCcpO1xyXG4gICAgY29uc3Qgc3RyZWFtID0gc2NyZWVuc2hvdFN0cmVhbShwcm90b2NvbGlmeSh1cmkpLCBzaXplLCBvcHRpb25zKTtcclxuXHJcbiAgICAvLyBDb2VyY2luZyB0byBzdHJpbmcgaGVyZSB0byBwbGVhc2UgRmxvd1xyXG4gICAgLy8gVE9ETzogU2hvdWxkIGZpeCB0aGUgRmxvdyB0eXBlIHNvIHRoaXMgaXNuJ3QgbmVjZXNzYXJ5XHJcbiAgICBjb25zdCBmaWxlbmFtZSA9IHRlbXBsYXRlKGAke1N0cmluZyhvcHRpb25zLmZpbGVuYW1lKX0uJHtTdHJpbmcob3B0aW9ucy5mb3JtYXQpfWApO1xyXG5cclxuICAgIGlmIChwYXRoLmlzQWJzb2x1dGUodXJpKSkge1xyXG4gICAgICB1cmkgPSBwYXRoLmJhc2VuYW1lKHVyaSk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IG5hbWlmaWVkVXJpXHJcbiAgICBpZiAob3B0aW9ucy5uYW1lVHlwZSA9PT0gJ29ubHknKSB7XHJcbiAgICAgIHZhciBob3N0ID0gdXJsLnBhcnNlKHVyaSkuaG9zdFxyXG4gICAgICBuYW1pZmllZFVyaSA9IGZpbGVuYW1pZnlVcmwodXJpLnJlcGxhY2UoJyMnLCAnJykpLnN1YnN0cihob3N0Lmxlbmd0aClcclxuICAgIH0gZWxzZSBpZiAob3B0aW9ucy5uYW1lVHlwZSA9PT0gJ2Z1bGwnKSB7XHJcbiAgICAgIG5hbWlmaWVkVXJpID0gZmlsZW5hbWlmeVVybCh1cmkucmVwbGFjZSgnIycsICcnKSlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIG5hbWlmaWVkVXJpID0gZmlsZW5hbWlmeVVybCh1cmkpXHJcbiAgICB9XHJcblxyXG4gICAgc3RyZWFtLmZpbGVuYW1lID0gZmlsZW5hbWUoe1xyXG4gICAgICBjcm9wOiBvcHRpb25zLmNyb3AgPyAnLWNyb3BwZWQnIDogJycsXHJcbiAgICAgIGRhdGU6IGVhc3lkYXRlKCdZTWQnKSxcclxuICAgICAgdGltZTogZWFzeWRhdGUoJ2htcycpLFxyXG4gICAgICBzaXplLFxyXG4gICAgICB3aWR0aDogc2l6ZXNbMF0sXHJcbiAgICAgIGhlaWdodDogc2l6ZXNbMV0sXHJcbiAgICAgIHVybDogbmFtaWZpZWRVcmlcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBzdHJlYW07XHJcbiAgfVxyXG5cclxuICBzdWNjZXNzTWVzc2FnZSgpIHtcclxuICAgIGNvbnN0IHN0YXRzID0gdGhpcy5zdGF0cztcclxuICAgIGNvbnN0IHtzY3JlZW5zaG90cywgc2l6ZXMsIHVybHN9ID0gc3RhdHM7XHJcbiAgICBjb25zdCB3b3JkcyA9IHtcclxuICAgICAgc2NyZWVuc2hvdHM6IHBsdXIoJ3NjcmVlbnNob3QnLCBzY3JlZW5zaG90cyksXHJcbiAgICAgIHNpemVzOiBwbHVyKCdzaXplJywgc2l6ZXMpLFxyXG4gICAgICB1cmxzOiBwbHVyKCd1cmwnLCB1cmxzKVxyXG4gICAgfTtcclxuXHJcbiAgICBjb25zb2xlLmxvZyhgXFxuJHtsb2dTeW1ib2xzLnN1Y2Nlc3N9IEdlbmVyYXRlZCAke3NjcmVlbnNob3RzfSAke3dvcmRzLnNjcmVlbnNob3RzfSBmcm9tICR7dXJsc30gJHt3b3Jkcy51cmxzfSBhbmQgJHtzaXplc30gJHt3b3Jkcy5zaXplc31gKTtcclxuICB9XHJcbn1cclxuIl19