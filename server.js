//instancia nossa biblioteca websocket 
var WebSocketServer = require('ws').Server;

//Cria o websocket server na porta 9090
var wss = new WebSocketServer({port: 9090});

//Todos os usuarios conectados no servidor
var users = {};

//Function para enviar mensagem
function sendTo(connection, message) {
    connection.send(JSON.stringify(message));
}

//Quando um usuario conectar no nosso servidor
wss.on('connection', function(connection) {
    console.log("Usuario conectado");

    //Quando o servidor recebe uma mensagem de um usuario conectado
    connection.on('message', function(message) {
        var data;

        try {
            data = JSON.parse(message);
        } catch (e) {
            console.log("JSON Inválido");
            data = {};
        }

        //Selecionando o tipo de mensagem do usuario
        switch (data.type) {
            case "login":
                console.log("Usuario logado:", data.name);

                if(users[data.name]) {
                    sendTo(connection, {
                        type: "login",
                        success: false
                    });
                } else {
                    users[data.name] = connection;
                    connection.name = data.name;

                    sendTo(connection, {
                        type: "login",
                        success: true
                    });
                }

                break;

            case "offer":
                console.log("Enviando convite para: ", data.name);

                var conn = users[data.name];

                if (conn != null) {
                    connection.otherName = data.name;

                    sendTo(conn, {
                        type: "offer",
                        offer: data.offer,
                        name: connection.name
                    });
                }

                break;

            case "answer":
                console.log("Enviando resposta para: ", data.name);

                var conn = users[data.name];

                if (conn != null) {
                    connection.otherName = data.name;

                    sendTo(conn, {
                        type: "answer",
                        answer: data.answer
                    });
                }

                break;

            case "candidate":
                console.log("Enviando candidato para: ", data.name);

                var conn = users[data.name];

                if (conn != null) {
                    sendTo(conn, {
                        type: "candidate",
                        candidate: data.candidate
                    });
                }

                break;
            
            case "leave":
                console.log("Disconectando de: ", data.name);

                var conn = users[data.name];
                conn.otherName = null;

                if (conn != null) {
                    sendTo(conn, {
                        type: "leave"
                    });
                }

                break;

            default:
                sendTo(connection, {
                    type: "error",
                    message: "Comando nao encontrado: " + data.type
                });

                break;
        }
    });

    connection.on('close', function() {
        if (connection.name) {
            delete users[connection.name];

            if (connection.otherName) {
                console.log("Disconectando de: ", connection.otherName);
                var conn = users[connection.otherName];
                conn.otherName = null;

                if (conn != null) {
                    sendTo(conn, {
                        type: "leave"
                    });
                }
            }
        }
    });

    connection.send("Hallo");
});