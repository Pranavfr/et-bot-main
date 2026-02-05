require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot is online!');
});

app.listen(port, () => {
    console.log(`Web server running on port ${port}`);
});

const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User, Partials.Reaction]
});

client.commands = new Collection();
const activeReports = new Map();
const invites = new Collection(); // Cache for invites

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setPresence({
        activities: [{
            name: 'DM to Report',
            type: 3 // This is for WATCHING type
        }],
        status: 'online'
    });

    // Cache invites for all guilds
    client.guilds.cache.forEach(async guild => {
        try {
            const currentInvites = await guild.invites.fetch();
            invites.set(guild.id, new Collection(currentInvites.map((invite) => [invite.code, invite.uses])));
            console.log(`Cached ${currentInvites.size} invites for ${guild.name}`);
        } catch (e) {
            console.log(`Could not cache invites for ${guild.name}`);
        }
    });
});

// Handle DM reports
client.on('messageCreate', async message => {
    if (message.channel.type === 1 && !message.author.bot) { // 1 is DM channel type
        console.log('Processing DM message from:', message.author.tag);

        try {
            const reportsChannel = await client.channels.fetch(process.env.REPORTS_CHANNEL_ID);
            if (!reportsChannel) {
                console.error('Could not find reports channel:', process.env.REPORTS_CHANNEL_ID);
                return;
            }

            // Create the report embed
            const embed = new EmbedBuilder()
                .setColor('#6C3483')
                .setTitle('📨 New Report')
                .setDescription(message.content || 'No message content')
                .setAuthor({
                    name: message.author.tag,
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                })
                .setTimestamp();

            // Handle attachments
            if (message.attachments.size > 0) {
                const attachment = message.attachments.first();
                if (attachment.contentType?.startsWith('image/')) {
                    embed.setImage(attachment.url);
                } else {
                    embed.addFields({ name: 'Attachment', value: attachment.url });
                }
            }

            // Create reply button
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`reply_${message.author.id}`)
                        .setLabel('Reply to User')
                        .setStyle(ButtonStyle.Primary)
                );

            // Send report to channel
            const reportMessage = await reportsChannel.send({
                embeds: [embed],
                components: [row]
            });

            // Store report info
            activeReports.set(message.author.id, {
                channelId: reportsChannel.id,
                messageId: reportMessage.id
            });

            // Confirm to user
            await message.reply('Your report has been sent to the moderators. They will review it and respond if necessary.');

        } catch (error) {
            console.error('Error processing DM:', error);
            try {
                await message.reply('Sorry, there was an error processing your report. Please try again later.');
            } catch (e) {
                console.error('Could not send error message to user:', e);
            }
        }


    }
});

// Handle reply button clicks
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('reply_')) {
        const userId = interaction.customId.split('_')[1];
        const user = await client.users.fetch(userId);

        const replyEmbed = new EmbedBuilder()
            .setColor('#800080')
            .setTitle('Quick Reply Options')
            .setDescription('Choose a quick reply or type a custom message');

        const quickReplies = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`quickreply_${userId}_1`)
                    .setLabel('Thank you for reporting')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`quickreply_${userId}_2`)
                    .setLabel('We\'ll look into it')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`quickreply_${userId}_3`)
                    .setLabel('Need more information')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`customreply_${userId}`)
                    .setLabel('Custom Reply')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.reply({
            embeds: [replyEmbed],
            components: [quickReplies],
            ephemeral: true
        });
    }

    if (interaction.customId.startsWith('quickreply_')) {
        const parts = interaction.customId.split('_');
        const userId = parts[1];
        const replyType = parts[2];
        const user = await client.users.fetch(userId);

        let replyContent;
        switch (replyType) {
            case '1':
                replyContent = 'Thank you for your report. We appreciate you bringing this to our attention.';
                break;
            case '2':
                replyContent = 'We will investigate this matter and take appropriate action. Thank you for reporting.';
                break;
            case '3':
                replyContent = 'Could you please provide more details about the situation? This will help us better address your report.';
                break;
        }

        await user.send(replyContent);
        await interaction.reply({ content: `Reply sent to ${user.tag}`, ephemeral: true });
    }

    if (interaction.customId.startsWith('customreply_')) {
        const userId = interaction.customId.split('_')[1];

        const modal = new ModalBuilder()
            .setCustomId(`customreply_modal_${userId}`)
            .setTitle('Send Custom Reply');

        const messageInput = new TextInputBuilder()
            .setCustomId('messageInput')
            .setLabel("Your Message")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Type your reply here...')
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(messageInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId.startsWith('customreply_modal_')) {
        const userId = interaction.customId.split('_')[2];
        const message = interaction.fields.getTextInputValue('messageInput');
        const user = await client.users.fetch(userId);

        try {
            await user.send(`**Response from Staff:**\n${message}`);
            await interaction.reply({ content: `Custom reply sent to ${user.tag}`, ephemeral: true });
        } catch (error) {
            console.error('Error sending DM:', error);
            await interaction.reply({ content: 'Failed to send message. The user might have DMs blocked.', ephemeral: true });
        }
    }
});

// Handle new member joining
client.on('guildMemberAdd', async member => {
    try {
        const welcomeChannel = await member.guild.channels.fetch('1173715333438255184');
        if (welcomeChannel) {
            const welcomeEmbed = new EmbedBuilder()
                .setColor('#6C3483')
                .setTitle('<a:start:861476796800040970> WELCOME TO ET OFFICIALS <a:discordlive:792048185634979882>')
                .setDescription(`
<a:partypopper:859462570007199744> **Hey, ${member.user.username}!**

Welcome to the server! We are absolutely thrilled to have you join our community. 

Make sure to check out the rules and verify yourself to get access to the rest of the server. We hope you have an amazing time here!

<a:cutedancing:859462002396102676> **Enjoy your stay!**
                `)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                .setFooter({
                    text: `Member #${member.guild.memberCount}`,
                    iconURL: member.guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            await welcomeChannel.send({ embeds: [welcomeEmbed] });
        }

        // Second short welcome message in general chat
        const generalChannel = await member.guild.channels.fetch('1403980703523274753');
        if (generalChannel) {
            await generalChannel.send(`Welcome to **${member.guild.name}**, ${member}! <a:welcome:792286649412878347>`);
        }

        // Auto-role assignment
        const role = member.guild.roles.cache.get('791554291647119381');
        if (role) {
            await member.roles.add(role);
        } else {
            console.error('Role not found: 791554291647119381');
        }

        // INVITE TRACKER LOGIC
        try {
            const newInvites = await member.guild.invites.fetch();
            const oldInvites = invites.get(member.guild.id);

            // Find the invite that has an incremented use count
            const invite = newInvites.find(i => i.uses > oldInvites.get(i.code));

            // Update the cache
            invites.set(member.guild.id, new Collection(newInvites.map((invite) => [invite.code, invite.uses])));

            if (invite) {
                const inviter = invite.inviter;
                const logChannel = await member.guild.channels.fetch('1404858845460828324');

                if (logChannel) {
                    await logChannel.send(`${member} just joined. They were invited by **${inviter.tag}** who now has **${invite.uses} invites**!`);
                }
            } else {
                console.log('Could not find which invite was used (possibly a vanity URL or unknown).');
            }
        } catch (err) {
            console.error('Invite tracker error:', err);
        }
    } catch (error) {
        console.error('Error in guildMemberAdd:', error);
    }
});

// Load commands and handle Slash Commands
const fs = require('fs');
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));

// Import the activeGiveaways map from the giveaway command
let activeGiveawaysMap;

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);

    // Grab the map reference if it's the giveaway file
    if (command.data.name === 'giveaway' && command.activeGiveaways) {
        activeGiveawaysMap = command.activeGiveaways;
    }
}

// Handle slash commands
client.on('interactionCreate', async interaction => {
    // Handle Giveaway Join Button
    if (interaction.isButton() && interaction.customId === 'join_giveaway') {
        if (!activeGiveawaysMap) {
            // Fallback if map isn't loaded for some reason
            const giveawayCmd = client.commands.get('giveaway');
            if (giveawayCmd) activeGiveawaysMap = giveawayCmd.activeGiveaways;
        }

        const data = activeGiveawaysMap ? activeGiveawaysMap.get(interaction.message.id) : null;

        if (!data) {
            return interaction.reply({ content: '❌ This giveaway has ended or the data was lost.', ephemeral: true });
        }

        if (data.users.has(interaction.user.id)) {
            return interaction.reply({ content: '⚠️ You have already joined this giveaway!', ephemeral: true });
        }

        // Add user
        data.users.add(interaction.user.id);

        // Reply
        return interaction.reply({ content: '✅ **Entry Confirmed!** Good luck! 🍀', ephemeral: true });
    }

    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'There was an error executing this command!',
            ephemeral: true
        });
    }
});

client.login(process.env.TOKEN);
