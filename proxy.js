/*
 * THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
 * IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

var generator = require('./lib/generator')();
var proxy = require('./lib/proxy')();



module.exports = function(config) {

  var generate = function(system, config, cb) {
    generator.generate(system, config, cb);
  };


  var start = function(system, name, cb) {
    generate(system, config, function(services) {
      proxy.startAll(services, function() {
        cb();
      });
    });
  };


  var startAll = function(system, cb) {
    generate(system, config, function(services) {
      proxy.startAll(services, function() {
        cb();
      });
    });
  };



  var previewAll = function(system, cb) {
    generate(system, config, function(services) {
      proxy.previewAll(services, function() {
        cb();
      });
    });
  };



  var stop = function() {
  };



  var stopAll = function() {
  };



  return {
    generate: generate,
    start: start,
    startAll: startAll,
    stop: stop,
    stopAll: stopAll,
    previewAll: previewAll
  };
};
 
