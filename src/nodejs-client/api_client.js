var fs = require("fs");
var path = require("path");

var request = require("ajax-request");

var config = require("../config");
var Logger = require("./logger");
var BroHost = require("./host");
var BroDownloader = require("./downloader");

var BroApiClient = {};
BroApiClient.server = "http://" + config.REST_SERVER_IP + ":" + config.REST_SERVER_PORT;
BroApiClient.allFiles = [];
BroApiClient.host = null;
BroApiClient.downloader = null;

BroApiClient.onFileList = function (files) {
    BroApiClient.allFiles = files;
};

BroApiClient.init = function (eventListener) {
    BroApiClient.list();
    BroApiClient.host = new BroHost();
    BroApiClient.host.run();
    BroApiClient.downloader = new BroDownloader();
    BroApiClient.downloader.onfiledownloaded = BroApiClient._onFileDownloaded;

    BroApiClient.listener = eventListener;
};

BroApiClient._onFileDownloaded = function (file, downloadLocation, size, wasSuccessful) {
    if (wasSuccessful) {
        Logger.log("Successfully downloaded file ".info, file.data, " to ".info, downloadLocation.info);
        BroApiClient._seedFile("", file, downloadLocation, size, "", false);
    }
    else {
        Logger.log("Failed to store file ".error, file.data,  " at ".error, downloadLocation.data);
    }
}

BroApiClient.list = function (filePattern, onlyMine) {
    request(BroApiClient.server + "/files/", function (err, req, body) {
        BroApiClient.onFileList(JSON.parse(body || ""));
    });
    var list = BroApiClient.allFiles.slice(0);
    if (filePattern) {
        list = list.filter(function (f) { return filePattern.test(f.name); });
    }
    if (onlyMine) {
        list = list.filter(function (f) { return !!BroApiClient.host.publishedFiles[f.name]; } );
    }
    return list;
};

BroApiClient.listDownloaded = function () {
    return BroApiClient.downloader.brotorrents;
}

BroApiClient.publish = function (author, filename, pathToFile, size, description) {
    BroApiClient._seedFile(author, filename, pathToFile, size, description, true);
};

BroApiClient._seedFile = function (author, filename, pathToFile, size, description, mustPublish) {
    var fileInfo = {
        file: filename,
        path: pathToFile,
        size: size,
        author: author,
        description: description
    };
    if (mustPublish) {
        request.post({
            "url": BroApiClient.server + "/publish",
            data: fileInfo
        }, function (err, req, body) {
            if (err) {
                Logger.log("Failed to publish file: ".error, file.data);
            }
            else {
                BroApiClient.host.publishFile(fileInfo);
            }
        });
    }
    else {
        request.post({
            url: BroApiClient.server + "/seed",
            data: {
                file: filename
            }
        }, function (err, req, body) {
            if (!err) {
                BroApiClient.host.publishFile(fileInfo);
            }
        })
    }
};

BroApiClient.unseed = function (file) {
    request({
        method: "DELETE",
        url: BroApiClient.server + "/seed",
        data: { file: file }
    }, function (err, req, body) {
        if (err) {
            Logger.log("Failed to unseed file: ".error, file.data);
        }
        else {
            BroApiClient.host.unpublishFile(file);
        }
    });
};

BroApiClient.info = function (file) {
    request(BroApiClient.server + "/download/" + file, function (err, res, body) {
        if (err || res.statusCode !== 200) {
            Logger.log("Failed to get info for file: ".error, file.data);
            return;
        }
        body = JSON.parse(body);
        Logger.log("File: ".info, file.data);
        Logger.log("Author: ".info, body.author.data);
        Logger.log("Description: ".info, body.description.data);
        Logger.log("Seeders: ".info, JSON.stringify(body.broseeders).data);
    });
};

BroApiClient.download = function (file, downloadLocation) {
    request(BroApiClient.server + "/download/" + file, function (err, res, body) {
        if (err || res.statusCode !== 200) {
            Logger.log("Failed to download: ".error, file.data);
            return;
        }
        body = JSON.parse(body);
        var onProgressCallback = BroApiClient.listener.onprogress.bind(BroApiClient.listener);
        BroApiClient.downloader.enqueue(file, body.size, downloadLocation, body.broseeders, onProgressCallback);
        Logger.log("Now downloading ".info, file.data, " to ".info, downloadLocation.data);
    });
};

module.exports = BroApiClient;
