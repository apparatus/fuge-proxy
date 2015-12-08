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

var net = require('net');
var async = require('async');
var _ = require('lodash');

module.exports = function() {

  var startProxy = function(proxyPort, serverIp, serverPort) {
    var server = net.createServer(function(socket) {
      var client;

      socket.on('error', function(e) {
        console.log('socket error: ' + proxyPort + ' -> ' + serverIp + ':' + serverPort + ' => ' + e.code);
        console.log('please retry operation');
      });
      socket.on('timeout', function() {
        console.log('socket timeout: ' + proxyPort + ' -> ' + serverIp + ':' + serverPort);
        console.log('please retry operation');
      });

      try {
        client = net.connect(serverPort, serverIp);
        client.on('error', function(e) {
          console.log('client error: ' + proxyPort + ' -> ' + serverIp + ':' + serverPort + ' => ' + e.code);
          console.log('please retry operation');
        });
        socket.pipe(client).pipe(socket);
      }
      catch(e) {
        console.log('proxy error: ' + proxyPort + ' -> ' + serverIp + ':' + serverPort);
        console.log(e);
      }
    });
    server.on('error', function(e) {
      console.log('socket error: ' + proxyPort + ' -> ' + serverIp + ':' + serverPort + ' => ' + e.code);
      console.log('please retry operation');
    });
    server.listen(proxyPort);
  };



  var start = function(services, name, cb) {
    async.eachSeries(services, function(service, next) {
      if (service.name === name) {
        console.log('  proxy ' + service.name + ' ' + service.port + ' -> ' + service.nodes[0].ipaddress + ':' + service.nodes[0].port);
        startProxy(service.port, service.nodes[0].ipaddress, service.nodes[0].port);
      }
      next();
    }, function(err) {
      cb(err);
    });
  };



  var startAll = function(services, cb) {
    async.eachSeries(_.unique(_.map(services, function(service) { return service.name; })), function(serviceName, next) {
      start(services, serviceName, next);
    }, function(err) {
      cb(err);
    });
  };
 


  var preview = function(services, name, cb) {
    async.eachSeries(services, function(service, next) {
      if (service.name === name) {
        console.log('  proxy ' + service.name + ' ' + service.port + ' -> ' + service.nodes[0].ipaddress + ':' + service.nodes[0].port);
      }
      next();
    }, function(err) {
      cb(err);
    });
  };



  var previewAll = function(services, cb) {
    async.eachSeries(_.unique(_.map(services, function(service) { return service.name; })), function(serviceName, next) {
      preview(services, serviceName, next);
    }, function(err) {
      cb(err);
    });
  };
 



  return {
    start: start,
    startAll: startAll,
    previewAll: previewAll
  };
};


