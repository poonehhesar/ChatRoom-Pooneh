//Self invoked anonymous function
(function () {
  let peer = null;
  let conn = null;
  let mediaConn = null;

  //Peer open
  const peerOnOpen = (id) => {
    document.querySelector(".my-peer-id").innerHTML = id;
  };

  //Peer error
  const peerOnError = (error) => {
    console.log(error);
  };

  //Connection event
  const peerOnConnection = (dataConnection) => {
    conn && conn.close();
    conn = dataConnection;
    console.log(dataConnection);

    conn.on("data", (data) => {
      console.log(data);
      printMessage(data, "them");
    });

    //Peer changed
    const event = new CustomEvent("peer-changed", {
      detail: { peerId: conn.peer },
    });

    document.dispatchEvent(event);
  };

  // On peer event: call, when they are calling you.
  const peerOnCall = (incomingCall) => {
    mediaConn && mediaConn.close();
    //Awnser incoming call
    navigator.mediaDevices
      .getUserMedia({ audio: false, video: true })
      .then((myStream) => {
        mediaConn = incomingCall;
        incomingCall.answer(myStream);
        mediaConn.on("stream", mediaConnOnStream);
      });
  };

  //Connect to peer
  const myPeerId = location.hash.slice(1);
  console.log(myPeerId);

  const connectToPeerClick = (el) => {
    const peerId = el.target.textContent;
    conn && conn.close();
    conn = peer.connect(peerId);
    conn.on("open", () => {
      console.log("connection open");
      const event = new CustomEvent("peer-changed", {
        detail: { peerId: peerId },
      });

      document.dispatchEvent(event);

      conn.on("data", (data) => {
        console.log(data);
        printMessage(data, "them");
      });
    });
  };

  //Print message function
  let printMessage = (message, user) => {
    let today = new Date();
    var time =
      today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

    const msgDiv = document.querySelector(".messages");
    const msgsWrapperDiv = document.createElement("div");
    const newMsgDiv = document.createElement("div");

    //Time
    newMsgDiv.innerText = time + ": " + message;

    msgsWrapperDiv.classList.add("message");
    msgsWrapperDiv.classList.add(user);
    msgsWrapperDiv.appendChild(newMsgDiv);
    msgDiv.appendChild(msgsWrapperDiv);
    msgDiv.scrollTo(0, msgDiv.scrollHeight);
  };

  //Connect to peer server
  peer = new Peer(myPeerId, {
    host: "glajan.com",
    port: 8443,
    path: "/myapp",
    secure: true,
    /* config: {
      iceServers: [
        { url: ["stun:eu-turn7.xirsys.com"] },
        {
          username:
            "1FOoA8xKVaXLjpEXov-qcWt37kFZol89r0FA_7Uu_bX89psvi8IjK3tmEPAHf8EeAAAAAF9NXWZnbGFqYW4=",
          credential: "83d7389e-ebc8-11ea-a8ee-0242ac140004",
          url: "turn:eu-turn7.xirsys.com:80?transport=udp",
        },
      ],
    },*/
  });

  //Handle peer
  peer.on("open", peerOnOpen);
  peer.on("error", peerOnError);
  peer.on("connection", peerOnConnection);
  peer.on("call", peerOnCall);

  // Display video of me
  navigator.mediaDevices
    .getUserMedia({ audio: false, video: true })
    .then((stream) => {
      const video = document.querySelector(".video-container.me video");
      video.muted = true;
      video.srcObject = stream;
    });

  const mediaConnOnStream = (theirStream) => {
    const video = document.querySelector(".video-container.them video");
    video.muted = true;
    video.srcObject = theirStream;
  };

  //List all peers
  document
    .querySelector(".list-all-peers-button")
    .addEventListener("click", () => {
      const peersEl = document.querySelector(".peers");
      peersEl.firstChild && peersEl.firstChild.remove();
      const ul = document.createElement("ul");

      peer.listAllPeers((peers) => {
        peers
          .filter((p) => p !== myPeerId)

          .forEach((peerId) => {
            console.log(peerId);

            const li = document.createElement("li");
            const button = document.createElement("button");
            button.innerText = peerId;
            button.classList.add("connect-button");
            button.classList.add(`peerId-${peerId}`);
            button.addEventListener("click", connectToPeerClick);
            li.appendChild(button);
            ul.appendChild(li);
          });
        peersEl.appendChild(ul);
      });
    });

  // Peer changed
  document.addEventListener("peer-changed", (e) => {
    const peerId = e.detail.peerId;
    console.log("peerid:", peerId);

    document.querySelectorAll(".connect-button").forEach((el) => {
      el.classList.remove("connected");
    });

    let button = document.querySelector(`.peerId-${peerId}`);
    button && button.classList.add("connected");

    //Update video subtext
    const video = document.querySelector(".video-container.them");
    video.querySelector(".name").innerHTML = peerId;
    video.classList.add("connected");
    video.querySelector(".stop").classList.remove("active");
    video.querySelector(".start").classList.add("active");
  });

  // Send Message
  const sendMessage = (message) => {
    let newMessage = document.querySelector(".new-message").value;
    conn.send(newMessage);

    // Print Message
    printMessage(newMessage, "me");
    document.querySelector(".new-message").value = "";
  };

  // Start video btn
  const startVideoCallClick = () => {
    const video = document.querySelector(".video-container.them");
    const startBtn = video.querySelector(".start");
    const stopBtn = video.querySelector(".stop");
    startBtn.classList.remove("active");
    stopBtn.classList.add("active");

    navigator.mediaDevices
      .getUserMedia({ audio: false, video: true })
      .then((myStream) => {
        mediaConn && mediaConn.close();
        mediaConn = peer.call(conn.peer, myStream);
        mediaConn.on("stream", mediaConnOnStream);
      });
  };
  document
    .querySelector(".video-container.them .start")
    .addEventListener("click", startVideoCallClick);

  //Stop video btn
  const stopVideoCallClick = () => {
    mediaConn = peer.call(conn.peer, myStream);
    const video = document.querySelector(".video-container.them");
    const startBtn = video.querySelector(".start");
    const stopBtn = video.querySelector(".stop");
    stopBtn.classList.remove("active");
    startBtn.classList.add("active");
  };
  document
    .querySelector(".video-container.them .stop")
    .addEventListener("click", stopVideoCallClick);

  //Press enter to send
  document
    .querySelector(".send-new-message-button")
    .addEventListener("click", sendMessage);

  document.querySelector(".new-message").addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
})();
