const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a member')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers) // Changed to KickMembers for broader compatibility
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the warning')
                .setRequired(true)),

    async execute(interaction) {
        // Check if user has permission
        if (!interaction.member.permissions.has('KickMembers')) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                flags: ['Ephemeral']
            });
        }

        const target = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason');

        // Check if target is valid
        if (!target) {
            return interaction.reply({
                content: 'Could not find that user.',
                flags: ['Ephemeral']
            });
        }

        // Check if trying to warn someone with higher role
        if (target.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({
                content: 'You cannot warn a member with equal or higher role than you.',
                flags: ['Ephemeral']
            });
        }

        // Create warning embed for the channel
        const warnEmbed = new EmbedBuilder()
            .setTitle('⚠️ Warning Issued')
            .setColor('#800080')
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Warned User', value: `${target.user.tag}`, inline: true },
                { name: 'Warned By', value: `${interaction.user.tag}`, inline: true },
                { name: 'Reason', value: reason }
            )
            .setTimestamp()
            .setFooter({
                text: `${interaction.guild.name} • Moderation`,
                iconURL: interaction.guild.iconURL({ dynamic: true })
            });

        // Create DM embed for the warned user
        const dmEmbed = new EmbedBuilder()
            .setTitle(`⚠️ You have been warned in ${interaction.guild.name}`)
            .setColor('#800080')
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .addFields(
                { name: 'Reason', value: reason },
                { name: 'Warned By', value: interaction.user.tag }
            )
            .setTimestamp()
            .setFooter({
                text: 'Please make sure to follow our server rules',
                iconURL: interaction.guild.iconURL({ dynamic: true })
            });

        try {
            // Send DM to the warned user
            await target.send({ embeds: [dmEmbed] });
        } catch (error) {
            console.error('Could not send DM to the user');
        }

        // Send the warning message to the channel
        const warnMsg = await interaction.channel.send({ embeds: [warnEmbed] });
        
        // Reply with a temporary success message
        await interaction.reply({ 
            content: 'Warning issued successfully!', 
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
