var BroRestApi = require("./restapi");

var main = function () {
    var broApi = new BroRestApi();
    broApi.start("localhost", 8080);
};

main();