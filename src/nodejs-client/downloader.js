var fs = require("fs");
var net = require("net");

var config = require("../config");

var BroDownloader = function () {
    this.settings = {}; // Socket limit, socket limit per file
    this.brorrents = [];
};

BroDownloader.prototype._getRequestCommandForBuffer = function (buffer, file) {
    return "REQUEST " +
        buffer.rangeStart + " " + buffer.rangeEnd + " " +
        file;
};

BroDownloader.prototype._getBufferForSocket = function (buffers, socket) {
    for (var i = 0; i < buffers.length; i++) {
        if (buffers[i].socket === socket) {
            return buffers[i];
        }
    }
    throw new Error("No buffer found!");
}

var removeSwapElement = function (array, element) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === element) {
            array[i] = array[array.length - 1];
            array.pop();
        }
    }
}

BroDownloader.prototype._closeConnection = function (downloadInfo, buffer) {
    var socket = buffer.socket;
    socket.removeAllListeners("connect");
    socket.removeAllListeners("data");
    socket.end();
    removeSwapElement(downloadInfo.sockets, socket);
}

BroDownloader.prototype._tryCompleteDownload = function (downloadInfo) {
    var totalDataDownloaded = downloadInfo.buffers.reduce(function (sum, buffer) {
        return sum + buffer.dataWritten;
    }, 0);
    if (totalDataDownloaded === downloadInfo.size) {
        fs.open(downloadInfo.downloadLocation, "w", function (err, fd) {
            if (err) {
                console.log("Brodownloader failed to save file at ".error, downloadInfo.downloadLocation.data);
                return;
            }
            var totalBuffer = new Buffer(downloadInfo.size);
            for (var i = 0; i < downloadInfo.buffers.length; i++) {
                var buffer = downloadInfo.buffers[i];
                buffer.data.copy(totalBuffer, buffer.rangeStart);
            }
            fs.write(fd, totalBuffer, 0, totalBuffer.length, function (err, written) {
                if (err) {
                    console.log("Brodownloader failed to store file contents at ".error, downloadInfo.downloadLocation.data);
                }
                else {
                    console.log("Successfully downloaded file: ".info, downloadInfo.file.data);
                }
                fs.close(fd);
            });
        }.bind(this));
        this.dequeue(downloadInfo);
    }
}

BroDownloader.prototype._ondatareceived = function (socket, downloadInfo, data) {
    var buffer = this._getBufferForSocket(downloadInfo.buffers, socket);
    if (!downloadInfo.requestAccepted) {
        // Check whether the request was accepted or refused
        var connectionResult = buffer.toString("utf-8", 0, config.COMMANDS.accept.length);
        if (connectionResult === config.COMMANDS.refuse) {
            this._closeConnection(downloadInfo, buffer);
            return;
        }
        else {
            buffer.dataWritten += data.copy(buffer.data, buffer.dataWritten, config.COMMANDS.accept.length);
        }
        downloadInfo.requestAccepted = true;
    }
    else {
        // Copy the entire buffer
        buffer.dataWritten += data.copy(buffer.data, buffer.dataWritten);
    }
    if (buffer.dataWritten === (buffer.rangeEnd - buffer.rangeStart)) {
        // finished the task, try to get a new one or close the socket if no tasks are left
        var tasksLeft = this._tryDownloadNextPacket(buffer.socket, downloadInfo);
        if (!tasksLeft) {
            this._closeConnection(downloadInfo, buffer);
            this._tryCompleteDownload(downloadInfo);
        }
    }
}

BroDownloader.prototype._onconnected = function (socket, downloadInfo) {
    socket.on("data", this._ondatareceived.bind(this, socket, downloadInfo));
    this._tryDownloadNextPacket(socket, downloadInfo);
};

BroDownloader.prototype._tryDownloadNextPacket = function (socket, downloadInfo) {
    var buffer = null;
    for (var i = 0; i < downloadInfo.buffers.length; i++) {
        // if no socket is attached to the buffer, the task is not yet taken
        if (downloadInfo.buffers[i].socket === null) {
            buffer = downloadInfo.buffers[i];
            break;
        }
    }
    if (buffer === null) {
        // No tasks left
        return false;
    }
    buffer.socket = socket;
    socket.write(this._getRequestCommandForBuffer(buffer, downloadInfo.file));
    return true;
}

BroDownloader.prototype._startDownload = function (downloadInfo) {
    // Create a queue of buffers (tasks)
    var packetSize = Math.min(1 << 30, downloadInfo.size); // Max packet size is 1MB
    var packetCount = Math.ceil(downloadInfo.size / packetSize);
    var currentRequestSize = 0; // The last packet size should be equal totalSize - sum(otherPackets)
    for (var i = 0; i < packetCount; i++) {
        var currentPacketSize = Math.min(packetSize, downloadInfo.size - currentRequestSize);

        var newBuffer = {
            rangeStart: currentRequestSize,
            rangeEnd: currentPacketSize,
            data: new Buffer(currentPacketSize),
            dataWritten: 0,
            requestAccepted: false,
            socket: null
        };
        downloadInfo.buffers.push(newBuffer);

        currentRequestSize += currentPacketSize;
    }
    var sockets = [];
    for (var i = 0; i < downloadInfo.seeders.length; i++) {
        var socket = new net.Socket();
        socket.connect({
            host: downloadInfo.seeders[i],
            port: config.BROHOST_PORT,
            localPort: config.BRODOWNLOADER_PORT
        }, this._onconnected.bind(this, socket, downloadInfo));
        sockets.push(socket);
    }
    downloadInfo.sockets = sockets;
};


BroDownloader.prototype.dequeue = function (downloadInfo) {
    removeSwapElement(this.brorrents, downloadInfo);
};

BroDownloader.prototype.enqueue = function (file, size, downloadLocation, seeders) {
    this.brorrents.push({
        file: file,
        size: size,
        downloadLocation: downloadLocation,
        buffers: [],
        seeders: seeders
    });
    this._startDownload(this.brorrents[this.brorrents.length - 1]);
};

module.exports = BroDownloader;
