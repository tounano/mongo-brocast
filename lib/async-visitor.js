module.exports = AsyncVisitor;

function AsyncVisitor(visitee, done) {
  var visitors = 0, ended = false;

  process.nextTick(_checkIfDone);

  return function visit(visitor) {
    var called = 0;
    ++visitors;

    visitor(visitee, function (err) {
      if (called > 0) return;
      ++called;
      --visitors;

      if (err) {
        ended = true;
        return done(err);
      }

      _checkIfDone();
    })
  }

  function _checkIfDone() {
    process.nextTick(function () {
      if (!visitors && !ended) {
        ended = true;
        return done();
      }
    })
  }
}