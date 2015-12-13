var fs = require("fs");
var path = require("path");

var request = require("ajax-request");

var BroHost = require("./host");
var BroDownloader = require("./downloader");

var BroApiClient = {};
BroApiClient.server = "http://localhost:8080";
BroApiClient.allFiles = [];
BroApiClient.host = null;
BroApiClient.downloader = null;

BroApiClient.onFileList = function (files) {
    BroApiClient.allFiles = files;
};

BroApiClient.init = function () {
    BroApiClient.list();
    BroApiClient.host = new BroHost();
    BroApiClient.host.run();
    BroApiClient.downloader = new BroDownloader();
};

BroApiClient.list = function (filePattern) {
    request(BroApiClient.server + "/files/", function (err, req, body) {
        BroApiClient.onFileList(JSON.parse(body || ""));
    });
    var list = BroApiClient.allFiles.slice(0);
    if (filePattern) {
        list = list.filter(function (f) { return filePattern.test(f); });
    }
    return list;
};

BroApiClient.publish = function (author, file, size, description) {
    var filename = path.basename(file);
    var fileInfo = {
        file: filename,
        path: path.resolve(file),
        size: size,
        author: author,
        description: description
    };
    request.post({
        "url": BroApiClient.server + "/publish",
        data: fileInfo
    }, function (err, req, body) {
        BroApiClient.host.publishFile(fileInfo);
    }.bind(this));
};

BroApiClient.download = function (file, downloadLocation) {
    request(BroApiClient.server + "/download/" + file, function (err, res, body) {
        if (err || res.statusCode !== 200) {
            console.log("Failed to download: ".error, file.data);
            return;
        }
        body = JSON.parse(body);
        BroApiClient.downloader.enqueue(file, body.size, downloadLocation, body.broseeders);
        console.log("Now downloading ".info, file.data, " to ".info, downloadLocation.data);
    });
};

module.exports = BroApiClient;
