const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Send an announcement embed')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addStringOption(option =>
            option.setName('title')
                .setDescription('The title of the announcement')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('The content of the announcement')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('image')
                .setDescription('Add an image URL to the announcement')
                .setRequired(false)),

    async execute(interaction) {
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const imageUrl = interaction.options.getString('image');
        const color = '#6C3483'; // Permanent purple color for ET OFFICIALS

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setTimestamp()
            // Add server icon as thumbnail
            .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 256 }))
            // Add footer with author and role
            .setFooter({
                text: `${interaction.member.displayName}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            });

        // Add image if provided
        if (imageUrl) {
            embed.setImage(imageUrl);
        }

        // Add server name at the top
        embed.setAuthor({
            name: interaction.guild.name,
            iconURL: interaction.guild.iconURL({ dynamic: true })
        });

        // Send the announcement and store the message for future reference
        const announcement = await interaction.channel.send({ embeds: [embed] });
        
        // Reply with a temporary success message
        await interaction.reply({ 
            content: 'Announcement sent successfully!', 
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
