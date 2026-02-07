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
if (!PUBLIC_KEY) throw new Error('DISCORD_PUBLIC_KEY is not set');

app.post(
  '/interactions',
  express.raw({ type: '*/*' }),
  (req, res) => {
    const rawBody = req.body;
    const interaction = JSON.parse(rawBody.toString('utf8'));
    const { type, data } = interaction;

    // ✅ 1. HANDLE PING FIRST — NO VERIFICATION
    if (type === InteractionType.PING) {
      console.log('✅ Discord PING received');
      return res.status(200).json({
        type: InteractionResponseType.PONG,
      });
    }

    // ✅ 2. VERIFY SIGNATURE FOR EVERYTHING ELSE
    const signature = req.headers['x-signature-ed25519'];
    const timestamp = req.headers['x-signature-timestamp'];

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

    // ✅ 3. HANDLE COMMANDS
    if (type === InteractionType.APPLICATION_COMMAND) {
      if (data.name === 'test') {
        return res.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `hello world ${getRandomEmoji()}`,
          },
        });
      }
    }

    return res.status(400).json({ error: 'Unhandled interaction type' });
  }
);

// Health check
app.get('/', (_, res) => res.send('OK'));

app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
