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
const PORT = process.env.PORT || 8080;

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
if (!PUBLIC_KEY) {
  throw new Error('DISCORD_PUBLIC_KEY is not set');
}

/**
 * ✅ CRITICAL:
 * Use RAW body for Discord interactions (Azure-safe)
 */
app.post(
  '/interactions',
  express.raw({ type: '*/*' }),
  (req, res) => {
    const signature = req.headers['x-signature-ed25519'];
    const timestamp = req.headers['x-signature-timestamp'];

    const rawBody = req.body;

    // Verify request
    const isValid = verifyKey(
      rawBody,
      signature,
      timestamp,
      PUBLIC_KEY
    );

    if (!isValid) {
      console.warn('❌ Invalid Discord signature');
      return res.status(401).send('Bad request signature');
    }

    // Parse JSON manually
    const interaction = JSON.parse(rawBody.toString('utf8'));
    const { type, data } = interaction;

    // ✅ Handle PING
    if (type === InteractionType.PING) {
      console.log('✅ Discord PING received');
      return res.status(200).json({
        type: InteractionResponseType.PONG,
      });
    }

    // ✅ Handle commands
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

// Health check (prevents Azure probing issues)
app.get('/', (req, res) => {
  res.status(200).send('OK');
});

console.log("⚙️ About to start server...");
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
