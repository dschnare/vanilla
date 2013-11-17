require('yuicompressor').compress('./test/support/web/css/src/a.css', {}, function (error, data, extra) {
  if (error) {
    throw error;
  } else {
    console.log(data);
  }
});