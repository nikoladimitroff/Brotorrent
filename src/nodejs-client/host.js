var fs = require("fs");
var net = require("net");

var config = require("../config");

var BroFilehost = function () {
    this.clients = [];
    this.server = null;
    this.publishedFiles = {};
};

var RegexPatterns = {
    request: /REQUEST (\d+) (\d+) (.+)/
};

BroFilehost.prototype._closeConnection = function (socket) {
    socket.removeAllListeners("connect");
    socket.removeAllListeners("data");
    socket.end();
    for (var i = 0; i < this.clients.length; i++) {
        if (this.clients[i] === socket) {
            this.clients[i] = this.clients[this.clients.length - 1];
            this.clients.pop();
        }
    }
    console.log("Closed connection to: ".info, socket.remoteAddress.data);
}

BroFilehost.prototype._refuseSocketConnection = function (socket, reason) {
    console.log(reason.bold.error);
    socket.write(config.COMMANDS.refuse);
    this._closeConnection(socket);
};

BroFilehost.prototype._serveFileRequest = function (socket, rangeStart, rangeEnd, fileInfo) {
    var buffer = new Buffer(rangeEnd - rangeStart);
    fs.open(fileInfo.path, "r", function (err, fd) {
        if (err) {
            this._refuseSocketConnection(socket, "Brohost failed to find published file: " + fileInfo.file);
            return;
        }
        socket.write(config.COMMANDS.accept);
        fs.read(fd, buffer, 0, rangeEnd, rangeStart, function(err, num) {
            if (err || num != (rangeEnd - rangeStart)) {
                console.log("Brohost failed to serve file request for: ".error, fileInfo.path.data);
            }
            else {
                socket.write(buffer.toString('utf-8', 0, buffer.length));
                console.log("Brohost served file request for: ".info, fileInfo.path.data);
            }
            this._closeConnection(socket);
        }.bind(this));
    }.bind(this));
}

BroFilehost.prototype._ondata = function (socket, data) {
    var command = data.toString();
    if (RegexPatterns.request.test(command)) {
        var match = RegexPatterns.request.exec(command);
        var file = match[3];
        var fileInfo = this.publishedFiles[file];
        if (!fileInfo) {
            this._refuseSocketConnection(socket,
                "Brohost received a download request for unpublished file: " + file);
            return;
        }
        var rangeStart = ~~match[1];
        var rangeEnd = ~~match[2];
        if (rangeEnd - rangeStart < 1) {
            this._refuseSocketConnection(socket,
                "Brohost received a download request with invalid range: " + match[1] + " / " + match[2]);
            return;
        }
        this._serveFileRequest(socket, rangeStart, rangeEnd, fileInfo);
    }
    else {
        this._refuseSocketConnection(socket,
            "Brohost received unknown request: ".bold.error + " " + command.info);
    }
};

BroFilehost.prototype.run = function () {
    // Start a TCP Server
    this.server = net.createServer(function (socket) {
        socket.name = socket.remoteAddress + ":" + socket.remotePort;
        this.clients.push(socket);

        // Send a nice welcome message and announce
        //socket.write("Welcome " + socket.name + "\n");

        // Handle incoming messages from clients.
        socket.on("data", this._ondata.bind(this, socket));

        // Remove the client from the list when it leaves
        socket.on('end', function () {
            this.clients.splice(this.clients.indexOf(socket), 1);
        }.bind(this));

    }.bind(this));
    this.server.listen({host: config.BROHOST_IP, port: config.BROHOST_PORT});

    // Put a friendly message on the terminal of the server.
    console.log("Brohost running at port", config.BROHOST_PORT);
};

BroFilehost.prototype.publishFile = function (fileInfo) {
    this.publishedFiles[fileInfo.file] = fileInfo;
};

BroFilehost.prototype.unpublishFile = function (filename) {
    delete this.publishedFiles[filename];
};

BroFilehost.prototype.broadcast = function (message) {
    clients.forEach(function (client) {
        client.write(message);
    });
    process.stdout.write(message);
};

module.exports = BroFilehost;