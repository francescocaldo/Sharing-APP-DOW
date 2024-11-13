
    setupPeerConnection();


    // Get the offer from Firestore and set it as the remote description
    const sessionData = await sessionDoc.get();
    const offer = sessionData.data().offer;
    if (offer) {
        await remoteConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(offer)));


        // Create an answer and set it as the local description
        const answer = await remoteConnection.createAnswer();
        await remoteConnection.setLocalDescription(answer);
        await sessionDoc.update({ answer: JSON.stringify(answer) });
    }


    // Listen for ICE candidates from Firestore
    sessionDoc.onSnapshot((snapshot) => {
        const data = snapshot.data();
        if (data && data.candidate) {
            const candidate = new RTCIceCandidate(JSON.parse(data.candidate));
            remoteConnection.addIceCandidate(candidate);
        }
    });
}


// Set up WebRTC peer connection and handle ICE candidates
function setupPeerConnection(stream) {
    const servers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
    localConnection = new RTCPeerConnection(servers);
    remoteConnection = new RTCPeerConnection(servers);


    // Add screen stream to local connection if present
    if (stream) {
        stream.getTracks().forEach(track => localConnection.addTrack(track, stream));
    }


    // Set up ICE candidate listeners
    localConnection.onicecandidate = (event) => {
        if (event.candidate) {
            sessionDoc.update({ candidate: JSON.stringify(event.candidate) });
        }
    };


    remoteConnection.onicecandidate = (event) => {
        if (event.candidate) {
            sessionDoc.update({ candidate: JSON.stringify(event.candidate) });
        }
    };


    // Remote connection receives track
    remoteConnection.ontrack = (event) => {
        document.getElementById('remoteScreen').srcObject = event.streams[0];
    };
}


// Event listeners for buttons
document.getElementById("startSharing").addEventListener("click", startScreenShare);
document.getElementById("joinSession").addEventListener("click", joinSession);
