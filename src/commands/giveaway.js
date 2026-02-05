const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const path = require('path');

// Global Map to store giveaway data in memory (Not persistent across restarts)
// Key: MessageID, Value: { users: Set<UserId>, winners: Number, prize: String, host: UserId, endTime: Number }
const activeGiveaways = new Map();

module.exports = {
    // Exporting the map so index.js can access it for button clicks
    activeGiveaways,

    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Start a premium giveaway')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
        .addStringOption(option =>
            option.setName('prize')
                .setDescription('What is the prize?')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration (e.g., 10m, 1h, 24h)')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('winners')
                .setDescription('Number of winners (Default: 1)')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('required_invites')
                .setDescription('Minimum invites required to join (Default: 0)')
                .setRequired(false)),

    async execute(interaction) {
        const prize = interaction.options.getString('prize');
        const durationStr = interaction.options.getString('duration');
        const winnerCount = interaction.options.getInteger('winners') || 1;
        const requiredInvites = interaction.options.getInteger('required_invites') || 0;

        // Parse Duration
        const ms = parseDuration(durationStr);
        if (!ms) {
            return interaction.reply({ content: '❌ Invalid duration format! Use `m` for minutes, `h` for hours (e.g., `10m`, `2h`).', ephemeral: true });
        }

        const endTime = Date.now() + ms;
        const bannerImage = new AttachmentBuilder('./assets/giveaway_banner.png', { name: 'giveaway_banner.png' });

        // Create Embed (Big Style)
        const embed = new EmbedBuilder()
            .setColor('#FFD700') // Gold color
            .setTitle('<a:partypopper:859462570007199744>  **GIVEAWAY**  <a:partypopper:859462570007199744>')
            .setDescription(`
**Prize:** <a:discordlive:792048185634979882> **${prize}** <a:discordlive:792048185634979882>
**Hosted By:** ${interaction.user}
**Winners:** ${winnerCount}
**Ends In:** <t:${Math.floor(endTime / 1000)}:R>
${requiredInvites > 0 ? `**Requirement:** ${requiredInvites} Invites` : ''}

**Join by clicking the button below!**
            `)
            .setImage('attachment://giveaway_banner.png') // Big Banner at Bottom
            // .setThumbnail(interaction.guild.iconURL()) // REMOVED SERVER LOGO
            .setFooter({ text: 'ET OFFICIALS GIVEAWAY', iconURL: interaction.guild.iconURL() })
            .setTimestamp(endTime);

        // Create Button
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('join_giveaway')
                    .setLabel('🎉 Join Giveaway')
                    .setStyle(ButtonStyle.Primary)
            );

        // Send Message cleanly (not as a reply to the command)
        await interaction.reply({ content: '✅ Giveaway started!', ephemeral: true });

        const message = await interaction.channel.send({
            content: `# 🎉 **GIVEAWAY: ${prize}** 🎉`,
            embeds: [embed],
            components: [row],
            files: [bannerImage]
        });

        // Store Giveaway Data
        activeGiveaways.set(message.id, {
            users: new Set(),
            winners: winnerCount,
            prize: prize,
            host: interaction.user.id,
            endTime: endTime,
            requiredInvites: requiredInvites
        });

        // Start Timer to End Giveaway
        setTimeout(async () => {
            const data = activeGiveaways.get(message.id);
            if (!data) return; // Already ended

            const users = Array.from(data.users);

            // Disable Button
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('join_giveaway')
                        .setLabel('Giveaway Ended')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );

            if (users.length === 0) {
                const endedEmbed = EmbedBuilder.from(embed)
                    .setColor('#2C2F33')
                    .setDescription(`**Prize:** ${prize}\n**Winner:** No one joined 😢\n**Hosted By:** <@${data.host}>`);

                await message.edit({ embeds: [endedEmbed], components: [disabledRow] });
                activeGiveaways.delete(message.id);
                return;
            }

            // Pick Winners
            const winners = [];
            for (let i = 0; i < winnerCount && users.length > 0; i++) {
                const index = Math.floor(Math.random() * users.length);
                winners.push(users.splice(index, 1)[0]);
            }

            const winnerMentions = winners.map(id => `<@${id}>`).join(', ');

            const endedEmbed = EmbedBuilder.from(embed)
                .setColor('#000000') // Black/Dark for ended
                .setDescription(`
**Prize:** ${prize}
**Winners:** ${winnerMentions}
**Hosted By:** <@${data.host}>
**Ended:** <t:${Math.floor(Date.now() / 1000)}:R>
                `);

            await message.edit({ embeds: [endedEmbed], components: [disabledRow] });

            // Announce in channel
            await message.channel.send(`<a:partypopper:859462570007199744> **CONGRATULATIONS** ${winnerMentions}! You won **${prize}**! 🏆`);

            // Cleanup
            activeGiveaways.delete(message.id);

        }, ms);
    },
};

// Helper function
function parseDuration(str) {
    const match = str.match(/^(\d+)([mh])$/);
    if (!match) return null;
    const value = parseInt(match[1]);
    const unit = match[2];
    if (unit === 'm') return value * 60 * 1000;
    if (unit === 'h') return value * 60 * 60 * 1000;
    return null;
}
