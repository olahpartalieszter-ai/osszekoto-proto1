// PeerJs kapcsolat létrehozása 
const peer = new Peer();
let conn = null;

const myIdSpan = document.getElementById('myId');
const otherIdInput = document.getElementById('otherIdInput');
const connectBtn = document.getElementById('connectBtn');
const shareScreenBtn = document.getElementById('shareScreenBtn');
const remoteVideo = document.getElementById('remoteVideo');
const chatBox = document.getElementById('chatBox');
const msgInput = document.getElementById('msgInput');
const sendMsgBtn = document.getElementById('sendMsgBtn');
const fileInput = document.getElementById('fileInput');

//Saját azonosító megjelenítése, ha a szerver kiosztotta
peer.on('open', (id) => {
    myIdSpan.innerText = id;
});

//1. Bejövő kapcsolatok kezelése
peer.on('connection', (connection) => {
    conn = connection; setupDataConnection();
});

//Képernyőmegosztás fogadása
peer.on ('call', (call) => { 
    call.answer(); 
    call.on('stream', (remoteStream) => {
        remoteVideo.srcObject =
remoteStream;
    }); 
});

//2. Kimenő kapcsolat indítása
connectBtn.addEventListener('click', () => 
{
    const otherId = otherIdInput.value.trim();
    if (otherId) {
        conn = peer.connect(otherId);
        setupDataConnection();
    }
});

//Adatcsatorna beállítása
function setupDataConnection() {
     appendMassage("Rendszer" , "Sikeres kapcsolat létrejött!")
    
    conn.on('data', (data) => {
        if (data.type === 'text') {
            appendMassage("Másik eszköz",formatText(data.content));
        } else if (data.type === 'file') {
            handleIncomingFile(data);
        }
    });
}  

//3. Képernyőmegosztás indítása
shareScreenBtn.addEventListener('click',async () => {
    if (!conn) {
        alert("Először kapcsolódj a másik eszközhöz az ID alapján");
        return
    }
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        remoteVideo.srcObject = stream;
        peer.call(conn.peer, stream);
    } catch (err) {
        console.error("Hiba a képernyő megosztásakor:", err);
    }
});

// 4. Üzenet küldése
sendMsgBtn.addEventListener('click', sendMessage);
msgInput.addEventListener('keypress', (e) => 
    {if (e.key === 'Enter')
sendMessage(); });

function sendMessage() {
    const text = msgInput.value.trim();
    if (text && conn) {
        conn.send({ type: 'text', content: text});
        appendMassage("Én", formatText(text));
        msgInput.value = '';
    }
}

//Linkek automatikus  kattinthatóvá tétele
function formatText(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, (url) => {
        return `<a href="${url}" target="_blank">${url}</a>`;
    });
}

// Fájl kiválasztása és küldése a másik eszköznek
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && conn) {
        const reader = new FileReader();
        reader.onload = (event) => {
            conn.send({
                type: 'file',
                fileName: file.name,
                fileType: file.type,
                fileData: event.target.result
            });
            appendMassage("Én", `Fájl elküldve: <b>${file.name}</b>`);
        };
        reader.readAsDataURL(file);
    }
});

//Bejövő fájl vagy kép megjelenítése/letöltése
function handleIncomingFile(data) {
    if (data.fileType.startsWith('image/'))
{
    appendMassage("Másik eszköz", `Kép érkezett:<br><img src="${data.fileData}">`);
}   else   {
    appendMassage("Másik eszköz", `Fájl érkezett: <a href="${data.fileData}" download="${data.fileName}">${data.fileName}</a>`);
    }
}

//Segédfunkciók az üzenetek kiírása
function appendMassage(sender, htmlContent) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'msg';
    msgDiv.innerHTML = `<b>${sender}:</b> ${htmlContent}`;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}
