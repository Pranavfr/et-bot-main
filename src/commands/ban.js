const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a member from the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for banning')
                .setRequired(false))
        .addNumberOption(option =>
            option.setName('days')
                .setDescription('Number of days of messages to delete')
                .setRequired(false)
                .addChoices(
                    { name: 'None', value: 0 },
                    { name: '1 day', value: 1 },
                    { name: '7 days', value: 7 }
                )),

    async execute(interaction) {
        const target = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const days = interaction.options.getNumber('days') || 0;

        if (!target.bannable) {
            return interaction.reply({
                content: 'I cannot ban this user! They may have higher permissions than me.',
                ephemeral: true
            });
        }

        // Create ban embed for the channel
        const banEmbed = new EmbedBuilder()
            .setTitle('🔨 Member Banned')
            .setColor('#800080')
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Banned User', value: `${target.user.tag}`, inline: true },
                { name: 'Banned By', value: `${interaction.user.tag}`, inline: true },
                { name: 'Reason', value: reason },
                { name: 'Messages Deleted', value: `${days} days`, inline: true }
            )
            .setTimestamp()
            .setFooter({
                text: `${interaction.guild.name} • Moderation`,
                iconURL: interaction.guild.iconURL({ dynamic: true })
            });

        // Create DM embed for the banned user
        const dmEmbed = new EmbedBuilder()
            .setTitle(`You have been banned from ${interaction.guild.name}`)
            .setColor('#800080')
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .addFields(
                { name: 'Reason', value: reason },
                { name: 'Banned By', value: interaction.user.tag }
            )
            .setTimestamp()
            .setFooter({
                text: 'This is a permanent ban',
                iconURL: interaction.guild.iconURL({ dynamic: true })
            });

        try {
            // Try to send DM before banning
            await target.send({ embeds: [dmEmbed] });
        } catch (error) {
            console.error('Could not send DM to the user');
        }

        // Ban the user
        await target.ban({ deleteMessageDays: days, reason: reason });

        // Send the ban message to the channel
        const banMsg = await interaction.channel.send({ embeds: [banEmbed] });
        
        // Reply with a temporary success message
        await interaction.reply({ 
            content: 'Member banned successfully!', 
            ephemeral: true 
        });

        // Delete the command interaction after 1 second
        setTimeout(async () => {
            try {
                if (interaction.deletable) {
                    await interaction.deleteReply();
                }
            } catch (error) {
                console.error('Error deleting command message:', error);
            }
        }, 1000);
    },
};
