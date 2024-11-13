let localConnection;
let remoteConnection;
let screenStream;
let db = firebase.firestore();

// Start screen sharing
async function startScreenShare() {
    try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        document.getElementById('sharedScreen').srcObject = screenStream;
        setupPeerConnection();
    } catch (error) {
        console.error("Error capturing screen:", error);
    }
}

// Set up WebRTC peer connection
function setupPeerConnection() {
    const servers = {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    };
    localConnection = new RTCPeerConnection(servers);
    remoteConnection = new RTCPeerConnection(servers);

    screenStream.getTracks().forEach(track => localConnection.addTrack(track, screenStream));

    localConnection.onicecandidate = event => {
        if (event.candidate) {
            db.collection("sessions").doc("session").set({
                ice: event.candidate
            }, { merge: true });
        }
    };

    remoteConnection.ontrack = event => {
        document.getElementById('remoteScreen').srcObject = event.streams[0];
    };

    db.collection("sessions").doc("session").onSnapshot(async snapshot => {
        const data = snapshot.data();
        if (data && data.offer) {
            await remoteConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await remoteConnection.createAnswer();
            await remoteConnection.setLocalDescription(answer);
            db.collection("sessions").doc("session").set({ answer });
        } else if (data && data.answer) {
            await localConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
    });

    createOffer();
}

// Create an offer
async function createOffer() {
    const offer = await localConnection.createOffer();
    await localConnection.setLocalDescription(offer);
    db.collection("sessions").doc("session").set({ offer });
}

// Join the session
function joinSession() {
    alert("Join session feature is coming soon!");
}

// Event listeners
document.getElementById("startSharing").addEventListener("click", startScreenShare);
document.getElementById("joinSession").addEventListener("click", joinSession);

