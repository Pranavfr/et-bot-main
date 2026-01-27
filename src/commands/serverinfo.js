const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Get information about the server'),

    async execute(interaction) {
        const guild = interaction.guild;
        const embed = {
            color: 0x800080,
            title: 'Server Information',
            thumbnail: {
                url: guild.iconURL({ dynamic: true })
            },
            fields: [
                {
                    name: 'Server Name',
                    value: guild.name,
                    inline: true
                },
                {
                    name: 'Total Members',
                    value: guild.memberCount.toString(),
                    inline: true
                },
                {
                    name: 'Created At',
                    value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
                    inline: true
                },
                {
                    name: 'Boost Level',
                    value: guild.premiumTier.toString(),
                    inline: true
                },
                {
                    name: 'Boost Count',
                    value: guild.premiumSubscriptionCount.toString(),
                    inline: true
                },
                {
                    name: 'Channels',
                    value: guild.channels.cache.size.toString(),
                    inline: true
                },
                {
                    name: 'Roles',
                    value: guild.roles.cache.size.toString(),
                    inline: true
                }
            ],
            timestamp: new Date()
        };

        await interaction.reply({ embeds: [embed] });
    },
};
