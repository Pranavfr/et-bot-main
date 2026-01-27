const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invites')
        .setDescription('Check how many active invites a user has.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check (defaults to you)')),

    async execute(interaction) {
        const target = interaction.options.getUser('user') || interaction.user;
        const guild = interaction.guild;

        await interaction.deferReply();

        try {
            const invites = await guild.invites.fetch();
            const userInvites = invites.filter(invite => invite.inviter && invite.inviter.id === target.id);

            let totalUses = 0;
            userInvites.forEach(invite => totalUses += invite.uses);

            await interaction.editReply({
                content: `✉️ **${target.username}** has **${totalUses}** active invites.`
            });

        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content: '❌ failed to fetch invites. I might need "Manage Server" permissions.'
            });
        }
    },
};
