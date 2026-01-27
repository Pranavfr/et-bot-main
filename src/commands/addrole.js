const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addrole')
        .setDescription('Give a role to a specific user or everyone.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to give')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to give the role to (Optional)'))
        .addBooleanOption(option =>
            option.setName('everyone')
                .setDescription('Give this role to EVERYONE? (Cannot be undone easily)')),

    async execute(interaction) {
        const role = interaction.options.getRole('role');
        const target = interaction.options.getMember('target');
        const everyone = interaction.options.getBoolean('everyone');

        // Safety check: Cannot execute if neither target nor everyone is selected
        if (!target && !everyone) {
            return interaction.reply({
                content: '❌ Please specify either a **target user** OR select **everyone: True**.',
                ephemeral: true
            });
        }

        // Safety check: Bot position
        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({
                content: "❌ I cannot assign this role because it is higher than or equal to my highest role.",
                ephemeral: true
            });
        }

        // Scenario 1: Single Target
        if (target) {
            if (target.roles.cache.has(role.id)) {
                return interaction.reply({
                    content: `⚠️ ${target} already has the **${role.name}** role.`,
                    ephemeral: true
                });
            }

            try {
                await target.roles.add(role);
                return interaction.reply({
                    content: `✅ Successfully gave **${role.name}** to ${target}.`,
                    ephemeral: true
                });
            } catch (error) {
                console.error(error);
                return interaction.reply({
                    content: `❌ Failed to give role. Check my permissions.`,
                    ephemeral: true
                });
            }
        }

        // Scenario 2: Everyone
        if (everyone) {
            await interaction.reply({
                content: `🔄 Processing **Everyone**... This may take a while depending on server size.`,
                ephemeral: true
            });

            try {
                // Fetch all members to ensure cache is full
                const members = await interaction.guild.members.fetch();
                let count = 0;
                let ignored = 0;

                for (const [id, member] of members) {
                    if (member.user.bot) continue; // Skip bots (optional, usually good practice)

                    if (!member.roles.cache.has(role.id)) {
                        try {
                            await member.roles.add(role);
                            count++;
                        } catch (e) {
                            console.error(`Failed to add role to ${member.user.tag}`);
                        }
                    } else {
                        ignored++;
                    }
                }

                await interaction.editReply({
                    content: `✅ **Operation Complete!**\n\nAssigned **${role.name}** to: \`${count}\` members.\nSkipped (already had role): \`${ignored}\` members.`
                });

            } catch (error) {
                console.error(error);
                await interaction.editReply({
                    content: `❌ An error occurred while assigning roles.`
                });
            }
        }
    },
};
