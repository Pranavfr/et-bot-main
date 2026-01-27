# ET OFFICIALS Discord Bot

A custom Discord bot for ET OFFICIALS with moderation, utility commands, and a DM to report feature.

## Features

- DM to Report system
- Moderation commands (kick, ban, clear)
- Utility commands (userinfo, serverinfo)
- Announcement system with embedded messages
- Purple themed embeds
- Quick reply system for moderators

## Commands

### Moderation
- `/kick` - Kick a member
- `/ban` - Ban a member
- `/clear` - Clear messages

### Utility
- `/userinfo` - Get information about a user
- `/serverinfo` - Get information about the server
- `/announce` - Send an announcement embed

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following:
   ```
   TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   REPORTS_CHANNEL_ID=1404904446038638674
   ```
4. Deploy slash commands:
   ```bash
   node src/deploy-commands.js
   ```
5. Start the bot:
   ```bash
   npm start
   ```

## Hosting on Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the service:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add the environment variables (TOKEN, CLIENT_ID, REPORTS_CHANNEL_ID)
5. Deploy the service

## Development

To run the bot in development mode with auto-reload:
```bash
npm run dev
```
