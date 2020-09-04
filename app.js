//Self invoked anonymous function
(function () {
  let peer = null;
  let conn = null;

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

    /*conn.on("data", (data) => printMessage(data, "them"));
    }); */

    //Peer changed
    const event = new CustomEvent("peer-changed", {
      detail: { peerId: conn.peer },
    });

    document.dispatchEvent(event);
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
  };

  //Connect to peer server
  peer = new Peer(myPeerId, {
    host: "glajan.com",
    port: 8443,
    path: "/myapp",
    secure: true,
    config: {
      iceServers: [
        { url: ["stun:eu-turn7.xirsys.com"] },
        {
          username:
            "1FOoA8xKVaXLjpEXov-qcWt37kFZol89r0FA_7Uu_bX89psvi8IjK3tmEPAHf8EeAAAAAF9NXWZnbGFqYW4=",
          credential: "83d7389e-ebc8-11ea-a8ee-0242ac140004",
          url: "turn:eu-turn7.xirsys.com:80?transport=udp",
        },
      ],
    },
  });

  //Handle peer
  peer.on("open", peerOnOpen);
  peer.on("error", peerOnError);
  peer.on("connection", peerOnConnection);

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
    button.classList.add("connected");
  });

  // Send Message
  const sendMessage = (message) => {
    let newMessage = document.querySelector(".new-message").value;
    conn.send(newMessage);
    // Print Message
    printMessage(newMessage, "me");
  };

  document
    .querySelector(".send-new-message-button")
    .addEventListener("click", sendMessage);

  document.querySelector(".new-message").addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
})();
