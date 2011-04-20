

/*var http = require( 'http' ),
     sys = require( 'sys' ),
      io = require('socket.io'),*/

var sys = require('sys'),
    http = require('http'),
    crypto = require('crypto');
    io = require('socket.io'),
    server = http.createServer(function( request, response ) {
      sys.puts( 'Request!' );
      response.writeHead( 200, { 'Content-Type': 'text/plain' } );
      response.end( 'Hello World\n');
    }),
    socket = io.listen(server),
    json = JSON.stringify,
    log = sys.puts;
 
 server.listen( 11549 );

 socket.on('connection', function(client){
  client.on('message', function(message){
    try {
      request = JSON.parse(message.replace('<', '&lt;').replace('>', '&gt;'));
    } catch (SyntaxError) {
      log('Invalid JSON:');
      log(message);
      return false;
    }

    if(request.action != 'close' && request.action != 'move' && request.action != 'speak') {
      log('Ivalid request:' + "\n" + message);
      return false;
    }

    if(request.action == 'speak') {
      request.email = crypto.createHash('md5').update(request.email).digest("hex");
      client.send(json(request));
    }
    
    request.id = client.sessionId
    client.broadcast(json(request));
  });

  client.on('disconnect', function(){
    client.broadcast(json({'id': client.sessionId, 'action': 'close'}));
  });
});
/*server = http.createServer(function( request, response ) {
    sys.puts( 'Request!' );
    response.writeHead( 200, { 'Content-Type': 'text/plain' } );
    response.end( 'Hello World\n');
  }
	);*/


sys.puts( 'Server running on port 11549' );


// socket.io
/*var socket = io.listen(server);*/
//socket.on('connection', function(client){
	// new client is here!
	//client.on('message', function() {});
	//client.on('disconnect', function() {});
//});
