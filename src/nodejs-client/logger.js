var os = require("os");

var Logger = function () {
    this._log = "";
};

Logger.prototype.log = function () {
    var args = Array.prototype.slice.call(arguments);
    this._log += args.map(JSON.stringify.bind(JSON)).join("") + os.EOL;
};

Logger.prototype.getLog = function () {
    return this._log;
};

if (global.runningInNET) {
    module.exports = new Logger();
}
else {
    module.exports = console;
}
