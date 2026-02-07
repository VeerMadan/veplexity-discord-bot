console.log("🚀 App.js booting...");

import 'dotenv/config';
import express from 'express';
import { verifyKey } from 'discord-interactions';
import {
  InteractionType,
  InteractionResponseType,
} from 'discord-interactions';
import { getRandomEmoji, DiscordRequest } from './utils.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Capture raw body for signature verification
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

app.post('/interactions', async (req, res) => {
  console.log('>>> /interactions called');

  const { type, data } = req.body ?? {};

  // 🔥 VERY IMPORTANT: Respond to PING immediately
  if (type === InteractionType.PING) {
    console.log('Responding to PING');
    return res.send({ type: InteractionResponseType.PONG });
  }

  // Verify signature for all non-PING requests
  const signature = req.headers['x-signature-ed25519'];
  const timestamp = req.headers['x-signature-timestamp'];

  const isValid = verifyKey(
    req.rawBody,
    signature,
    timestamp,
    PUBLIC_KEY
  );

  console.log('Signature valid:', isValid);

  if (!isValid) {
    return res.status(401).send('Bad request signature');
  }

  // Handle slash commands
  if (type === InteractionType.APPLICATION_COMMAND) {

    if (data.name === 'test') {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `hello world ${getRandomEmoji()}`,
        },
      });
    }

    if (data.name === 'kick') {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: 'Kick command received (logic coming next 👀)',
          flags: 64,
        },
      });
    }

    return res.status(400).json({ error: 'Unknown command' });
  }

  return res.status(400).json({ error: 'Unhandled interaction type' });
});

console.log("⚙️ About to start server...");
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
