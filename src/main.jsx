import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft, ArrowRight, AudioLines, Camera, Check, ChevronDown, CircleHelp,
  Copy, Hand, History, Home, Languages, Mic, MicOff, MessageCircle, MessageSquare,
  Monitor, Phone, Play, Plus, Send, Settings2, Share2, ShieldCheck, Sparkles,
  Users, Video, VideoOff, Volume2, X
} from "lucide-react";
import "./styles.css";
import AvatarModelViewer from "./AvatarModelViewer";

const demoRooms = [
  { code: "48273106", name: "ISL Practice Room", users: 3, messages: 8 }
];

function IconButton({ children, onClick, className = "", title, ...props }) {
  return <button className={`icon-button ${className}`} onClick={onClick} title={title} {...props}>{children}</button>;
}
function Pill({ children, tone = "neutral" }) { return <span className={`pill ${tone}`}>{children}</span>; }
function App() {
  const [page, setPage] = useState("home");
  const [role, setRole] = useState("dd");
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [activeRoom, setActiveRoom] = useState(null);
  const [createdRoom, setCreatedRoom] = useState(null);
  const [notice, setNotice] = useState("");
  const [liveRole, setLiveRole] = useState("dd");
  const [liveStarted, setLiveStarted] = useState(false);
  const [caption, setCaption] = useState("");
  const [typedMessage, setTypedMessage] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [listening, setListening] = useState(false);
  const [avatarText, setAvatarText] = useState("Hello! How can I help you?");
  const [roomName, setRoomName] = useState("ISL Bridge Room");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      recognitionRef.current?.stop();
    };
  }, []);

  function toast(msg) {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 3000);
  }
  function openCamera(destination = "scan") {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast("Camera access requires HTTPS or localhost and a supported browser.");
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(stream => {
      streamRef.current = stream;
      setCameraOn(true);
      if (destination !== "stay") setPage(destination);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    }).catch(() => toast("Camera permission was not granted. You can enter the room code instead."));
  }
  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }
  function startSpeechRecognition(target = "caption") {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast("Speech recognition is not supported in this browser. Try Chrome or type your message.");
      return;
    }
    recognitionRef.current?.stop();
    const rec = new SpeechRecognition();
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (event) => {
      const text = Array.from(event.results).map(r => r[0].transcript).join("");
      if (target === "chat") setChatInput(text);
      else if (target === "avatar") setAvatarText(text);
      else setCaption(text);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  }
  function createRoom() {
    if (!username.trim()) return toast("Choose a username first.");
    const code = String(Math.floor(10000000 + Math.random() * 90000000));
    const room = { code, name: roomName.trim() || "ISL Bridge Room", users: 1, messages: 0 };
    setCreatedRoom(room);
    setActiveRoom(room);
    setPage("created");
  }
  function joinRoom(code = roomCode) {
    if (!username.trim()) return toast("Choose a username first.");
    if (!/^\d{8}$/.test(code)) return toast("Enter a valid 8-digit room code.");
    const known = demoRooms.find(r => r.code === code) || (createdRoom?.code === code ? createdRoom : null);
    const room = known || { code, name: "Room " + code, users: 1, messages: 0 };
    setActiveRoom(room);
    setMessages([]);
    setPage("meeting");
    stopCamera();
  }
  function startLive(roleChoice) {
    setLiveRole(roleChoice);
    setLiveStarted(false);
    setCaption("");
    setPage("live");
  }
  function swapLiveRole() {
    const next = liveRole === "dd" ? "np" : "dd";
    setLiveRole(next);
    setCaption("");
    setTypedMessage("");
  }
  function addHistory(from, text, kind = "text") {
    if (!text.trim()) return;
    setHistory(prev => [...prev, { from, text: text.trim(), kind, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
  }
  function sendLiveText() {
    if (!typedMessage.trim()) return;
    addHistory(liveRole === "dd" ? "DD" : "NP", typedMessage);
    setCaption(typedMessage);
    setTypedMessage("");
    toast("Message added to this session's history.");
  }
  function sendChat() {
    if (!chatInput.trim()) return;
    const item = { id: Date.now(), user: username.trim(), role, text: chatInput.trim(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setMessages(prev => [...prev, item]);
    setHistory(prev => [...prev, { from: item.user, text: item.text, kind: "room", time: item.time }]);
    setChatInput("");
  }
  async function shareRoom() {
    const text = `Join my ISL Bridge room: ${createdRoom?.code || activeRoom?.code}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Join ISL Bridge room", text }); } catch { }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      toast("Room invite copied to clipboard.");
    } else toast(text);
  }
  function goHome() {
    stopCamera();
    setPage("home");
    setShowHistory(false);
  }

  const nav = (label, icon, target) => (
    <button className={`nav-item ${page === target ? "selected" : ""}`} onClick={() => setPage(target)}>
      {icon}{label}
    </button>
  );

  return <div className="app-shell">
    <aside className="sidebar">
      <button className="brand" onClick={goHome}>
        <span className="brand-mark"><Hand size={22} /></span>
        <span><strong>ISL Bridge</strong><small>Communication, connected</small></span>
      </button>
      <div className="side-label">WORKSPACE</div>
      {nav("Home", <Home size={18} />, "home")}
      {nav("Live translation", <Languages size={18} />, "live-choice")}
      {nav("Chat rooms", <Users size={18} />, "rooms")}
      {nav("Chat history", <History size={18} />, "history")}
      <div className="sidebar-bottom">
        <div className="privacy-card"><ShieldCheck size={18} /><div><b>No account needed</b><p>Use a username only when joining a room. This prototype stores history in memory during this session.</p></div></div>
        <div className="profile-mini"><span className="avatar-small">IS</span><div><b>ISL Bridge</b><small>Accessible by design</small></div><Settings2 size={16} /></div>
      </div>
    </aside>

    <main className="main-area">
      <header className="topbar">
        <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><b>{pageTitle(page)}</b></div>
        <div className="top-actions"><span className="secure-dot"></span><span className="top-note">Privacy-first prototype</span><button className="help-btn" onClick={() => toast("This is a front-end prototype. See README for setup and current limitations.")}><CircleHelp size={18} /></button></div>
      </header>

      {page === "home" && <section className="page-content home-page">
        <div className="hero">
          <div className="hero-copy">
            <Pill tone="mint"><Sparkles size={12} /> Accessible communication</Pill>
            <h1>Every conversation<br /><span>deserves to flow.</span></h1>
            <p>Bridge Indian Sign Language and spoken conversation in one simple space. No login. No unnecessary personal details.</p>
            <div className="hero-actions"><button className="primary-btn" onClick={() => setPage("live-choice")}>Start live translation <ArrowRight size={17} /></button><button className="secondary-btn" onClick={() => setPage("rooms")}>Explore chat rooms</button></div>
            <div className="hero-foot"><span><ShieldCheck size={15} /> No sign-up required</span><span><Languages size={15} /> ISL-first experience</span></div>
          </div>
          <div className="hero-visual">
            <div className="visual-glow"></div>
            <div className="floating-card float-top"><span className="sound-wave"><i></i><i></i><i></i><i></i><i></i></span><div><b>Voice to text</b><small>Live captions</small></div><Pill tone="mint">Live</Pill></div>
            <div className="avatar-scene">
              <div className="scene-ring ring-one"></div><div className="scene-ring ring-two"></div>
              <div className="person-illustration"><div className="person-hair"></div><div className="person-head"><div className="eye left"></div><div className="eye right"></div><div className="nose"></div><div className="smile"></div></div><div className="person-neck"></div><div className="person-body"></div><div className="person-arm arm-left"></div><div className="person-arm arm-right"></div><div className="hand-shape hand-left">✋</div><div className="hand-shape hand-right">🤚</div></div>
              <div className="floating-card float-bottom"><span className="translation-icon"><Hand size={18} /></span><div><b>Sign language</b><small>Avatar translation</small></div><span className="green-check"><Check size={13} /></span></div>
            </div>
          </div>
        </div>
        <div className="section-heading"><div><span className="eyebrow">GET STARTED</span><h2>How would you like to connect?</h2></div><span className="muted">Choose a mode to begin</span></div>
        <div className="feature-grid">
          <button className="feature-card" onClick={() => setPage("live-choice")}><div className="feature-icon violet"><Languages size={23} /></div><div className="feature-text"><h3>Live translation</h3><p>Talk face-to-face with live captions, speech output, and an avatar interface.</p><span className="card-link">Start a conversation <ArrowRight size={15} /></span></div><span className="feature-number">01</span></button>
          <button className="feature-card" onClick={() => setPage("rooms")}><div className="feature-icon teal"><MessageCircle size={23} /></div><div className="feature-text"><h3>Chat room</h3><p>Bring multiple people into one room using a QR code or an 8-digit room code.</p><span className="card-link">Join or create a room <ArrowRight size={15} /></span></div><span className="feature-number">02</span></button>
        </div>
        <div className="notice-strip"><div className="notice-symbol"><ShieldCheck size={19} /></div><div><b>Built with privacy in mind</b><p>This prototype does not ask for an email, password, or profile. Camera and microphone are requested only when you choose to use them.</p></div><ArrowRight size={17} /></div>
      </section>}

      {page === "live-choice" && <section className="page-content narrow-page">
        <button className="back-link" onClick={goHome}><ArrowLeft size={16} /> Back to home</button>
        <Pill tone="mint">LIVE TRANSLATION</Pill><h1 className="page-title">Who is starting the conversation?</h1><p className="page-subtitle">Choose the interface that feels most natural for you. You can switch sides at any time.</p>
        <div className="role-grid">
          <button className="role-card dd-card" onClick={() => startLive("dd")}><div className="role-art hands-art"><span>🤟</span><span>👋</span></div><div className="role-card-copy"><Pill tone="violet">SIGN LANGUAGE</Pill><h2>I'm a DD user</h2><p>I'm a Deaf or hard-of-hearing signer. Show me the camera, sign-language view, captions and text tools.</p><span className="role-cta">Continue as DD <ArrowRight size={16} /></span></div></button>
          <button className="role-card np-card" onClick={() => startLive("np")}><div className="role-art np-art"><span className="np-chat-bubble">Aa</span><MessageSquare size={44} /></div><div className="role-card-copy"><Pill tone="teal">TEXT & VOICE</Pill><h2>I'm an NP user</h2><p>I'm a speaking user. Let me type or speak, then show the translated message and sign-language avatar.</p><span className="role-cta">Continue as NP <ArrowRight size={16} /></span></div></button>
        </div>
        <div className="tip-box"><CircleHelp size={18} /><p><b>Quick note:</b> “DD” and “NP” are just interface choices, not labels that define a person. Either participant can switch roles whenever needed.</p></div>
      </section>}

      {page === "live" && <section className="page-content live-page">
        <div className="live-header"><div><button className="back-link" onClick={() => setPage("live-choice")}><ArrowLeft size={16} /> Change interface</button><h1 className="page-title">Live translation</h1><p className="page-subtitle">A local demo of the two-way conversation flow.</p></div><div className="live-badges"><Pill tone="mint"><span className="live-dot"></span> Demo session</Pill><button className="secondary-btn compact" onClick={swapLiveRole}>Switch to {liveRole === "dd" ? "NP" : "DD"} view <ArrowRight size={14} /></button></div></div>
        <div className={`live-workspace ${liveRole === "dd" ? "dd-layout" : "np-layout"}`}>
          <div className="live-main-panel">
            <div className="panel-top"><div><span className="eyebrow">{liveRole === "dd" ? "SIGNER VIEW" : "SPEAKER VIEW"}</span><h2>{liveRole === "dd" ? "Your signing space" : "Your conversation space"}</h2></div><Pill tone="neutral"><span className="live-dot"></span> Ready</Pill></div>
            <div className="live-stage">
              {liveRole == "dd" ? <><div className="camera-placeholder"><div className="camera-orb"><Camera size={29} /></div><h3>Your camera preview</h3><p>Camera access is optional in this demo.</p><button className="stage-btn" onClick={() => openCamera("stay")}><Video size={15} /> Enable camera</button>{cameraOn && <video ref={videoRef} autoPlay muted playsInline className="camera-video" />}</div><div className="avatar-mini-panel"><AvatarFigure /><span>ISL avatar preview</span><small>Avatar animation is a UI placeholder</small></div></> : <><div className="avatar-big-panel"><AvatarModelViewer modelPath="/models/male-base-mesh-base_male.glb" />
                <div
                  style={{
                    background: "white",
                    color: "#222",
                    padding: "12px",
                    margin: "12px 0",
                    position: "relative",
                    zIndex: 100,
                  }}
                >
                  <label htmlFor="debug-pose">Dropdown visibility test: </label>
                  <select id="debug-pose" defaultValue="open">
                    <option value="open">Open hand</option>
                    <option value="fist">Fist test</option>
                  </select>
                </div>
                <Pill tone="mint"><AudioLines size={13} /> Avatar output</Pill><div className="avatar-speech">{avatarText}</div></div><div className="speaker-preview"><div className="speaker-initial">NP</div><span>Your voice / text</span><small>Input preview</small></div></>}
            </div>
            <div className="caption-panel"><div className="caption-heading"><span><MessageSquare size={15} /> Live caption</span><Pill tone="neutral">EN-IN demo</Pill></div><p>{caption || (liveRole === "dd" ? "Your translated text will appear here when a message is entered or speech is recognized." : "Spoken or typed text will appear here, ready for speech output.")}</p></div>
            <div className="stage-controls"><button className={`round-control ${cameraOn ? "active" : ""}`} onClick={() => cameraOn ? stopCamera() : openCamera("stay")} title="Toggle camera">{cameraOn ? <Video size={18} /> : <VideoOff size={18} />}</button><button className={`round-control ${micOn ? "active" : ""}`} onClick={() => { setMicOn(!micOn); if (!micOn) startSpeechRecognition("caption"); }} title="Speech input">{micOn ? <Mic size={18} /> : <MicOff size={18} />}</button><button className="primary-btn play-btn" onClick={() => { setLiveStarted(!liveStarted); if (!liveStarted && caption) addHistory(liveRole === "dd" ? "DD" : "NP", caption); toast(liveStarted ? "Session paused." : "Translation flow activated."); }}><Play size={16} />{liveStarted ? "Pause session" : "Play translation"}</button><button className="round-control" onClick={() => setShowHistory(!showHistory)} title="Session history"><History size={18} /></button></div>
          </div>
          <aside className="live-tools-panel"><div className="panel-top"><div><span className="eyebrow">MESSAGE TOOLS</span><h2>{liveRole === "dd" ? "Send a message" : "Type or speak"}</h2></div><span className="tool-bubble"><MessageCircle size={18} /></span></div><p className="tool-intro">{liveRole === "dd" ? "Type a message or use speech-to-text. Your message will be displayed as a caption." : "Speak into your microphone or type below. Browser speech synthesis can read text aloud."}</p>
            <label className="field-label">Message</label><textarea className="text-area" value={typedMessage} onChange={e => setTypedMessage(e.target.value)} placeholder={liveRole === "dd" ? "Type what you want to say…" : "Type a message for the other person…"} rows={5} />
            <div className="tool-buttons"><button className="secondary-btn" onClick={() => startSpeechRecognition("caption")}><Mic size={16} /> Speak</button><button className="primary-btn" onClick={sendLiveText}><Send size={16} /> Send</button></div>
            <div className="divider-label"><span>OR TRY AVATAR SPEECH</span></div><label className="field-label">Avatar message</label><textarea className="text-area small-area" value={avatarText} onChange={e => setAvatarText(e.target.value)} rows={2} placeholder="Text for the avatar to sign…" />
            <button className="secondary-btn full-width" onClick={() => { setCaption(avatarText); if ("speechSynthesis" in window) { window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(avatarText)); } else toast("Speech synthesis is not available in this browser."); addHistory("Avatar / TTS", avatarText, "speech"); }}><Volume2 size={16} /> Speak text aloud</button>
            <div className="tool-note"><ShieldCheck size={16} /><span>Messages remain in this browser session only. No backend is connected in this starter.</span></div>
          </aside>
        </div>
        {showHistory && <div className="history-panel"><div className="history-heading"><h3>Session history</h3><button className="text-button" onClick={() => setHistory([])}>Clear history</button></div>{history.length ? history.map((h, i) => <div className="history-item" key={i}><div><b>{h.from}</b><small>{h.time} · {h.kind}</small></div><p>{h.text}</p></div>) : <p className="empty-text">No messages yet. Send a message to start the history.</p>}</div>}
      </section>}

      {page === "rooms" && <section className="page-content narrow-page room-page">
        <button className="back-link" onClick={goHome}><ArrowLeft size={16} /> Back to home</button><Pill tone="mint">MULTI-PERSON CONVERSATION</Pill><h1 className="page-title">Your people, one room.</h1><p className="page-subtitle">Join an existing room or create a new space for your group. No account or email required.</p>
        <div className="room-form-card"><div className="room-form-head"><div className="feature-icon violet"><Users size={22} /></div><div><h2>Set up your room access</h2><p>Choose a name others can recognize inside the room.</p></div></div>
          <label className="field-label">Username <span className="required">*</span></label><input className="text-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. Praju" maxLength={24} /><small className="field-help">Must be unique within a room. This prototype checks the current browser session only.</small>
          <label className="field-label role-label">I communicate using</label><div className="choice-row"><button className={`choice-option ${role === "dd" ? "active" : ""}`} onClick={() => setRole("dd")}><span className="choice-emoji">🤟</span><span><b>Sign language</b><small>DD interface</small></span>{role === "dd" && <Check size={17} />}</button><button className={`choice-option ${role === "np" ? "active" : ""}`} onClick={() => setRole("np")}><span className="choice-emoji">Aa</span><span><b>Text & voice</b><small>NP interface</small></span>{role === "np" && <Check size={17} />}</button></div>
          <div className="room-action-grid"><div className="room-action-card"><div className="action-card-icon"><MessageCircle size={20} /></div><h3>Join a room</h3><p>Scan a room QR code or enter its 8-digit code.</p><button className="secondary-btn full-width" onClick={openCamera}><Camera size={16} /> Scan QR code</button><div className="or-divider"><span>OR ENTER CODE</span></div><div className="join-code-row"><input className="text-input code-input" value={roomCode} onChange={e => setRoomCode(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="8-digit room code" inputMode="numeric" maxLength={8} /><button className="primary-btn" onClick={() => joinRoom()}><ArrowRight size={16} /></button></div><small className="field-help">Demo room code: 48273106</small></div>
            <div className="room-action-card create-card"><div className="action-card-icon teal"><Plus size={20} /></div><h3>Create a room</h3><p>Start a new group room and invite people to join.</p><label className="field-label">Room name</label><input className="text-input" value={roomName} onChange={e => setRoomName(e.target.value)} placeholder="Give your room a name" maxLength={40} /><button className="primary-btn full-width" onClick={createRoom}><Plus size={16} /> Create room</button></div></div>
        </div>
        <div className="tip-box"><ShieldCheck size={18} /><p><b>Privacy note:</b> usernames and messages are not uploaded anywhere by this front-end demo. A production multi-device room needs a secure backend.</p></div>
      </section>}

      {page === "created" && createdRoom && <section className="page-content narrow-page created-page">
        <button className="back-link" onClick={() => setPage("rooms")}><ArrowLeft size={16} /> Back to rooms</button><div className="success-mark"><Check size={28} /></div><h1 className="page-title centered">Your room is ready to invite.</h1><p className="page-subtitle centered">Share the QR code or the room code with everyone who should join.</p>
        <div className="created-room-card"><div className="qr-wrap"><QRCodeSVG value={`${window.location.origin}/?room=${createdRoom.code}`} size={184} level="M" includeMargin /></div><h2>{createdRoom.name}</h2><p>ROOM CODE</p><div className="room-code-display">{createdRoom.code}<IconButton title="Copy code" onClick={() => { navigator.clipboard?.writeText(createdRoom.code); toast("Room code copied."); }}><Copy size={16} /></IconButton></div><div className="created-actions"><button className="primary-btn" onClick={shareRoom}><Share2 size={16} /> Share invite</button><button className="secondary-btn" onClick={() => joinRoom(createdRoom.code)}>Enter room <ArrowRight size={16} /></button></div><small className="field-help">This is a local prototype room. The code is not registered with a server.</small></div>
      </section>}

      {page === "scan" && <section className="page-content narrow-page scan-page"><button className="back-link" onClick={() => { stopCamera(); setPage("rooms"); }}><ArrowLeft size={16} /> Back to rooms</button><h1 className="page-title">Scan a room QR code</h1><p className="page-subtitle">Point your camera at a room QR code. If scanning is unavailable in this prototype, enter the 8-digit code manually.</p><div className="scan-box">{cameraOn ? <video ref={videoRef} autoPlay muted playsInline className="scan-video" /> : <Camera size={38} />}<div className="scan-frame"></div></div><p className="muted centered">QR scanning is not wired to a decoder yet; camera preview is enabled.</p><button className="secondary-btn full-width" onClick={() => { stopCamera(); setPage("rooms"); }}>Enter code manually</button></section>}

      {page === "meeting" && <section className="page-content meeting-page">
        <div className="meeting-header"><div><button className="back-link" onClick={() => { setPage("rooms"); stopCamera(); }}><ArrowLeft size={16} /> Leave room</button><h1>{activeRoom?.name || "ISL Bridge Room"}</h1><p><span className="live-dot"></span> Room {activeRoom?.code} · {messages.length + 1} local participant{messages.length === 0 ? "" : "s"}</p></div><div className="meeting-header-actions"><button className="secondary-btn compact" onClick={() => setShowHistory(!showHistory)}><History size={15} /> History</button><button className="secondary-btn compact" onClick={shareRoom}><Share2 size={15} /> Invite</button></div></div>
        <div className="meeting-layout"><div className="meeting-stage-area"><div className="meeting-stage"><div className="meeting-tile main-tile">{role === "dd" ? <><div className="tile-person">🤟</div><span className="tile-name">{username || "You"} · Signer</span><span className="tile-caption">{messages.filter(m => m.role === "dd").slice(-1)[0]?.text || "Live captions will appear here"}</span></> : <><div className="avatar-big-panel meeting-avatar"><AvatarFigure /><div className="avatar-speech">{messages.filter(m => m.role === "np").slice(-1)[0]?.text || avatarText}</div></div><span className="tile-name">ISL avatar · Signing output</span></>}</div><div className="meeting-tile small-tile"><div className="tile-person small-person">{role === "dd" ? "NP" : "DD"}</div><span className="tile-name">{role === "dd" ? "Speaking participant" : "Signing participant"}</span><span className="tile-caption">{messages[messages.length - 1]?.text || "Waiting for a message…"}</span></div></div><div className="meeting-controls"><IconButton className={micOn ? "control-on" : ""} onClick={() => setMicOn(!micOn)} title="Toggle microphone">{micOn ? <Mic size={19} /> : <MicOff size={19} />}</IconButton><IconButton className={cameraOn ? "control-on" : ""} onClick={() => cameraOn ? stopCamera() : openCamera("stay")} title="Toggle camera">{cameraOn ? <Video size={19} /> : <VideoOff size={19} />}</IconButton><button className="end-call" onClick={() => { setPage("rooms"); stopCamera(); }}> <Phone size={18} /> Leave</button><IconButton onClick={() => setShowHistory(!showHistory)} title="Chat history"><MessageSquare size={19} /></IconButton></div></div>
          <div className="room-chat"><div className="room-chat-header"><div><h3>Room conversation</h3><p>Messages from this browser session</p></div><Pill tone="neutral">{messages.length} messages</Pill></div><div className="message-list">{messages.length ? messages.map(m => <div className={`message ${m.user === username ? "own-message" : ""}`} key={m.id}><div className="message-meta"><b>{m.user}</b><Pill tone={m.role === "dd" ? "violet" : "teal"}>{m.role.toUpperCase()}</Pill><small>{m.time}</small></div><p>{m.text}</p></div>) : <div className="empty-chat"><div><MessageSquare size={23} /></div><b>Start the conversation</b><p>Send a text message or use voice input to begin.</p></div>}</div><div className="chat-compose"><textarea value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Write a message…" rows={2} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }} /><div className="compose-actions"><button className="text-button" onClick={() => startSpeechRecognition("chat")}><Mic size={15} /> Voice input</button><button className="primary-btn" onClick={sendChat}><Send size={15} /> Send</button></div></div></div></div>
        {showHistory && <div className="history-panel"><div className="history-heading"><h3>Chat history</h3><button className="text-button" onClick={() => setHistory([])}>Clear history</button></div>{history.length ? history.map((h, i) => <div className="history-item" key={i}><div><b>{h.from}</b><small>{h.time} · {h.kind}</small></div><p>{h.text}</p></div>) : <p className="empty-text">No history saved in this session yet.</p>}</div>}
      </section>}

      {page === "history" && <section className="page-content narrow-page"><Pill tone="mint">CONVERSATION RECORD</Pill><h1 className="page-title">Chat history</h1><p className="page-subtitle">Messages created in this browser session, collected in one place.</p><div className="history-panel permanent-history"><div className="history-heading"><h3>Recent messages</h3><button className="text-button" onClick={() => setHistory([])}>Clear history</button></div>{history.length ? [...history].reverse().map((h, i) => <div className="history-item" key={i}><div><b>{h.from}</b><small>{h.time} · {h.kind}</small></div><p>{h.text}</p></div>) : <div className="empty-chat"><div><History size={23} /></div><b>No conversation history yet</b><p>Start a live translation or send a room message to see it here.</p><button className="secondary-btn" onClick={() => setPage("live-choice")}>Start live translation</button></div>}</div></section>}
      <footer className="app-footer"><span>ISL Bridge · Student project prototype</span><span>Designed for access, not accounts.</span></footer>
    </main>
    {notice && <div className="toast"><Check size={16} />{notice}<button onClick={() => setNotice("")}><X size={14} /></button></div>}
  </div>;
}

function pageTitle(page) {
  return ({ home: "Home", "live-choice": "Live translation", live: "Live translation", rooms: "Chat rooms", created: "Room created", scan: "Scan QR code", meeting: "Room meeting", history: "Chat history" })[page] || "Home";
}
function AvatarFigure() {
  return <div className="avatar-figure" aria-label="Illustrated 3D avatar placeholder">
    <div className="avatar-shadow"></div><div className="avatar-neck"></div><div className="avatar-head"><div className="avatar-hair"></div><div className="avatar-ear ear-left"></div><div className="avatar-ear ear-right"></div><div className="avatar-eye eye-left"></div><div className="avatar-eye eye-right"></div><div className="avatar-nose"></div><div className="avatar-mouth"></div></div><div className="avatar-torso"></div><div className="avatar-arm avatar-arm-left"></div><div className="avatar-arm avatar-arm-right"></div><div className="avatar-hand avatar-hand-left"><span></span><span></span><span></span><span></span><i></i></div><div className="avatar-hand avatar-hand-right"><span></span><span></span><span></span><span></span><i></i></div>
  </div>;
}

createRoot(document.getElementById("root")).render(<App />);