import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } from 'discord.js';
import { Event } from '../structures/Event';
export default class InteractionCreateEvent extends Event {
    constructor(client) {
        super(client, { name: Events.InteractionCreate });
    }
    async execute(interaction) {
        if (!interaction.isChatInputCommand())
            return;
        const command = this.client.commands.get(interaction.commandName);
        if (!command)
            return;
        const dmButtonsRow = new ActionRowBuilder().addComponents(new ButtonBuilder()
            .setLabel('Join Dotsimus Server')
            .setURL('https://discord.gg/XAFXecKFRG')
            .setStyle(ButtonStyle.Link), new ButtonBuilder()
            .setLabel('Get Dotsimus')
            .setURL('https://discord.com/oauth2/authorize?client_id=731190736996794420&permissions=17247366359&redirect_uri=https%3A%2F%2Fdotsimus.com&response_type=code&scope=bot%20identify%20applications.commands')
            .setStyle(ButtonStyle.Link));
        if (!interaction.guild)
            return interaction.reply({
                content: 'Oh snap! Commands are only available within servers. You can test commands freely on Dotsimus server.',
                ephemeral: true,
                // files: [ohSimusAsset],
                components: [dmButtonsRow]
            });
        const cooldown = this.client.cooldowns.get(interaction.user.id);
        if (cooldown && cooldown === interaction.commandName) {
            return interaction.reply({
                content: 'Oh snap! You have already used this action or command in the last 5 seconds.',
                ephemeral: true
                // files: [ohSimusAsset]
            });
        }
        this.client.cooldowns.set(interaction.user.id, interaction.commandName);
        setTimeout(() => this.client.cooldowns.delete(interaction.user.id), 5000);
        try {
            await command.execute(interaction);
        }
        catch (err) {
            // TODO: Handle
        }
        // try {
        //     if (interaction.isSelectMenu()) {
        //         client.commands.get(interaction.customId)?.execute(client, interaction);
        //         process.env.DEVELOPMENT !== 'true'
        //             ? collectCommandAnalytics(interaction.componentType, interaction.customId, interaction.values[0])
        //             : '';
        //     }
        //     !interaction.isButton()
        //         ? client.commands.get(interaction.commandName)?.execute(client, interaction, activeUsersCollection)
        //         : client.commands.get(interaction.customId)?.execute(client, interaction, activeUsersCollection);
        //     if (process.env.DEVELOPMENT !== 'true')
        //         !interaction.isButton()
        //             ? collectCommandAnalytics(
        //                   interaction.type,
        //                   interaction.commandName,
        //                   interaction.options?._subcommand
        //               )
        //             : collectCommandAnalytics(interaction.componentType, interaction.customId);
        // } catch (error) {
        //     console.error(error);
        // }
    }
}
