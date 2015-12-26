global.runningInNET = true;

var fs = require("fs");
var path = require("path");
var readline = require("readline");

var colors = require("colors");

var Logger = require("../../../../../nodejs-client/logger");
var BroApiClient = require("../../../../../nodejs-client/api_client");

var RegexPatterns = {
    list: /list(?:\s+(.+))?/,
    publish: /publish\s+((?:\.\.|\w|\\|\/|:|\.)+)\s+(".+")/,
    unseed: /unseed\s+(.+)/,
    download: /download\s+(.+)\s+((?:\.\.|\w|\\|\/|:|\.)+)/,
    author: /author(?:\s+(.+))?/,
    info: /info\s+(.+)/
};

var BroApiBridge = function (listener) {
    BroApiClient.init(listener);

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
};

// This function will take the command to execute in the BroApiClient
// as well as any arguments. It behaves like the Bronsole, except
// it does not really print to the console
BroApiBridge.prototype.executeCommand = function (args) {
    if (args[0] === "list") {
        // List all items
        var onlyMine = args[1] === "--mine";
        var filePattern = new RegExp(args[2]);
        var files = BroApiClient.list(filePattern, onlyMine);
        return JSON.stringify(files);
    }
    else if (args[0] === "publish") {
        var author = args[1];
        var filename = args[2];
        var path = args[3];
        var size = args[4];
        var description = args[5];
        BroApiClient.publish(author, filename, path, size, description);
    }
    else if (args[0] === "unseed") {
        var match = RegexPatterns.unseed.exec(line);
        var file = match[1];
        BroApiClient.unseed(file);
    }
    else if (args[0] === "download") {
        var file = args[1];
        var downloadLocation = args[2];
        BroApiClient.download(file, downloadLocation);
    }
    else if (args[0] === "info") {
        var match = RegexPatterns.info.exec(line);
        return BroApiClient.info(match[1]);
    }
    else if (args[0] === "log") {
        return Logger.getLog();
    }
    else {
        return new Error("Unknown command!");
    }
};

return function (listener, initCallback) {
    var apiBridge = new BroApiBridge(listener);

    var commandExecutionFunc = function (command, netCallback) {
        var result = apiBridge.executeCommand(command);
        setTimeout(function () {
            if (result instanceof Error) {
                netCallback(result, result);
            } else {
                netCallback(null, result);
            }
        }, 0);
    };
    process.on("uncaughtException", function (err) {
        listener.onerror(err.stack);
    });
    initCallback(null, commandExecutionFunc);
};


