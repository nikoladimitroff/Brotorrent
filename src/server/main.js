var BroRestApi = require("./restapi");

var main = function () {
    var broApi = new BroRestApi();
    broApi.start();
};

main();