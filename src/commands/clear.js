const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear messages from the channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addNumberOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to clear (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)),

    async execute(interaction) {
        const amount = interaction.options.getNumber('amount');

        await interaction.channel.bulkDelete(amount, true);
        await interaction.reply({
            content: `Successfully deleted ${amount} messages.`,
            ephemeral: true
        });
    },
};
