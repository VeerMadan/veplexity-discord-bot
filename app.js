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

// ✅ CORRECT way: capture raw body ONCE
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

// ---------- diagnostic /interactions handler ----------
app.post('/interactions', (req, res) => {
  const startTs = Date.now();
  console.log('>>> /interactions called');

  // headers (do NOT print token values, but we need signature presence)
  const signature = req.headers['x-signature-ed25519'];
  const timestamp = req.headers['x-signature-timestamp'];
  console.log('headers -> x-signature-ed25519 present:', !!signature, 'x-signature-timestamp present:', !!timestamp);

  // raw body info
  const raw = req.rawBody;
  const rawLen = raw ? raw.length : 0;
  let bodyPreview = null;
  try {
    bodyPreview = rawLen > 0 ? raw.toString('utf8').slice(0, 1000) : null;
  } catch (err) {
    bodyPreview = '<could not stringify raw>';
  }
  console.log('rawBody length:', rawLen, 'preview:', bodyPreview);

  // parse body (req.body should already be available)
  console.log('req.body:', JSON.stringify(req.body).slice(0, 1000));

  // If Discord PING, respond ASAP with PONG (no verify)
  const { type, data } = req.body || {};
  if (type === InteractionType.PING) {
    const resp = { type: InteractionResponseType.PONG };
    res.status(200).json(resp);
    const took = Date.now() - startTs;
    console.log(`Responded to PING (took ${took}ms). responsePayload: ${JSON.stringify(resp)}`);
    return;
  }

  // For non-PINGs, verify signature and log result
  try {
    const isValid = verifyKey(Buffer.from(req.rawBody), signature, timestamp, PUBLIC_KEY);
    console.log('verifyKey result:', isValid);
    if (!isValid) {
      res.status(401).send('Bad request signature (invalid)');
      console.warn(`Returned 401 (invalid sig). Took ${Date.now() - startTs}ms`);
      return;
    }
  } catch (err) {
    console.error('verifyKey threw:', err?.message || err);
    res.status(401).send('Bad request signature (exception)');
    return;
  }

  // Finally handle application command(s) normally
  if (type === InteractionType.APPLICATION_COMMAND) {
    if (data?.name === 'test') {
      const out = {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: `hello world ${getRandomEmoji()}` }
      };
      res.json(out);
      console.log(`Handled /test. Took ${Date.now() - startTs}ms. Resp len:${JSON.stringify(out).length}`);
      return;
    }

    if (data?.name === 'kick') {
      // send a quick ephemeral acknowledgment (you can keep your full logic separately)
      const out = {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: 'Kick received (diagnostic)', flags: 64 }
      };
      res.json(out);
      console.log(`Handled /kick stub. Took ${Date.now() - startTs}ms.`);
      return;
    }

    res.status(400).json({ error: 'Unknown command' });
    console.log('Unknown command - returned 400');
    return;
  }

  res.status(400).json({ error: 'Unhandled interaction type' });
  console.log('Unhandled interaction type - returned 400');
});
// ---------- end diagnostic handler ----------


console.log("⚙️ About to start server...");
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
