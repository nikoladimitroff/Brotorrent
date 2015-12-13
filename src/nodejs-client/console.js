var fs = require("fs");
var path = require("path");
var readline = require("readline");

var colors = require("colors");

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
    list: /list(?:\s+(.+))?/,
    publish: /publish\s+((?:\.\.|\w|\\|\/|:|\.)+)\s+(".+")/,
    download: /download\s+(.+)\s+((?:\.\.|\w|\\|\/|:|\.)+)/,
    author: /author(?:\s+(.+))?/,
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
        var filePattern = new RegExp(RegexPatterns.list.exec(line)[1]);
        var files = BroApiClient.list(filePattern);
        console.log("All downloadable files".bold.white);
        var separator = stringWithLength(75, "=").bold;
        console.log(separator);
        var headerRow = stringWithWidth(Indent.length, "i", " ") + "| " +
            stringWithWidth(30, "File", " ") + "| " +
            stringWithWidth(10, "Author", " ") + "| " +
            stringWithWidth(10, "Size", " ") + "| " +
            stringWithWidth(20, "Description", " ");
        console.log(headerRow.white);
        console.log(separator);
        for (var i = 0; i < files.length; i++) {
            var outputLine = stringWithWidth(Indent.length, i.toString(), " ") + "| " +
            stringWithWidth(30, files[i].name, " ") + "| " +
            stringWithWidth(10, files[i].author, " ") + "| " +
            stringWithWidth(10, files[i].size.toString(), " ") + "| " +
            stringWithWidth(20, files[i].description, " ");
            console.log(outputLine);
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
            return console.log(errorMessage.error);
        }
        BroApiClient.publish(this.author, fileToPublish, size, description);
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
            console.log("Current author: ".info, author.data);
        }
    }
    else {
        console.log("Unknown command!".warn);
    }
    this.rl.prompt();
};

Bronsole.prototype.onclose = function () {
    //this.rl.question("Are you sure you want to exit?".italic, function (answer) {
    //    if (answer.toLowerCase().indexOf("y") === 0) {
            process.exit(0);
    //    }
    //});
}

Bronsole.prototype._init = function () {
    BroApiClient.init()
};

Bronsole.prototype.run = function () {
    this._init();

    console.log("Welcome to Bronsole".underline.bold);
    this.rl.setPrompt("Bronsole> ");
    this.rl.prompt();

    this.rl.on("line", this.onreadline.bind(this))
           .on("close", this.onclose.bind(this));
};

module.exports = Bronsole;
