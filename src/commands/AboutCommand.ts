import Topgg from '@top-gg/sdk';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder,
    time,
    TimestampStyles
} from 'discord.js';

import { isProd } from '../constants';
import { Command } from '../structures/Command';
import { DotsimusClient } from '../structures/DotsimusClient';

export default class AboutCommand extends Command {
    constructor(client: DotsimusClient) {
        super(client, {
            name: 'about',
            description: 'Find out more about Dotsimus.',
            options: new SlashCommandBuilder()
                .addSubcommand((subcommand) =>
                    subcommand.setName('me').setDescription('Shows general information about bot and its commands.')
                )
                .addSubcommand((subcommand) =>
                    subcommand.setName('uptime').setDescription('Shows how long bot stayed up since the last restart.')
                )
                .addSubcommand((subcommand) => subcommand.setName('ping').setDescription('Shows bots latency.'))
                .addSubcommand((subcommand) =>
                    subcommand.setName('restart').setDescription('⚠️ [Owner command] Restarts the bot.')
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('usage')
                        .setDescription('Shows how many times commands were used and when they were used last.')
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('submit-a-review')
                        .setDescription('Explains the importance of reviews and guides on where to submit one.')
                )
        });
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<any> {
        switch (interaction.options.getSubcommand()) {
            case 'me':
                await this.executeMe(interaction);
                break;
            case 'uptime':
                await this.executeUptime(interaction);
                break;
            case 'ping':
                await this.executePing(interaction);
                break;
            case 'restart':
                await this.executeRestart(interaction);
                break;
            case 'usage':
                // TODO: Implement
                break;
            case 'submit-a-review':
                await this.executeSubmitReview(interaction);
                break;
        }
    }

    async executeMe(interaction: ChatInputCommandInteraction) {
        const guilds = this.client.guilds.cache;

        const totalMemberCount = guilds.map((g) => g.memberCount).reduce((a, b) => a + b);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setLabel('Invite Dotsimus')
                .setURL(
                    'https://discord.com/oauth2/authorize?client_id=731190736996794420&permissions=17247366359&redirect_uri=https%3A%2F%2Fdotsimus.com&response_type=code&scope=bot%20identify%20applications.commands'
                )
                .setStyle(ButtonStyle.Link),
            new ButtonBuilder()
                .setLabel('Join Support')
                .setURL('https://discord.gg/XAFXecKFRG')
                .setStyle(ButtonStyle.Link)
        );

        const embed = new EmbedBuilder({ color: 0xffbd2e })
            .setTitle('About Dotsimus')
            .setDescription(
                `Dotsimus is a machine learning powered chat moderation bot, its primary goal is to help monitor, protect the server while its secondary goal is to enhance user experience.`
            )
            .addFields(
                { name: 'Servers', value: guilds.size.toLocaleString(), inline: true },
                {
                    name: 'Users',
                    value: totalMemberCount.toLocaleString(),
                    inline: true
                },
                {
                    name: 'Commands',
                    value: 'You can see a list of available commands and their use by typing `/` in the chat.'
                }
            )
            .setURL('https://dotsimus.com/');

        if (isProd) {
            this.client.topgg.postStats({ serverCount: guilds.size });
        }

        return interaction.reply({ embeds: [embed], components: [row] });
    }

    async executeUptime(interaction: ChatInputCommandInteraction): Promise<any> {
        const startupTimestamp = Math.round((Date.now() - this.client.uptime) / 1000);
        const timestamp = time(startupTimestamp, TimestampStyles.RelativeTime);

        return interaction.reply(`Bot restarted ${timestamp}.`);
    }

    async executePing(interaction: ChatInputCommandInteraction): Promise<any> {
        const sent = await interaction.deferReply({ fetchReply: true });
        const rtl = sent.createdTimestamp - interaction.createdTimestamp;

        return interaction.editReply(`Websocket heartbeat: \`${this.client.ws.ping}ms\`\nRoundtrip latency: \`${rtl}ms\``);
    }

    async executeRestart(interaction: ChatInputCommandInteraction): Promise<any> {
        const application = await this.client.application.fetch();

        if (interaction.user.id === application.owner?.id) {
            await interaction.reply('Restarting..');
            process.exit(0);
        } else {
            return interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
        }
    }

    async executeSubmitReview(interaction: ChatInputCommandInteraction): Promise<any> {
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setLabel('Submit a review')
                .setURL('https://top.gg/bot/731190736996794420#reviews')
                .setStyle(ButtonStyle.Link),
            new ButtonBuilder()
                .setLabel('Join Support')
                .setURL('https://discord.gg/XAFXecKFRG')
                .setStyle(ButtonStyle.Link)
        );

        return interaction.reply({
            content: `Reviews significantly help to amplify the voice of the users and help to find focus areas for further Dotsimus development, if you\'d like to leave some feedback please do so on [top.gg](https://top.gg/bot/731190736996794420#reviews). It\'s highly appreciated!`,
            components: [row],
            ephemeral: true
        });
    }
}
