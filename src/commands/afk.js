const { SlashCommandBuilder } = require('discord.js');

// Global Map to store AFK users
// Key: UserId, Value: { reason: String, timestamp: Number, displayName: String }
const afkUsers = new Map();

module.exports = {
    // Export for index.js
    afkUsers,

    data: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Set your status to AFK')
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Why are you going away?')
                .setRequired(false)),

    async execute(interaction) {
        const reason = interaction.options.getString('reason') || 'I went to touch grass 🌱';

        afkUsers.set(interaction.user.id, {
            reason: reason,
            timestamp: Date.now(),
            displayName: interaction.member.displayName
        });

        // Reply with a "cool" message
        await interaction.reply({
            content: `💤 **Have a good rest!** I've set your status to AFK: **${reason}**`,
            ephemeral: true
        });

        // Optional: Try to change nickname (Might fail due to permissions, so we catch error)
        try {
            if (interaction.member.manageable && !interaction.member.displayName.startsWith('[AFK]')) {
                await interaction.member.setNickname(`[AFK] ${interaction.member.displayName}`);
            }
        } catch (e) {
            console.log(`Could not change nickname for ${interaction.user.tag}`);
        }
    },
};
