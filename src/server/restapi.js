var express    = require('express');
var bodyParser = require('body-parser');

var BroRestApi = function () {
    this.port = process.env.PORT || 8080;
    this.app = express();
    this.app.use(bodyParser.json());
    this._setupRoutes();
};

BroRestApi.prototype._setupRoutes = function () {
    this.app.get('/', function(req, res) {
        console.log("Request received");
        res.json({ message: 'hooray! welcome to our api!' });   
    });
}

BroRestApi.prototype.start = function (host, port) {
    this.port = port || this.port;
    this.app.listen(port, host);
    console.log('Magic happens on ', host, ' ', this.port);
};

module.exports = BroRestApi;