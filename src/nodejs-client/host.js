var net = require("net");

var Server = function (address, port) {
    this.address = address;
    this.port = port;
    this.clients = [];
    this.server = null;
};

Server.prototype.run = function () {
    // Start a TCP Server
    this.server = net.createServer(function (socket) {
        socket.name = socket.remoteAddress + ":" + socket.remotePort;
        this.clients.push(socket);

        // Send a nice welcome message and announce
        //socket.write("Welcome " + socket.name + "\n");

        // Handle incoming messages from clients.
        socket.on('data', function (data) {
            
        });

        // Remove the client from the list when it leaves
        socket.on('end', function () {
            this.clients.splice(this.clients.indexOf(socket), 1);
        }.bind(this));

    }.bind(this));
    this.server.listen({host: this.addres, port: this.port});

    // Put a friendly message on the terminal of the server.
    console.log("Chat server running at port", this.port);
};

Server.prototype.broadcast = function (message) {
    clients.forEach(function (client) {
        client.write(message);
    });
    process.stdout.write(message);
};

module.exports = Server;