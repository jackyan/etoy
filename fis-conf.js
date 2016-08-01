fis.match('::packager', {
  spriter: fis.plugin('csssprites'),
  packager:fis.plugin('map')
});

fis.match('*', {
  useHash: false,
  release: '/public/$0'
});

fis.match('*.{js,css,png,gif}', {
  url: '$0'
});

fis.match('/js/*.js', {
  useHash: true, 
  optimizer: fis.plugin('uglify-js'),
  url: '$0'
});

fis.match('/css/*.css', {
  useHash: true, 
  useSprite: false,
  url: '$0'
});

fis.match('*.png', {
  optimizer: fis.plugin('png-compressor')
});

fis.match('*.html', {
    release: '/views/$0'
});

fis.match('*', {
  deploy: fis.plugin('local-deliver', {
    to: '/opt'
  })
})

