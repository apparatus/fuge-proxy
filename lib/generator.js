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

var os = require('os');
var _ = require('lodash');

module.exports = function() {

  var readProcessIp = function() {
    var ifaces = os.networkInterfaces();
    var addresses = [];

    function addIfExternal(acc, details) {
      if (details.family === 'IPv4' && !details.internal) {
        acc.push(details.address);
      }
      return acc;
    }

    Object.keys(ifaces).forEach(function(dev) {
      ifaces[dev].reduce(addIfExternal, addresses);
    });

    return addresses[0] || '127.0.0.1';
  };



  var readIpDetails = function readIpDetails(analyzed, c) {
    var servicePorts = [];
    var result = [];
    var containers = analyzed.topology.containers;
    var ipaddress;
    var port;

    if (c.specific && c.specific.servicePort) {

      if (!_.isArray(c.specific.servicePort)) {
        servicePorts.push(c.specific.servicePort);
      }
      else {
        servicePorts = c.specific.servicePort;
      }

      _.each(servicePorts, function(servicePort) {
        port = servicePort;
        if (c.containedBy && containers[c.containedBy] && containers[c.containedBy].specific) {
          ipaddress = containers[c.containedBy].specific.privateIpAddress || containers[c.containedBy].specific.ipAddress;
          if (!ipaddress) {
            if (c.type === 'process' || c.type === 'processmonitor') {
              ipaddress = readProcessIp();
            }
            else {
              if (process.env.DOCKER_HOST) {
                ipaddress = /tcp:\/\/([0-9.]+):([0-9]+)/g.exec(process.env.DOCKER_HOST)[1];
              }
              else {
                ipaddress = readProcessIp();
              }
            }
          }
        }
        result.push({ipaddress: ipaddress, port: port});
      });
    }
    return result;
  };



  /**
   * transform the topology into a format for use by proxy
   * {
   *  services: [
   *    {name: 'asdf',
   *     port: 1234,
   *     nodes: [{ ipaddress: '1.2.3.4' port: 2233 }
   *             { ipaddress: '1.2.3.5' port: 2233 }]},
   *    {name: 'abcd_1',
   *     port: 1212,
   *     nodes: [{ ipaddress: '1.2.3.4' port: 8881}
   *             { ipaddress: '1.2.3.5' port: 8882}]},
   *    {name: 'abcd_2',
   *     port: 1212,
   *     nodes: [{ ipaddress: '1.2.3.4' port: 8881}
   *             { ipaddress: '1.2.3.5' port: 8882}]},
   *    ]
   * }
   */
  var transformTopology = function transformTopology(system, config) {
    var services = [];
    _.each(system.containerDefinitions, function(cdef) {
      if ((cdef.type === 'docker' || cdef.type === 'process') && cdef.specific && cdef.specific.proxyPort) {
        if (((config.proxy === 'all' || config.proxy === 'docker') && cdef.type === 'docker') || 
            ((config.proxy === 'all' || config.proxy === 'process') && cdef.type === 'process')) {
          var containers = _.filter(system.topology.containers, function(c) { return c.containerDefinitionId === cdef.id; });

          var nodes = [];
          _.each(containers, function(c) {
            var ips = readIpDetails(system, c);
            var idx = 0;
            _.each(ips, function(ip) {
              if (ip.ipaddress && ip.port) {
                if (!nodes[idx]) { nodes[idx] = []; }
                nodes[idx].push(ip);
                ++idx;
              }
            });
          });

          if (nodes.length > 0) {
            var idx = 0;
            _.each(nodes, function(nodesEntry) {
              var proxyPort = _.isArray(containers[0].specific.proxyPort) ? containers[0].specific.proxyPort[idx] : containers[0].specific.proxyPort;
              services.push({name: cdef.name, port: proxyPort, nodes: nodesEntry});
              ++idx;
            });
          }
        }
      }
    });
    return services;
  };



  var generate = function generate(system, config, cb) {
    cb(transformTopology(system, config));
  };



  return {
    generate: generate,
  };
};

