var Pageres = require('../dist/index')

const pageres = new Pageres({delay: 2})
.src(
  'http://yunweili.wm.dev.echo58.com/#/member/orders/48?ss=1',
  ['480x800', '1024x5000', 'iphone 6'],
  {
    verbose: true,
    crop: false,
    // scale: 5,
    width: 375,
    height: 667,
    filename: '<%= date %><%= time %><%= url %>-<%= size %>',
    nameType: 'only'
  }
)
.dest(__dirname)
.run()
.then(() => console.log('done'));