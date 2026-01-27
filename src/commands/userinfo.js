const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Get information about a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to get info about')
                .setRequired(false)),

    async execute(interaction) {
        const target = interaction.options.getUser('target') || interaction.user;
        const member = interaction.guild.members.cache.get(target.id);

        const embed = {
            color: 0x800080,
            title: 'User Information',
            thumbnail: {
                url: target.displayAvatarURL({ dynamic: true })
            },
            fields: [
                {
                    name: 'Username',
                    value: target.tag,
                    inline: true
                },
                {
                    name: 'ID',
                    value: target.id,
                    inline: true
                },
                {
                    name: 'Account Created',
                    value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`,
                    inline: true
                },
                {
                    name: 'Server Join Date',
                    value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Not in server',
                    inline: true
                },
                {
                    name: 'Roles',
                    value: member ? member.roles.cache.map(r => r).join(', ') : 'No roles',
                    inline: false
                }
            ],
            timestamp: new Date()
        };

        await interaction.reply({ embeds: [embed] });
    },
};
