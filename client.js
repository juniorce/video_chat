var name;
var connectedUser;

var conn = new WebSocket('ws://localhost:9090');

conn.onopen = function() {
    console.log("Conectado ao servidor");
};

conn.onmessage = function(msg) {
    console.log("Recebeu uma mensagem", msg.data);
    
    var data = JSON.parse(msg.data);
 
    switch(data.type) {
        case "login":
            handleLogin(data.success);
            break;
        case "offer":
            handleOffer(data.offer, data.name);
            break;
        case "answer":
            handleAnswer(data.answer);
            break;
        case "candidate":
            handleCandidate(data.candidate);
            break;
        case "leave":
            handleLeave();
            break;
        default:
            break;
    }
};

conn.onerror = function(err) {
    console.log("Recebeu um erro", err);
}

function send(message) {
    if (connectedUser) {
        message.name = connectedUser;
    }

    conn.send(JSON.stringify(message));
}


// UI bloco selectors
var loginPage = document.querySelector('#loginPage');
var usernameInput = document.querySelector('#usernameInput');
var loginButton = document.querySelector('#loginButton');

var callPage = document.querySelector('#callPage');
var callToUsernameInput = document.querySelector('#callToUsernameInput');
var callButton = document.querySelector('#callButton');

var hangUpButton = document.querySelector('#hangUpButton');

callPage.style.display = "none";

var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');

var yourConn;
var stream;

loginButton.addEventListener("click", function(event) {
    name = usernameInput.value;

    if (name.length > 0) {
        send({
            type: "login",
            name: name
        })
    }
});

function handleLogin(success) {
    if (success === false) {
        alert("Usuario com este nome ja logado");
    } else {
        loginPage.style.display = "none";
        callPage.style.display = "block";

        navigator.webkitGetUserMedia({video: true, audio: true}, function(myStream) {
            stream = myStream;

            //localVideo.src = window.URL.createObjectURL(stream);
            localVideo.srcObject = stream;

            var configuration = {
                "iceServers" : [{"url": "stun:stun2.1.google.com:19302"}]
            };

            yourConn = new webkitRTCPeerConnection(configuration);
            yourConn.addStream(stream);
            yourConn.onaddstream = function(e) {
                //remoteVideo.src = window.URL.createObjectURL(e.stream);
                remoteVideo.srcObject = e.stream;
            };

            yourConn.onicecandidate = function(event) {
                if (event.candidate) {
                    send({
                        type: "candidate",
                        candidate: event.candidate
                    });
                }
            };
        }, function(error) {
            console.log(error);
        });
    }
};

callButton.addEventListener("click", function() {
    var callToUsername = callToUsernameInput.value;

    if (callToUsername.length > 0) {
        connectedUser = callToUsername;

        yourConn.createOffer(function (offer) {
            send({
                type: "offer",
                offer: offer
            });

            yourConn.setLocalDescription(offer);
        }, function (error) {
            alert("Erro ao criar um convite");
        });
    }
});


function handleOffer(offer, name) {
    connectedUser = name;
    yourConn.setRemoteDescription(new RTCSessionDescription(offer));

    yourConn.createAnswer(function (answer) {
        yourConn.setLocalDescription(answer);

        send({
            type: "answer",
            answer: answer
        });
    }, function(error) {
        alert("Erro ao criar uma resposta");
    });
};


function handleAnswer(answer) {
    yourConn.setRemoteDescription(new RTCSessionDescription(answer));
};


function handleCandidate(candidate){
    yourConn.addIceCandidate(new RTCIceCandidate(candidate));
};


hangUpButton.addEventListener("click", function() {
    send({
        type: "leave"
    })

    handleLeave();
});

function handleLeave() {
    connectedUser = null;
    remoteVideo.src = null;
    yourConn.close();
    yourConn.onicecandidate = null;
    yourConn.onaddstream = null;
};