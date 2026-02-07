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

// 🔴 Capture raw body manually
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

  const signature = req.headers['x-signature-ed25519'];
  const timestamp = req.headers['x-signature-timestamp'];

  const isValid = verifyKey(
    req.rawBody,
    signature,
    timestamp,
    PUBLIC_KEY
  );

  if (!isValid) {
    return res.status(401).send('Bad request signature');
  }

  const { type, data } = req.body;

  // Handle PING
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  // Handle commands
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
  const options = data.options ?? [];
  const userOption = options.find(o => o.name === 'user');
  const reasonOption = options.find(o => o.name === 'reason');

  const targetUserId = userOption.value;
  const reason = reasonOption?.value || 'No reason provided';

  // Permission check: KICK_MEMBERS = 0x00000002
  const memberPermissions = BigInt(req.body.member.permissions);
  const KICK_PERMISSION = 1n << 1n;

  if ((memberPermissions & KICK_PERMISSION) === 0n) {
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '❌ You do not have permission to kick members.',
        flags: 64,
      },
    });
  }

  try {
    await DiscordRequest(
      `/guilds/${req.body.guild_id}/members/${targetUserId}`,
      {
        method: 'DELETE',
        body: { reason },
      }
    );

    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `✅ **User kicked successfully**\n📝 Reason: ${reason}`,
      },
    });
  } catch (err) {
    console.error(err);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content:
          '⚠️ Failed to kick the user.\nMake sure:\n• Bot has Kick Members permission\n• Bot role is above the target user',
        flags: 64,
      },
    });
  }
}


  }

  return res.status(400).send('Unhandled interaction');
});
 console.log("⚙️ About to start server...");

app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
