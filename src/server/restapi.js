var express    = require("express");
var bodyParser = require("body-parser");

var BroRestApi = function () {
    this.port = process.env.PORT || 8080;
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

BroRestApi.prototype._setupRoutes = function () {
    this.app.get("/", function (req, res) {
        res.json({ message: "hooray! welcome to our api!" });
    }.bind(this));
    this.app.get("/files", function (req, res) {
        res.json(this._filesToArray());
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

BroRestApi.prototype.start = function (host, port) {
    this.port = port || this.port;
    this.app.listen(port, host);
    console.log("Magic happens on ", host, " ", this.port);
};

module.exports = BroRestApi;