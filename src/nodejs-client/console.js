var fs = require("fs");
var path = require("path");
var readline = require("readline");

var colors = require("colors");

var Logger = require("./logger");
var BroApiClient = require("./api_client");

var Bronsole = function () {
    this.rl = readline.createInterface(process.stdin, process.stdout);
    colors.setTheme({
        silly: 'rainbow',
        input: 'grey',
        verbose: 'cyan',
        prompt: 'grey',
        info: 'green',
        data: 'grey',
        help: 'cyan',
        warn: 'yellow',
        debug: 'blue',
        error: 'red'
    });

    this.author = undefined;
};

var RegexPatterns = {
    list: /list\s*(--mine)?(.+)?/,
    publish: /publish\s+((?:\.\.|\w|\\|\/|:|\.)+)\s+(".+")/,
    unseed: /unseed\s+(.+)/,
    download: /download\s+(.+)\s+((?:\.\.|\w|\\|\/|:|\.)+)/,
    author: /author(?:\s+(.+))?/,
    info: /info\s+(.+)/
};
var Indent = "    ";

var stringWithLength = function (length, character) {
    return new Array(length + 1).join(character);
};

var stringWithWidth = function (width, str, filler) {
    if (str.length < width) {
        return str + stringWithLength((width - str.length) / filler.length, filler);
    }
    if (str.length > width) {
        if (width <= 2) throw new Error("unsupported"); // assert
        return str.substr(0, width - 2) + "..";
    }
    return str;
};

Bronsole.prototype.onreadline = function (line) {
    if (RegexPatterns.list.test(line)) {
        // List all items
        var match = RegexPatterns.list.exec(line);
        var onlyMine = match.length > 1 && match[1] === '--mine';
        var filePattern = new RegExp(match[2]);
        var files = BroApiClient.list(filePattern, onlyMine);
        Logger.log("Downloadable files".bold.white);
        var separator = stringWithLength(75, "=").bold;
        Logger.log(separator);
        var headerRow = stringWithWidth(Indent.length, "i", " ") + "| " +
            stringWithWidth(30, "File", " ") + "| " +
            stringWithWidth(10, "Author", " ") + "| " +
            stringWithWidth(10, "Size", " ") + "| " +
            stringWithWidth(20, "Description", " ");
        Logger.log(headerRow.white);
        Logger.log(separator);
        for (var i = 0; i < files.length; i++) {
            var outputLine = stringWithWidth(Indent.length, i.toString(), " ") + "| " +
            stringWithWidth(30, files[i].name, " ") + "| " +
            stringWithWidth(10, files[i].author, " ") + "| " +
            stringWithWidth(10, files[i].size.toString(), " ") + "| " +
            stringWithWidth(20, files[i].description, " ");
            Logger.log(outputLine);
        }
    }
    else if (RegexPatterns.publish.test(line)) {
        var match = RegexPatterns.publish.exec(line);
        var fileToPublish = path.resolve(match[1]);
        var description = match[2];

        var size = -1;
        try {
            var stats = fs.lstatSync(fileToPublish);
            if (stats.isFile()) {
                size = stats["size"];
            }
        }
        catch (e) {}
        if (size === -1) {
            var errorMessage = "Can't publish a nonexisting file: " + fileToPublish;
            return Logger.log(errorMessage.error);
        }
        var filename = path.basename(fileToPublish);
        var pathToFile = path.resolve(fileToPublish);
        BroApiClient.publish(this.author, filename, pathToFile, size, description);
    }
    else if (RegexPatterns.unseed.test(line)) {
        var match = RegexPatterns.unseed.exec(line);
        var file = match[1];
        BroApiClient.unseed(file);
    }
    else if (RegexPatterns.download.test(line)) {
        var match = RegexPatterns.download.exec(line);
        var file = match[1];
        var downloadLocation = match[2];
        BroApiClient.download(file, downloadLocation);
    }
    else if (RegexPatterns.author.test(line)) {
        var match = RegexPatterns.author.exec(line);
        if (match[1]) {
            this.author = match[1];
        }
        else {
            var author = this.author || "<No author set>"
            Logger.log("Current author: ".info, author.data);
        }
    }
    else if (RegexPatterns.info.test(line)) {
        var match = RegexPatterns.info.exec(line);
        BroApiClient.info(match[1]);
    }
    else {
        Logger.log("Unknown command!".warn);
    }
    this.rl.prompt();
};

Bronsole.prototype.onclose = function () {
    //this.rl.question("Are you sure you want to exit?".italic, function (answer) {
    //    if (answer.toLowerCase().indexOf("y") === 0) {
            process.exit(0);
    //    }
    //});
};

// BroApiClient.Listener functions
Bronsole.prototype.onprogress = function (data /* [file, progress] */) {
    console.log("Progress on file: ".info, data[0].data, " - ".info, (data[1] * 100).toFixed(2).data);
};

Bronsole.prototype._init = function () {
    BroApiClient.init(this)
};

Bronsole.prototype.run = function () {
    this._init();

    Logger.log("Welcome to Bronsole".underline.bold);
    this.rl.setPrompt("Bronsole> ");
    this.rl.prompt();

    this.rl.on("line", this.onreadline.bind(this))
           .on("close", this.onclose.bind(this));
};

module.exports = Bronsole;
