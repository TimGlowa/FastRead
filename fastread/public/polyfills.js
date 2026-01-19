// Polyfill for Promise.withResolvers (Safari < 17.4 doesn't support it)
// This must run before pdfjs-dist loads
if (typeof Promise.withResolvers === 'undefined') {
  Promise.withResolvers = function() {
    var resolve, reject;
    var promise = new Promise(function(res, rej) {
      resolve = res;
      reject = rej;
    });
    return { promise: promise, resolve: resolve, reject: reject };
  };
}
