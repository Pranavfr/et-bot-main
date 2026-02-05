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
                .setRequired(false)),

    async execute(interaction) {
        const prize = interaction.options.getString('prize');
        const durationStr = interaction.options.getString('duration');
        const winnerCount = interaction.options.getInteger('winners') || 1;

        // Parse Duration
        const ms = parseDuration(durationStr);
        if (!ms) {
            return interaction.reply({ content: '❌ Invalid duration format! Use `m` for minutes, `h` for hours (e.g., `10m`, `2h`).', ephemeral: true });
        }

        const endTime = Date.now() + ms;
        const footerImage = new AttachmentBuilder('./assets/giveaway_footer.jpg', { name: 'giveaway_footer.jpg' });

        // Create Embed
        const embed = new EmbedBuilder()
            .setColor('#FFD700') // Gold color
            .setTitle('<a:partypopper:859462570007199744>  **PREMIUM GIVEAWAY**  <a:partypopper:859462570007199744>')
            .setDescription(`
**Prize:** ${prize}
**Hosted By:** ${interaction.user}
**Winners:** ${winnerCount}
**Ends In:** <t:${Math.floor(endTime / 1000)}:R>

**Join by clicking the button below!**
            `)
            .setImage('https://media.discordapp.net/attachments/1173715333438255184/1173715566675120158/standard_3.gif?ex=65e18f2b&is=65cf1a2b&hm=6a8a2d8a5763566160867056066266050505161066060') // Decorative spacer (optional, can remove if link breaks)
            .setThumbnail(interaction.guild.iconURL())
            .setFooter({ text: 'ET OFFICIALS GIVEAWAY', iconURL: 'attachment://giveaway_footer.jpg' })
            .setTimestamp(endTime);

        // Create Button
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('join_giveaway')
                    .setLabel('🎉 Join Giveaway')
                    .setStyle(ButtonStyle.Primary)
            );

        // Send Message
        const message = await interaction.reply({
            embeds: [embed],
            components: [row],
            files: [footerImage],
            fetchReply: true
        });

        // Store Giveaway Data
        activeGiveaways.set(message.id, {
            users: new Set(),
            winners: winnerCount,
            prize: prize,
            host: interaction.user.id,
            endTime: endTime
        });

        // Start Timer to End Giveaway
        setTimeout(async () => {
            const data = activeGiveaways.get(message.id);
            if (!data) return; // Already ended or corrupted

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

            const winner mentions = winners.map(id => `<@${id}>`).join(', ');

            const endedEmbed = EmbedBuilder.from(embed)
                .setColor('#000000') // Black/Dark for ended
                .setDescription(`
**Prize:** ${prize}
**Winners:** ${mentions}
**Hosted By:** <@${data.host}>
**Ended:** <t:${Math.floor(Date.now() / 1000)}:R>
                `);

            await message.edit({ embeds: [endedEmbed], components: [disabledRow] });

            // Announce in channel
            await message.channel.send(`🎉 **CONGRATULATIONS** ${mentions}! You won **${prize}**! 🏆`);

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
