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
    const filename = (0, _lodash2.default)(`${ String(options.filename) }.${ String(options.format) }`);

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

    console.log(`\n${ _logSymbols2.default.success } Generated ${ screenshots } ${ words.screenshots } from ${ urls } ${ words.urls } and ${ sizes } ${ words.sizes }`);
  }
}
exports.default = Pageres;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2xpYi9pbmRleC5qcyJdLCJuYW1lcyI6WyJnZXRSZXNNZW0iLCJ2aWV3cG9ydExpc3RNZW0iLCJsaXN0ZW5lciIsIlBhZ2VyZXMiLCJjb25zdHJ1Y3RvciIsIm9wdGlvbnMiLCJmaWxlbmFtZSIsImZvcm1hdCIsInN0YXRzIiwiaXRlbXMiLCJzaXplcyIsInVybHMiLCJfc3JjIiwic3JjIiwidXJsIiwidW5kZWZpbmVkIiwicHVzaCIsImRlc3QiLCJkaXIiLCJfZGVzdCIsInJ1biIsImFsbCIsIm1hcCIsImZpbHRlciIsInRlc3QiLCJrZXl3b3JkcyIsIkVycm9yIiwibGVuZ3RoIiwiaW5kZXhPZiIsInJlc29sdXRpb24iLCJ2aWV3cG9ydCIsInNpemUiLCJjcmVhdGUiLCJzY3JlZW5zaG90cyIsInNhdmUiLCJpdGVtIiwib2JqIiwic3RyZWFtcyIsImZpbGVzIiwiZmlsZSIsImVuZCIsInByb2Nlc3MiLCJvbiIsImV4aXQiLCJyZXNvbHZlIiwicmVqZWN0Iiwiam9pbiIsInN0cmVhbSIsIndyaXRlIiwiX19hdG9taWNUbXAiLCJlbWl0IiwiYmluZCIsInRoZW4iLCJlcnIiLCJwaXBlIiwidXJpIiwic3BsaXQiLCJTdHJpbmciLCJpc0Fic29sdXRlIiwiYmFzZW5hbWUiLCJuYW1pZmllZFVyaSIsIm5hbWVUeXBlIiwiaG9zdCIsInBhcnNlIiwicmVwbGFjZSIsInN1YnN0ciIsImNyb3AiLCJkYXRlIiwidGltZSIsIndpZHRoIiwiaGVpZ2h0Iiwic3VjY2Vzc01lc3NhZ2UiLCJ3b3JkcyIsImNvbnNvbGUiLCJsb2ciLCJzdWNjZXNzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7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bnQiOlsiLy8gQGZsb3dcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHVybCBmcm9tICd1cmwnO1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudHMnO1xuaW1wb3J0IHtSZWFkYWJsZX0gZnJvbSAnc3RyZWFtJztcbmltcG9ydCBhcnJheVVuaXEgZnJvbSAnYXJyYXktdW5pcSc7XG5pbXBvcnQgYXJyYXlEaWZmZXIgZnJvbSAnYXJyYXktZGlmZmVyJztcbmltcG9ydCBlYXN5ZGF0ZSBmcm9tICdlYXN5ZGF0ZSc7XG5pbXBvcnQgZnNXcml0ZVN0cmVhbUF0b21pYyBmcm9tICdmcy13cml0ZS1zdHJlYW0tYXRvbWljJztcbmltcG9ydCBnZXRSZXMgZnJvbSAnZ2V0LXJlcyc7XG5pbXBvcnQgbG9nU3ltYm9scyBmcm9tICdsb2ctc3ltYm9scyc7XG5pbXBvcnQgbWVtIGZyb20gJ21lbSc7XG5pbXBvcnQgbWtkaXJwIGZyb20gJ21rZGlycCc7XG5pbXBvcnQgcmltcmFmIGZyb20gJ3JpbXJhZic7XG5pbXBvcnQgc2NyZWVuc2hvdFN0cmVhbSBmcm9tICdzY3JlZW5zaG90LXN0cmVhbSc7XG5pbXBvcnQgdmlld3BvcnRMaXN0IGZyb20gJ3ZpZXdwb3J0LWxpc3QnO1xuaW1wb3J0IHByb3RvY29saWZ5IGZyb20gJ3Byb3RvY29saWZ5JztcbmltcG9ydCBmaWxlbmFtaWZ5VXJsIGZyb20gJ2ZpbGVuYW1pZnktdXJsJztcbmltcG9ydCB0ZW1wbGF0ZSBmcm9tICdsb2Rhc2gudGVtcGxhdGUnO1xuaW1wb3J0IHBpZnkgZnJvbSAncGlmeSc7XG5pbXBvcnQgcGx1ciBmcm9tICdwbHVyJztcblxudHlwZSBQYWdlcmVzU3RyZWFtID0gUmVhZGFibGUgJiB7ZmlsZW5hbWU6IHN0cmluZ307XG5cbnR5cGUgT3B0aW9ucyA9IHtcbiAgZGVsYXk/OiBudW1iZXI7XG50aW1lb3V0PzogbnVtYmVyO1xuY3JvcD86IGJvb2xlYW47XG5jc3M/OiBzdHJpbmc7XG5jb29raWVzPzogQXJyYXk8c3RyaW5nPiB8IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9O1xuZmlsZW5hbWU/OiBzdHJpbmc7XG5zZWxlY3Rvcj86IHN0cmluZztcbmhpZGU/OiBBcnJheTxzdHJpbmc+O1xudXNlcm5hbWU/OiBzdHJpbmc7XG5wYXNzd29yZD86IHN0cmluZztcbnNjYWxlPzogbnVtYmVyO1xuZm9ybWF0Pzogc3RyaW5nO1xudXNlckFnZW50Pzogc3RyaW5nO1xuaGVhZGVycz86IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9O1xufTtcblxudHlwZSBTcmMgPSB7XG4gIHVybDogc3RyaW5nO1xuc2l6ZXM6IEFycmF5PHN0cmluZz47XG5vcHRpb25zOiBPcHRpb25zO1xufTtcblxudHlwZSBWaWV3cG9ydCA9IHtcbiAgdXJsOiBzdHJpbmc7XG5zaXplczogQXJyYXk8c3RyaW5nPjtcbmtleXdvcmRzOiBBcnJheTxzdHJpbmc+O1xufTtcblxudHlwZSBTcmNGbjxEZXN0VmFsdWU+ID1cbiYgKChfOiB2b2lkLCBfOiB2b2lkLCBfOiB2b2lkKSA9PiBBcnJheTxTcmM+KVxuJiAoKHVybDogc3RyaW5nLCBzaXplczogQXJyYXk8c3RyaW5nPiwgb3B0aW9uczogT3B0aW9ucykgPT4gUGFnZXJlczxEZXN0VmFsdWU+KTtcblxudHlwZSBEZXN0Rm48RGVzdFZhbHVlPiA9XG4mICgoXzogdm9pZCkgPT4gRGVzdFZhbHVlKVxuJiAoKGRpcjogRGVzdFZhbHVlKSA9PiBQYWdlcmVzPERlc3RWYWx1ZT4pO1xuXG5jb25zdCBnZXRSZXNNZW0gPSBtZW0oZ2V0UmVzKTtcbmNvbnN0IHZpZXdwb3J0TGlzdE1lbSA9IG1lbSh2aWV3cG9ydExpc3QpO1xuXG5sZXQgbGlzdGVuZXI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBhZ2VyZXM8RGVzdFZhbHVlOiBzdHJpbmc+IGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgb3B0aW9uczogT3B0aW9ucztcbiAgc3RhdHM6IE9iamVjdDtcbiAgaXRlbXM6IEFycmF5PFBhZ2VyZXNTdHJlYW0+O1xuICBzaXplczogQXJyYXk8c3RyaW5nPjtcbiAgdXJsczogQXJyYXk8c3RyaW5nPjtcbiAgX3NyYzogQXJyYXk8U3JjPjtcbiAgX2Rlc3Q6IERlc3RWYWx1ZTtcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBPcHRpb25zKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMub3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMpO1xuICAgIHRoaXMub3B0aW9ucy5maWxlbmFtZSA9IHRoaXMub3B0aW9ucy5maWxlbmFtZSB8fCAnPCU9IHVybCAlPi08JT0gc2l6ZSAlPjwlPSBjcm9wICU+JztcbiAgICB0aGlzLm9wdGlvbnMuZm9ybWF0ID0gdGhpcy5vcHRpb25zLmZvcm1hdCB8fCAncG5nJztcblxuICAgIHRoaXMuc3RhdHMgPSB7fTtcbiAgICB0aGlzLml0ZW1zID0gW107XG4gICAgdGhpcy5zaXplcyA9IFtdO1xuICAgIHRoaXMudXJscyA9IFtdO1xuICAgIHRoaXMuX3NyYyA9IFtdO1xuICB9XG5cbiAgc3JjOiBTcmNGbjxEZXN0VmFsdWU+O1xuICBzcmModXJsOiBzdHJpbmcsIHNpemVzOiBBcnJheTxzdHJpbmc+LCBvcHRpb25zOiBPcHRpb25zKSB7XG4gICAgaWYgKHVybCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5fc3JjO1xuICAgIH1cblxuICAgIHRoaXMuX3NyYy5wdXNoKHt1cmwsIHNpemVzLCBvcHRpb25zfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBkZXN0OiBEZXN0Rm48RGVzdFZhbHVlPjtcbiAgZGVzdChkaXI6IERlc3RWYWx1ZSkge1xuICAgIGlmIChkaXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2Rlc3Q7XG4gICAgfVxuXG4gICAgdGhpcy5fZGVzdCA9IGRpcjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGFzeW5jIHJ1bigpOiBQcm9taXNlPFBhZ2VyZXNTdHJlYW1bXT4ge1xuICAgIGF3YWl0IFByb21pc2UuYWxsKHRoaXMuc3JjKCkubWFwKHNyYyA9PiB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgYXJyYXktY2FsbGJhY2stcmV0dXJuXG4gICAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5vcHRpb25zLCBzcmMub3B0aW9ucyk7XG4gICAgICBjb25zdCBzaXplcyA9IGFycmF5VW5pcShzcmMuc2l6ZXMuZmlsdGVyKC8uLy50ZXN0LCAvXlxcZHsyLDR9eFxcZHsyLDR9JC9pKSk7XG4gICAgICBjb25zdCBrZXl3b3JkcyA9IGFycmF5RGlmZmVyKHNyYy5zaXplcywgc2l6ZXMpO1xuXG4gICAgICBpZiAoIXNyYy51cmwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVUkwgcmVxdWlyZWQnKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy51cmxzLnB1c2goc3JjLnVybCk7XG5cbiAgICAgIGlmIChzaXplcy5sZW5ndGggPT09IDAgJiYga2V5d29yZHMuaW5kZXhPZigndzNjb3VudGVyJykgIT09IC0xKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlc29sdXRpb24oc3JjLnVybCwgb3B0aW9ucyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChrZXl3b3Jkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZpZXdwb3J0KHt1cmw6IHNyYy51cmwsIHNpemVzLCBrZXl3b3Jkc30sIG9wdGlvbnMpO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGNvbnN0IHNpemUgb2Ygc2l6ZXMpIHtcbiAgICAgICAgdGhpcy5zaXplcy5wdXNoKHNpemUpO1xuICAgICAgICB0aGlzLml0ZW1zLnB1c2godGhpcy5jcmVhdGUoc3JjLnVybCwgc2l6ZSwgb3B0aW9ucykpO1xuICAgICAgfVxuICAgIH0pKTtcblxuICAgIHRoaXMuc3RhdHMudXJscyA9IGFycmF5VW5pcSh0aGlzLnVybHMpLmxlbmd0aDtcbiAgICB0aGlzLnN0YXRzLnNpemVzID0gYXJyYXlVbmlxKHRoaXMuc2l6ZXMpLmxlbmd0aDtcbiAgICB0aGlzLnN0YXRzLnNjcmVlbnNob3RzID0gdGhpcy5pdGVtcy5sZW5ndGg7XG5cbiAgICBpZiAoIXRoaXMuZGVzdCgpKSB7XG4gICAgICByZXR1cm4gdGhpcy5pdGVtcztcbiAgICB9XG5cbiAgICBhd2FpdCB0aGlzLnNhdmUodGhpcy5pdGVtcyk7XG5cbiAgICByZXR1cm4gdGhpcy5pdGVtcztcbiAgfVxuXG4gIGFzeW5jIHJlc29sdXRpb24odXJsOiBzdHJpbmcsIG9wdGlvbnM6IE9wdGlvbnMpIHtcbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgYXdhaXQgZ2V0UmVzTWVtKCkpIHtcbiAgICAgIHRoaXMuc2l6ZXMucHVzaChpdGVtLml0ZW0pO1xuICAgICAgdGhpcy5pdGVtcy5wdXNoKHRoaXMuY3JlYXRlKHVybCwgaXRlbS5pdGVtLCBvcHRpb25zKSk7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgdmlld3BvcnQob2JqOiBWaWV3cG9ydCwgb3B0aW9uczogT3B0aW9ucykge1xuICAgIGZvciAoY29uc3QgaXRlbSBvZiBhd2FpdCB2aWV3cG9ydExpc3RNZW0ob2JqLmtleXdvcmRzKSkge1xuICAgICAgdGhpcy5zaXplcy5wdXNoKGl0ZW0uc2l6ZSk7XG4gICAgICBvYmouc2l6ZXMucHVzaChpdGVtLnNpemUpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3Qgc2l6ZSBvZiBhcnJheVVuaXEob2JqLnNpemVzKSkge1xuICAgICAgdGhpcy5pdGVtcy5wdXNoKHRoaXMuY3JlYXRlKG9iai51cmwsIHNpemUsIG9wdGlvbnMpKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBzYXZlKHN0cmVhbXM6IEFycmF5PFBhZ2VyZXNTdHJlYW0+KSB7XG4gICAgY29uc3QgZmlsZXMgPSBbXTtcblxuICAgIGFzeW5jIGZ1bmN0aW9uIGVuZCgpIHtcbiAgICAgIHJldHVybiBhd2FpdCBQcm9taXNlLmFsbChmaWxlcy5tYXAoZmlsZSA9PiBwaWZ5KHJpbXJhZikoZmlsZSkpKTtcbiAgICB9XG5cbiAgICBpZiAoIWxpc3RlbmVyKSB7XG4gICAgICBsaXN0ZW5lciA9IHByb2Nlc3Mub24oJ1NJR0lOVCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgZW5kKCk7XG4gICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCBQcm9taXNlLmFsbChzdHJlYW1zLm1hcChzdHJlYW0gPT5cbiAgICAgIG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgYXdhaXQgcGlmeShta2RpcnApKHRoaXMuZGVzdCgpKTtcblxuICAgICAgICBjb25zdCBkZXN0ID0gcGF0aC5qb2luKHRoaXMuZGVzdCgpLCBzdHJlYW0uZmlsZW5hbWUpO1xuICAgICAgICBjb25zdCB3cml0ZSA9IGZzV3JpdGVTdHJlYW1BdG9taWMoZGVzdCk7XG5cbiAgICAgICAgZmlsZXMucHVzaCh3cml0ZS5fX2F0b21pY1RtcCk7XG5cbiAgICAgICAgc3RyZWFtLm9uKCd3YXJuaW5nJywgdGhpcy5lbWl0LmJpbmQodGhpcywgJ3dhcm5pbmcnKSk7XG4gICAgICAgIHN0cmVhbS5vbignd2FybicsIHRoaXMuZW1pdC5iaW5kKHRoaXMsICd3YXJuJykpO1xuICAgICAgICBzdHJlYW0ub24oJ2Vycm9yJywgZXJyID0+IGVuZCgpLnRoZW4ocmVqZWN0KGVycikpKTtcblxuICAgICAgICB3cml0ZS5vbignZmluaXNoJywgcmVzb2x2ZSk7XG4gICAgICAgIHdyaXRlLm9uKCdlcnJvcicsIGVyciA9PiBlbmQoKS50aGVuKHJlamVjdChlcnIpKSk7XG5cbiAgICAgICAgc3RyZWFtLnBpcGUod3JpdGUpO1xuICAgICAgfSlcbiAgICApKTtcbiAgfVxuXG4gIGNyZWF0ZSh1cmk6IHN0cmluZywgc2l6ZTogc3RyaW5nLCBvcHRpb25zOiBPcHRpb25zKSB7XG4gICAgY29uc3Qgc2l6ZXMgPSBzaXplLnNwbGl0KCd4Jyk7XG4gICAgY29uc3Qgc3RyZWFtID0gc2NyZWVuc2hvdFN0cmVhbShwcm90b2NvbGlmeSh1cmkpLCBzaXplLCBvcHRpb25zKTtcblxuICAgIC8vIENvZXJjaW5nIHRvIHN0cmluZyBoZXJlIHRvIHBsZWFzZSBGbG93XG4gICAgLy8gVE9ETzogU2hvdWxkIGZpeCB0aGUgRmxvdyB0eXBlIHNvIHRoaXMgaXNuJ3QgbmVjZXNzYXJ5XG4gICAgY29uc3QgZmlsZW5hbWUgPSB0ZW1wbGF0ZShgJHtTdHJpbmcob3B0aW9ucy5maWxlbmFtZSl9LiR7U3RyaW5nKG9wdGlvbnMuZm9ybWF0KX1gKTtcblxuICAgIGlmIChwYXRoLmlzQWJzb2x1dGUodXJpKSkge1xuICAgICAgdXJpID0gcGF0aC5iYXNlbmFtZSh1cmkpO1xuICAgIH1cblxuICAgIGxldCBuYW1pZmllZFVyaVxuICAgIGlmIChvcHRpb25zLm5hbWVUeXBlID09PSAnb25seScpIHtcbiAgICAgIHZhciBob3N0ID0gdXJsLnBhcnNlKHVyaSkuaG9zdFxuICAgICAgbmFtaWZpZWRVcmkgPSBmaWxlbmFtaWZ5VXJsKHVyaS5yZXBsYWNlKCcjJywgJycpKS5zdWJzdHIoaG9zdC5sZW5ndGgpXG4gICAgfSBlbHNlIGlmIChvcHRpb25zLm5hbWVUeXBlID09PSAnZnVsbCcpIHtcbiAgICAgIG5hbWlmaWVkVXJpID0gZmlsZW5hbWlmeVVybCh1cmkucmVwbGFjZSgnIycsICcnKSlcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtaWZpZWRVcmkgPSBmaWxlbmFtaWZ5VXJsKHVyaSlcbiAgICB9XG5cbiAgICBzdHJlYW0uZmlsZW5hbWUgPSBmaWxlbmFtZSh7XG4gICAgICBjcm9wOiBvcHRpb25zLmNyb3AgPyAnLWNyb3BwZWQnIDogJycsXG4gICAgICBkYXRlOiBlYXN5ZGF0ZSgnWU1kJyksXG4gICAgICB0aW1lOiBlYXN5ZGF0ZSgnaG1zJyksXG4gICAgICBzaXplLFxuICAgICAgd2lkdGg6IHNpemVzWzBdLFxuICAgICAgaGVpZ2h0OiBzaXplc1sxXSxcbiAgICAgIHVybDogbmFtaWZpZWRVcmlcbiAgICB9KTtcblxuICAgIHJldHVybiBzdHJlYW07XG4gIH1cblxuICBzdWNjZXNzTWVzc2FnZSgpIHtcbiAgICBjb25zdCBzdGF0cyA9IHRoaXMuc3RhdHM7XG4gICAgY29uc3Qge3NjcmVlbnNob3RzLCBzaXplcywgdXJsc30gPSBzdGF0cztcbiAgICBjb25zdCB3b3JkcyA9IHtcbiAgICAgIHNjcmVlbnNob3RzOiBwbHVyKCdzY3JlZW5zaG90Jywgc2NyZWVuc2hvdHMpLFxuICAgICAgc2l6ZXM6IHBsdXIoJ3NpemUnLCBzaXplcyksXG4gICAgICB1cmxzOiBwbHVyKCd1cmwnLCB1cmxzKVxuICAgIH07XG5cbiAgICBjb25zb2xlLmxvZyhgXFxuJHtsb2dTeW1ib2xzLnN1Y2Nlc3N9IEdlbmVyYXRlZCAke3NjcmVlbnNob3RzfSAke3dvcmRzLnNjcmVlbnNob3RzfSBmcm9tICR7dXJsc30gJHt3b3Jkcy51cmxzfSBhbmQgJHtzaXplc30gJHt3b3Jkcy5zaXplc31gKTtcbiAgfVxufVxuIl19