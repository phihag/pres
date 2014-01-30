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
var watchTree = require("fs-watch-tree").watchTree;

var ROOT_DIR = __dirname;

var _MIME_TYPES = {
    js: 'application/javascript',
    css: 'text/css',

    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    svg: 'image/svg+xml',
    png: 'image/png',

    eot: 'application/vnd.ms-fontobject',
    otf: 'application/x-font-opentype',
    ttf: 'application/x-font-ttf',
    woff: 'application/x-font-woff'
};


function _isValidName(f) {
    return ((f.indexOf('.') < 0) &&
        (['node_modules', 'renderer', 'TODO'].indexOf(f) < 0));
}

function _listPresentations(onResult) {
    fs.readdir(ROOT_DIR, function (err, files) {
        if (err) {
            onResult(err, files);
            return;
        }

        var presentations = _.filter(files, _isValidName);
        onResult(null, presentations);
    });
}

function _getPresentation(name, onResult) {
    fs.readFile(path.join(ROOT_DIR, name, 'pres.html'), 'utf-8', function (err, content) {
        if (err) {
            err.code = 404;
            onResult(err);
            return;
        }
        return onResult(err, content);
    });
}

function _serveStatic(fn, res) {
    var mimeM = fn.match(/\.([^.]+)?$/);
    var mimeType = undefined;
    if (mimeM) {
        if (mimeM[1] in _MIME_TYPES) {
            mimeType = _MIME_TYPES[mimeM[1]];
        }
    }
    fs.readFile(fn, 'binary', function (err, content) {
        if (err) {
            _writeError(404, 'static file not found', res);
            return;
        }
        if (mimeType) {
            res.writeHead(200, {'Content-Type': mimeType});
        }
        res.write(content, 'binary')
        res.end();
    });
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
    var m;

    if (uri == '/') {
        _listPresentations(function(err, presentations) {
            if (err) {
                _writeError(500, 'Cannot list presentations', res);
                return;
            }
            _renderTemplate('root', {presentations:presentations}, res);
        });
        return;
    } else if (m = uri.match(/\/static\/([a-zA-Z0-9*_\.\/-]+)$/)) {
        var fn = path.join(ROOT_DIR, 'renderer', 'static', m[1]);
        return _serveStatic(fn, res);
    } else {
        m = uri.match(/\/((?:[a-z0-9-]+\/)*)([a-z0-9-]+)\/([a-zA-Z0-9.]*)$/);
        if (m && _isValidName(m[1])) {
            var folderId = m[1];
            // TODO Add support for folders here
            /*if (folderId) {
                if (_.all())
            }*/
            console.log("presentation ID: " + m[2] + ", action: " + m[3]);
            var presId = m[2];
            var action = m[3];
            _getPresentation(presId, function(err, presentationData) {
                if (err) {
                    console.log(err);
                    if (err.code == 'ENOENT') {
                        _writeError(404, 'Unknown presentation', res);
                        return;
                    } else {
                        _writeError(500, 'Internal Server Error', res);
                        return;
                    }
                }

                if (action == '') {
                    _renderTemplate('pres', {id: presId, data:presentationData}, res);
                } else {
                    var fn = path.join(ROOT_DIR, presId, action);
                    return _serveStatic(fn, res);
                }
            });
            return;
        }
    }
    _writeError(404, 'File not found', res);
}

function main() {
    var parser = new argparse.ArgumentParser({
      addHelp:true,
      description: 'Serve presentations via HTTP'
    });
    parser.addArgument(['-l', '--launch-webbrowser'], {help: 'Launch a webbrowser that shows the presentation', action: 'storeTrue'});
    parser.addArgument(['-p', '--port'], {help: 'Port to use', defaultValue: 0});
    parser.addArgument(['-P', '--public-serv'], {help: 'Make this webserver available to the world', action: 'storeTrue'});
    var args = parser.parseArgs();

    var server = http.createServer(handleRequest);
    server.listen(args.port, args.public_serv ? '' : 'localhost', function(ev) {
        var srvUrl = 'http://localhost:' + server.address().port + '/';
        console.log('presentation server running on ' + srvUrl);
        if (args.launch_webbrowser) {
            open(srvUrl);
        }
    });

    // Set up watch
    var reloadWatchers = [];
    var WebSocketServer = require('websocket').server;
    var wsServer = new WebSocketServer({
        httpServer: server
    });
    wsServer.on('request', function(request) {
        var conn;
        try {
            conn = request.accept('watch-changes-1.0', request.origin);
        } catch (e) {
            return;
        }
        reloadWatchers.push(conn);
        conn.on('close', function() {
            var index = reloadWatchers.indexOf(conn);
            if (index !== -1) {
                    reloadWatchers.splice(index, 1);
            }
        });
    });
    watchTree(ROOT_DIR, { exclude: [".git", "node_modules"] }, function (e) {
        reloadWatchers.forEach(function(conn) {
            conn.sendUTF('reload');
        });
    });
}

main();
