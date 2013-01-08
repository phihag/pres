#!/usr/bin/env node
'use strict';

var argparse = require('argparse');
var fs = require('fs');
var http = require('http');
var mustache = require('mustache');
var open = require('open');
var path = require('path');
var _ = require('underscore');
var url = require('url');



var ROOT_DIR = __dirname;

function _listPresentations(onResult) {
    fs.readdir(ROOT_DIR, function (err, files) {
        if (err) {
            onResult(err, files);
            return;
        }

        var presentations = _.filter(files, function(f) {
            return (f.indexOf('.') < 0) && (['node_modules', 'renderer', 'TODO'].indexOf(f) < 0);
        });
        onResult(null, presentations);
    });
}

function _serveStatic(filename, res) {

}

function _renderTemplate(templateName, view, res) {
    var templateFn = path.join(ROOT_DIR, 'renderer', 'templates', templateName + '.mustache');
    fs.readFile(templateFn, 'utf-8', function(err, data) {
        if (err) {
            _writeError(500, 'Could not load template ' + templateName, res);
        }
        var html = mustache.render(data, view);
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        res.write(html);
        res.end();
    });
}

function _writeError(code, msg, res) {
    res.writeHead(code, {'Content-Type': 'text/plain'});
    res.write(msg);
    res.end();
}

function handleRequest(req, res) {
    var uri = url.parse(req.url).pathname;

    if (uri == '/') {
        _listPresentations(function(err, presentations) {
            if (err) {
                _writeError(500, 'Cannot list presentations', res);
                return;
            }
            _renderTemplate('root', {presentations:presentations}, res);
        });
    } else {
        _writeError(404, 'File not Found', res);
    }
}

function main() {
    var parser = new argparse.ArgumentParser({
      addHelp:true,
      description: 'Serve presentations via HTTP'
    });
    parser.addArgument(['-l', '--launch-webbrowser'], {help: 'Launch a webbrowser that shows the presentation', action: 'storeTrue'});
    parser.addArgument(['-p', '--port'], {help: 'Port to use', defaultValue: 0});
    var args = parser.parseArgs();

    var server = http.createServer(handleRequest);
    server.listen(args.port, args.public_serv ? '' : 'localhost', function(ev) {
        var srvUrl = 'http://localhost:' + server.address().port + '/';
        console.log('presentation server running on ' + srvUrl);
        if (args.launch_webbrowser) {
            open(srvUrl);
        }
    });
}

main();
