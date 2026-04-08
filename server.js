// server.js — Confession API ∞ (clean version, no Easter eggs)
const express = require("express");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const app = express();
app.use(express.json());
app.set("json spaces", 2);

// serve images statically
app.use("/images", express.static(path.join(__dirname, "images")));

// helpers
const rand = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rand(arr.length)];
const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// keyword mapping
const keywordMap = [
  { keys: ["i love", "love you", "i'm in love"], cat: "love" },
  { keys: ["i hate", "leave me", "go away", "you suck"], cat: "hate" },
  { keys: ["sorry", "my bad", "forgive me"], cat: "sorry" },
  { keys: ["miss you", "you there", "where are you"], cat: "miss" },
  { keys: ["fine.", "k", "ok.", "whatever"], cat: "cold" },
  { keys: ["cringe", "awkward", "pickup line", "nice try"], cat: "cringe" }
];

// message pools
const POOLS = {
  love: [
    "She said 'aww' — which is cute, but not a yes.",
    "She liked your message but loved someone else.",
    "You said 'I love you'. She said 'haha'.",
    "Your message delivered, feelings not confirmed.",
    "Love request pending — waiting for emotional approval.",
    "Cupid lost signal halfway.",
    "She replied 'thanks 😅' — emotional rejection disguised as kindness.",
    "You confessed; she sent a heart emoji. To someone else.",
    "Your love hit 'read' status with no reply.",
    "You fell. She stepped aside.",
    "Romance attempted. Heart rate: unstable.",
    "She said 'that’s sweet' — soft decline detected.",
    "You sent love. Server responded: friend zone.",
    "Emotional delivery failed. Retry after healing.",
    "You’re now in her group chat screenshots.",
    "Your text started butterflies, ended in silence.",
    "She said 'I need time' — translation: move on.",
    "Love sent ✅. Reply pending ⏳.",
    "Cupid’s arrow hit Wi-Fi dead zone.",
    "You typed 'I love you', she typed 'good night'.",
    "She said 'same' — but tone unknown.",
    "You shot your shot. Airball.",
    "Heart request timed out.",
    "She said 'I appreciate it' — you shouldn’t.",
    "She replied 'hmm' — worst possible response.",
    "You gave your heart. She sent a 👍.",
    "Romantic hopes crashed. Restart feelings.exe.",
    "You called her 'mine'. She sent your location to the police.",
    "You said 'forever', she heard 'whatever'.",
    "She said 'I’m flattered' — heartbreak 404.",
    "You confessed. She ghosted. End of story.",
    "You’re now part of her 'funny DMs' folder.",
    "Your feelings: delivered, deleted, and ignored.",
    "She left you on 'typing...'.",
    "You said 'I love you'. Echo replied 'who cares'.",
    "Love failed to deploy. Try friendship instead.",
    "Emotional API returned: 'Access Denied'.",
    "Heart upload complete. Response: null.",
    "Love attempt logged. Outcome: tragedy.",
    "You’re brave, but not lucky."
  ],
  hate: [
    "You said 'I hate you' — she said 'ok'.",
    "Anger delivered successfully. Understanding failed.",
    "You’re mad. She’s watching stories unbothered.",
    "You tried to delete memories — file locked.",
    "Hate detected. Therapy recommended.",
    "You shouted your hate. She posted a selfie.",
    "You’re angry, but your heart didn’t get the memo.",
    "You typed 'I hate you' but meant 'notice me'.",
    "Your hate message got seen — no reply. Ouch.",
    "You tried to block her, but feelings bypassed firewall.",
    "Hate overflow error — emotions too hot.",
    "You said 'I hate you'. Spellcheck: 'love you?'.",
    "You insulted her. She corrected your grammar.",
    "Your anger: loud. Her reaction: nonexistent.",
    "You’re angry now, nostalgic later.",
    "She didn’t argue. That’s worse.",
    "Your rage report has been archived by peace.",
    "You said 'never again'. You'll text again.",
    "She replied 'who hurt you?' — ironic, right?",
    "You’re over it. Totally. Not really.",
    "Your hate post got 2 likes. Both from bots.",
    "You blocked her. Checked her story 3 minutes later.",
    "Hate level: unstable. Logic level: offline.",
    "She said 'you’ll miss me'. You already do.",
    "You said 'done with you' — 7th time this week.",
    "You cursed her name. She still looks good.",
    "You burned the bridge and tried to text her across it.",
    "Anger level high. Dignity level low.",
    "She called you dramatic. You wrote a paragraph.",
    "You said 'I hate you'. Heart said 'maybe not'.",
    "You hate her. Your playlist disagrees.",
    "You said 'goodbye'. Still checking messages.",
    "Rage sent. Peace unsent.",
    "Your anger: 100%. Your self-control: 0%.",
    "You deleted the chat. Then scrolled to find it again.",
    "You hate her now, love her tomorrow. Routine confirmed."
  ],
  sorry: [
    "You said sorry — she saw it, didn’t reply.",
    "Apology received. Forgiveness pending.",
    "She said 'it’s fine' — it’s not fine.",
    "You’re forgiven, but not unblocked.",
    "You said 'sorry again' — now it’s awkward.",
    "Apology processed. Trust not restored.",
    "You said 'my bad'. She said 'you always are'.",
    "She read it, sighed, and moved on.",
    "You said sorry too late — damage already shipped.",
    "Apology accepted. Feelings declined.",
    "She replied with 'hmm'. That’s emotional jail.",
    "You said sorry 3 times. She changed topic.",
    "She said 'I don’t care anymore' — she cares too much.",
    "You said 'please forgive me'. She sent a sticker.",
    "Apology logged. Hope not found.",
    "You said sorry. She said 'who are you again?'.",
    "You said sorry. She said 'you always do this'.",
    "Forgiveness rate: 12%. Regret rate: 100%.",
    "Apology overload. Server emotional limit exceeded.",
    "She’s typing... stopped typing... nevermind.",
    "You tried your best. She expected more.",
    "You said sorry. She said 'whatever' — case closed.",
    "You typed an essay. She replied 'ok'.",
    "Apology denied. Please try crying next time.",
    "You said sorry again — congratulations on the loop.",
    "Forgiveness delayed due to trauma traffic.",
    "She said 'I’ll think about it' — that’s a no.",
    "Your sorry message: delivered, ignored, and archived.",
    "You said sorry, but your actions didn’t get the update.",
    "Apology expired. Send new one tomorrow."
  ],
  miss: [
    "You said 'I miss you'. She said 'who dis?'.",
    "You miss her. She misses the peace.",
    "Message sent. Silence received.",
    "You said 'miss you' — she turned off notifications.",
    "She’s online. You’re nostalgic.",
    "You miss her. She blocked you months ago.",
    "You texted again — history repeated itself.",
    "You said 'thinking of you' — she said 'don’t'.",
    "You miss her voice. She’s busy sending reels.",
    "Miss registered. Reply missing.",
    "You said 'come back'. She said 'why?'.",
    "You miss her daily. She forgot you yearly.",
    "You saw her story. Instant relapse.",
    "You said 'I miss us'. She said 'what us?'.",
    "You miss her like bad Wi-Fi — too much.",
    "Message delivered. Closure denied.",
    "You miss her, but not her attitude.",
    "You said 'long time'. She said 'keep it that way'.",
    "You miss her. She moved on — literally.",
    "Nostalgia detected. Hope deleted.",
    "She didn’t respond. The silence spoke fluently.",
    "You said 'I miss you'. Echo replied 'same old pain'.",
    "She’s in your memories. You’re not in hers.",
    "Missed connection: feelings timeout.",
    "You miss her every night. She sleeps well.",
    "You said 'remember me?'. She doesn’t.",
    "You miss her laugh. She’s laughing at someone else’s jokes.",
    "You said 'miss you a lot'. She said 'take care'.",
    "Miss sent ✅. Memory reopened 🔁.",
    "You miss her energy. She misses nothing.",
    "You miss her so much — it’s basically cardio.",
    "She’s moved on. You’re still buffering.",
    "You said 'miss you'. She replied 'hmm'.",
    "Missed feeling detected. No fix available.",
    "You miss her voice notes. She deleted yours."
  ],
  cringe: [
    "CringeException: secondhand embarrassment returned.",
    "Pickup line caused a minor meltdown; recommend silence.",
    "500 Internal Blush Error — face control engaged.",
    "Flirtation denied. Please debug charm variable.",
    "SyntaxError: Unexpected cringe at line 'you da best'"
  ],
  cold: [
    "She said 'k'. The coldest word in language history.",
    "'Fine.' — her tone said otherwise.",
    "You said 'hi'. She said 'ok'. Game over.",
    "She replied 'seen'. Nothing more.",
    "Emotionless response. Typical Tuesday.",
    "You said 'how are you?'. She said 'good'. End scene.",
    "Her reply arrived in slow motion. With no emotion.",
    "Dry chat alert. Hydrate yourself.",
    "You sent a paragraph. She sent one emoji.",
    "You tried conversation. She tried silence.",
    "She’s online, just not for you.",
    "Cold as her last text.",
    "You said 'I miss you'. She sent '😂'.",
    "No warmth detected in her tone.",
    "You’re talking to a fridge with typing skills.",
    "Her response was so dry it sparked static.",
    "You said 'hi again'. She said 'why?'.",
    "You tried. She ghosted with elegance.",
    "Her energy could freeze Wi-Fi signals.",
    "You said 'good morning'. She left it unread till night.",
    "She said 'ok cool'. Emotional frostbite confirmed.",
    "You texted first — mistake repeated.",
    "Chat temp: below zero.",
    "You started a conversation. She ended it immediately.",
    "She replied 'maybe'. Translation: never.",
    "You said 'how’s life?'. She said 'fine'. Dead chat.",
    "Cold vibe level: Antarctica.",
    "You typed 'wyd?'. She typed 'nothing'. Then nothing.",
    "Your enthusiasm melted. Her tone didn’t.",
    "She said 'lol' — and you felt the chill.",
    "She used a period. That’s emotional punctuation.",
    "You gave effort. She gave minimal typing energy.",
    "Her replies are proof that typing can feel heartless.",
    "You said 'let’s talk'. She said 'busy'. Forever busy."
  ],
  neutral: [
    "Message processed. No drama detected.",
    "Your text was seen. Outcome: vague.",
    "Status: floating in politely indifferent waters.",
    "Response absent. The universe remains ambiguous."
  ],
  mixed: [
    "Mixed signals detected. Recommend therapy or pizza.",
    "Confusion level high — processing with extra RAM for feelings.",
    "You expressed both love and hate — congratulations on complexity."
  ],
  lucky: [
    "Plot twist: She actually replied back with 'I miss you too.'",
    "Unexpected success! She said 'yes' — celebrate responsibly.",
    "Lucky mode engaged: mutual attraction detected (temporary)."
  ]
};

// tone lists
const TONES = ["sarcastic", "dramatic", "wholesome", "sardonic", "poetic", "deadpan", "hopeful"];

// tone selector
function pickTone(category) {
  if (category === "love") return pick(["wholesome", "hopeful", "poetic"]);
  if (category === "hate") return pick(["sardonic", "deadpan", "dramatic"]);
  if (category === "sorry") return pick(["dramatic", "hopeful"]);
  if (category === "miss") return pick(["poetic", "dramatic"]);
  if (category === "cringe") return pick(["sarcastic", "deadpan"]);
  if (category === "cold") return pick(["deadpan", "sardonic"]);
  return pick(TONES);
}

// detect mood category
function detectCategory(msg) {
  const lowered = msg.toLowerCase();
  const hits = {};
  for (const entry of keywordMap) {
    for (const k of entry.keys) {
      if (lowered.includes(k)) hits[entry.cat] = (hits[entry.cat] || 0) + 1;
    }
  }
  const entries = Object.entries(hits).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    if (/\bi miss\b|\bmiss you\b|\byou there\b/.test(lowered)) return "miss";
    if (/\bi love\b|\blove you\b/.test(lowered)) return "love";
    if (/\bsorry\b|\bmy bad\b/.test(lowered)) return "sorry";
    if (/\bcringe\b|\bawkward\b|\bnice try\b/.test(lowered)) return "cringe";
    if (/\b(whatever|fine|k)\b/.test(lowered)) return "cold";
    return "neutral";
  }
  if (entries.length >= 2 && entries[0][1] === entries[1][1]) return "mixed";
  return entries[0][0];
}

// status label
function statusTextFor(category, lucky = false) {
  if (lucky) return "💞 Lucky Mode";
  switch (category) {
    case "love": return "💘 Beating Fast";
    case "hate": return "🔥 Rage Mode";
    case "sorry": return "🥲 Regretful";
    case "miss": return "💔 Lonely";
    case "cringe": return "😳 Embarrassed";
    case "cold": return "🧊 Cold Reply";
    case "mixed": return "🔀 Mixed Signals";
    default: return "🫠 Neutral";
  }
}

// emotional intensity
function computeIntensity(msg) {
  let score = 50;
  const len = Math.min(msg.length, 200);
  score += Math.floor(len / 4);
  if (/[!]{1,}/.test(msg)) score += 10;
  if (/[?]{2,}/.test(msg)) score += 5;
  if (msg.toLowerCase().includes("love")) score += 15;
  if (msg.toLowerCase().includes("hate")) score += 15;
  score += rand(21) - 10;
  return clamp(score, 5, 98);
}

// format response JSON
function makeResponseBody({ category, sender, receiver, message, replyText, tone, intensity, lucky, devInfo }) {
  const meta = {
    mood: category,
    status: statusTextFor(category, lucky),
    intensity,
    tone,
    lucky
  };
  const messageBlock = {
    from: sender,
    to: receiver,
    yourMessage: message,
    reply: replyText
  };
  if (devInfo) meta.debug = devInfo;
  return { meta, message: messageBlock };
}

// POST route
app.post("/confess-your-feelings", async (req, res) => {
  const start = Date.now();
  const dev = req.query.dev === "true" || req.headers["x-dev"] === "1";
  const { from, to, message } = req.body || {};

  const responseDelay = Math.floor(Math.random() * 700) + 100;
  await delay(responseDelay);

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    const now = new Date().toUTCString();
    res.setHeader("Date", now);
    res.setHeader("X-Heart-Status", "Neutral");
    res.setHeader("X-Feeling-Level", "none");
    res.setHeader("X-Tone", "deadpan");
    res.setHeader("X-Emotional-Score", "0");
    return res.status(400).json({
      error: {
        code: 400,
        message: "😐 Missing 'message' field. Even the API needs emotional input."
      }
    });
  }

  const sender = from?.trim() || "someone mysterious";
  const receiver = to?.trim() || "someone special";
  const msg = message.trim();

  let category = detectCategory(msg);
  if (/love/i.test(msg) && /hate/i.test(msg)) category = "mixed";

  const intensity = computeIntensity(msg);
  const tone = pickTone(category);
  const lucky = Math.random() < 0.10;

  const poolKey = lucky ? "lucky" : category === "mixed" ? "mixed" : category;
  const pool = POOLS[poolKey] || POOLS.neutral;
  let replyText = pick(pool);

  if (/love|forever|always|cant live without/i.test(msg) && !lucky && category === "love" && Math.random() < 0.15) {
    replyText = pick([
      "❤️ She replied with a small, sincere 'me too'. (This is statistically rare.)",
      "💞 Mutual warmth detected. Proceed to celebrate moderately."
    ]);
  }

  const devInfo = dev
    ? {
        detector: { guessedCategory: category, poolUsed: poolKey, length: msg.length },
        rawMsg: msg
      }
    : undefined;

  const body = makeResponseBody({
    category,
    sender,
    receiver,
    message: msg,
    replyText,
    tone,
    intensity,
    lucky,
    devInfo
  });

  const now = new Date().toUTCString();
  res.setHeader("Date", now);
  res.setHeader(
    "X-Heart-Status",
    lucky
      ? "Lucky Mode"
      : category === "love"
      ? "Beating Fast"
      : category === "hate"
      ? "Rage Mode"
      : category === "sorry"
      ? "Regretful"
      : category === "miss"
      ? "Lonely"
      : category === "cringe"
      ? "Embarrassed"
      : category === "cold"
      ? "Cold Reply"
      : category === "mixed"
      ? "Mixed Signals"
      : "Neutral"
  );
  res.setHeader("X-Feeling-Level", category);
  res.setHeader("X-Tone", tone);
  res.setHeader("X-Emotional-Score", String(intensity));

  // 💫 Meme HTTP Codes — Confession API Edition
const statusFor = {
  love: 777,        // 💘 Lucky in Love — nonstandard, ultimate success
  hate: 418,        // ☕ I'm a teapot — refusing emotional brewing
  sorry: 450,       // 🥲 Blocked by feelings (Windows parental controls)
  miss: 499,        // 💔 Client closed request — she ghosted mid-chat
  cringe: 422,      // 😳 Unprocessable Entity — too awkward to handle
  cold: 203,        // 🧊 Not Modified — emotion unchanged
  mixed: 451,       // 🔀 Unavailable for legal reasons — complicated love
  neutral: 200,     // 🫠 OK — emotionally fine, meh
  lucky: 777        // 🍀 Jackpot — impossible emotional success
};

  const statusCode = lucky ? 200 : statusFor[category] || 200;

  res.status(statusCode).json(body);
});

// random image endpoint
app.get("/random-image", async (req, res) => {
  const imagesDir = path.join(__dirname, "images");
  try {
    const allFiles = [];
    const folders = fs.readdirSync(imagesDir);
    for (const folder of folders) {
      const folderPath = path.join(imagesDir, folder);
      if (!fs.statSync(folderPath).isDirectory()) continue;
      const files = fs.readdirSync(folderPath).filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(f));
      for (const file of files) allFiles.push({ folder, file });
    }
    if (allFiles.length === 0) {
      return res.status(404).json({ error: "No images found. Add images to the /images folders." });
    }
    const chosen = pick(allFiles);
    const filePath = path.join(imagesDir, chosen.folder, chosen.file);
    const resized = await sharp(filePath).rotate().resize(600, 400, { fit: "inside" }).jpeg({ quality: 75 }).toBuffer();
    res.set("Content-Type", "image/jpeg");
    res.send(resized);
  } catch {
    res.status(500).json({ error: "Failed to load images." });
  }
});

// root hint
app.get("/", (req, res) => {
  const now = new Date().toUTCString();
  res.setHeader("Date", now);
  res.setHeader("X-Heart-Status", "Neutral");
  res.setHeader("X-Feeling-Level", "general");
  res.setHeader("X-Tone", "deadpan");
  res.setHeader("X-Emotional-Score", "0");
  res.send("💘 Confession API ∞ — POST /confess-your-feelings { from, to, message }");
});

// port + keep-alive
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`💘 Confession API ∞ running on port ${PORT}`));

// self-ping every 8 minutes
setInterval(() => {
  try {
    const host = process.env.RENDER_EXTERNAL_URL || `https://nanigoud.onrender.com`;
    fetch(`${host}/`).then(() => console.log("💤 Self-ping sent")).catch(() => console.log("⚠️ Self-ping failed"));
  } catch (e) {
    console.log("⚠️ Self-ping exception", e && e.message);
  }
}, 8 * 60 * 1000);
