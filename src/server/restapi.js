var express    = require("express");
var bodyParser = require("body-parser");

var config = require("../config");

var BroRestApi = function () {
    this.app = express();
    this.app.use(bodyParser.json());
    this.files = {}; // [filename: string] => { name: string, description: string, broseeders: string[] }
    this._setupRoutes();
};

BroRestApi.prototype._filesToArray = function () {
    var files = this.files;
    return Object.keys(files).map(function (key) { return files[key]; });
};

BroRestApi.prototype._validateFile = function (fileInfo) {
    return fileInfo.name && fileInfo.name.length > 3 &&
        fileInfo.size > 0;
}

var removeSwapElement = function (array, element) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === element) {
            array[i] = array[array.length - 1];
            array.pop();
        }
    }
}

BroRestApi.prototype._setupRoutes = function () {
    this.app.get("/", function (req, res) {
        res.json({ message: "hooray! welcome to our api!" });
    }.bind(this));
    var c = 0;
    this.app.get("/files", function (req, res) {
        res.json(this._filesToArray());
        console.log("Someone asked me for file listing", c++);
    }.bind(this));
    this.app.post("/publish", function (req, res) {
        var fileInfo = {
            name: req.body.file,
            author: req.body.author || "<Annonymous>",
            description: req.body.description || "<No Description>",
            size: ~~req.body.size,
            broseeders: [req.ip]
        };
        if (!this._validateFile(fileInfo)) {
            console.log("Attempt to publish invalid file by ", req.ip);
            return res.sendStatus(400);
        }
        this.files[fileInfo.name] = fileInfo;
        console.log("File ", fileInfo.name, " was published by ", req.ip);
        res.sendStatus(200);
    }.bind(this));
    this.app.delete("/publish", function (req, res) {
        var filename = req.body.file;
        this._unpublish(filename);
        res.sendStatus(200);
    }.bind(this));
    this.app.post("/seed", function (req, res) {
        var filename = req.body.file;
        var fileInfo = this.files[filename];
        if (!fileInfo) {
            res.status(404).send("No such file");
            return;
        }
        if (fileInfo.broseeders.indexOf(req.ip) != -1) {
            res.status(400).send("You are already seeding this file!");
            return;
        }
        fileInfo.broseeders.push(req.ip);
        res.sendStatus(200);
        console.log(req.ip, " started seeding ", filename);
    }.bind(this));
    this.app.delete("/seed", function (req, res) {
        var filename = req.body.file;
        var fileInfo = this.files[filename];
        if (!fileInfo) {
            res.status(404).send("No such file");
            return;
        }
        removeSwapElement(fileInfo.broseeders, req.ip);
        res.sendStatus(200);
        console.log(req.ip, " cancelled seeding '", filename, "'. Seeders remaining: ", fileInfo.broseeders.length);
        if (fileInfo.broseeders.length === 0) {
            this._unpublish(filename);
        }
    }.bind(this));
    this.app.get("/download/:filename", function (req, res) {
        console.log(req.ip, " requested downloading ", req.params.filename);
        var info = this.files[req.params.filename];
        if (info) {
            res.status(200).json(info);
        }
        else {
            res.status(404).send("No such file");
        }
    }.bind(this));
}

BroRestApi.prototype._unpublish = function (filename) {
    delete this.files[filename];
    console.log("File '", filename, "' was unpublished. It is no longer accessible.");
}

BroRestApi.prototype.start = function () {
    this.app.listen(config.REST_SERVER_PORT, config.REST_SERVER_IP);
    console.log("Magic happens on ", config.REST_SERVER_IP, " ", config.REST_SERVER_PORT);
};

module.exports = BroRestApi;