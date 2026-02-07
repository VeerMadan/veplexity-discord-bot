import 'dotenv/config';

const APP_ID = process.env.DISCORD_CLIENT_ID;
const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;

if (!APP_ID || !TOKEN || !GUILD_ID) {
  throw new Error('Missing APP_ID, DISCORD_TOKEN, or GUILD_ID');
}

const url = `https://discord.com/api/v10/applications/${APP_ID}/guilds/${GUILD_ID}/commands`;

const commands = [
  {
    name: 'test',
    description: 'Basic test command',
    type: 1,
  },
  {
    name: 'kick',
    description: 'Kick a member from the server',
    type: 1,
    options: [
      {
        type: 6, // USER
        name: 'user',
        description: 'User to kick',
        required: true,
      },
      {
        type: 3, // STRING
        name: 'reason',
        description: 'Reason for kick',
        required: false,
      },
    ],
  },
];

async function register() {
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bot ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('❌ Failed to register commands:', data);
    process.exit(1);
  }

  console.log('✅ Successfully registered GUILD commands:', data.map(c => c.name));
}

register();
