console.log("🚀 App.js booting...");

import 'dotenv/config';
import express from 'express';
import { verifyKey } from 'discord-interactions';
import {
  InteractionType,
  InteractionResponseType,
} from 'discord-interactions';
import { getRandomEmoji } from './utils.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ SINGLE body parser — captures raw body safely
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
if (!PUBLIC_KEY) {
  throw new Error('DISCORD_PUBLIC_KEY is not set');
}

app.post('/interactions', (req, res) => {
  const { type, data } = req.body || {};

  // ✅ 1. Handle PING immediately (NO verification)
  if (type === InteractionType.PING) {
    console.log('✅ Discord PING received');
    return res.status(200).json({
      type: InteractionResponseType.PONG,
    });
  }

  // ✅ 2. Verify signature for all non-PING requests
  const signature = req.headers['x-signature-ed25519'];
  const timestamp = req.headers['x-signature-timestamp'];

  const isValid = verifyKey(
    req.rawBody,
    signature,
    timestamp,
    PUBLIC_KEY
  );

  if (!isValid) {
    console.warn('❌ Invalid Discord signature');
    return res.status(401).send('Bad request signature');
  }

  // ✅ 3. Handle slash commands
  if (type === InteractionType.APPLICATION_COMMAND) {

    if (data.name === 'test') {
      return res.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `hello world ${getRandomEmoji()}`,
        },
      });
    }

    if (data.name === 'kick') {
      return res.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: 'Kick command received 👢',
          flags: 64,
        },
      });
    }
  }

  return res.status(400).json({ error: 'Unhandled interaction type' });
});

console.log("⚙️ About to start server...");
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
