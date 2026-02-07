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

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
if (!PUBLIC_KEY) {
  throw new Error('DISCORD_PUBLIC_KEY is not set');
}

/**
 * ✅ IMPORTANT:
 * Only parse JSON for /interactions
 * (Azure reads body globally; this avoids double-read)
 */
app.post(
  '/interactions',
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
  (req, res) => {
    const { type, data } = req.body || {};

    // 1️⃣ Respond to PING immediately (no verification)
    if (type === InteractionType.PING) {
      console.log('✅ Discord PING received');
      return res.status(200).json({
        type: InteractionResponseType.PONG,
      });
    }

    // 2️⃣ Verify signature for all other requests
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

    // 3️⃣ Handle commands
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
  }
);

// Optional: health check (prevents Azure probing /interactions)
app.get('/', (req, res) => {
  res.status(200).send('OK');
});

console.log("⚙️ About to start server...");
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
