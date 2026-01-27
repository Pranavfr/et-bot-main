const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member from the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for kicking')
                .setRequired(false)),

    async execute(interaction) {
        const target = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!target.kickable) {
            return interaction.reply({
                content: 'I cannot kick this user! They may have higher permissions than me.',
                ephemeral: true
            });
        }

        // Create kick embed for the channel
        const kickEmbed = new EmbedBuilder()
            .setTitle('👢 Member Kicked')
            .setColor('#800080')
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Kicked User', value: `${target.user.tag}`, inline: true },
                { name: 'Kicked By', value: `${interaction.user.tag}`, inline: true },
                { name: 'Reason', value: reason }
            )
            .setTimestamp()
            .setFooter({
                text: `${interaction.guild.name} • Moderation`,
                iconURL: interaction.guild.iconURL({ dynamic: true })
            });

        // Create DM embed for the kicked user
        const dmEmbed = new EmbedBuilder()
            .setTitle(`You have been kicked from ${interaction.guild.name}`)
            .setColor('#800080')
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .addFields(
                { name: 'Reason', value: reason },
                { name: 'Kicked By', value: interaction.user.tag }
            )
            .setTimestamp()
            .setFooter({
                text: 'You can rejoin the server with a new invite link',
                iconURL: interaction.guild.iconURL({ dynamic: true })
            });

        try {
            // Try to send DM before kicking
            await target.send({ embeds: [dmEmbed] });
        } catch (error) {
            console.error('Could not send DM to the user');
        }

        // Kick the user
        await target.kick(reason);

        // Send the kick message to the channel
        const kickMsg = await interaction.channel.send({ embeds: [kickEmbed] });
        
        // Reply with a temporary success message
        await interaction.reply({ 
            content: 'Member kicked successfully!', 
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
