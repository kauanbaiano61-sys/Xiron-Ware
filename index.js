const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    PermissionsBitField,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

const express = require('express');
const app = express();

// ===== SERVIDOR WEB (ANTI-SLEEP RENDER) =====
app.get('/', (req, res) => {
    res.send('Bot online!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor web rodando na porta ${PORT}`);
});

// ===== CLIENT DISCORD =====
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('clientReady', () => {
    console.log(`Bot online como ${client.user.tag}`);
});


// ===== PAINEL =====
client.on('messageCreate', async (message) => {
    if (message.content === '!ticket') {

        const embed = new EmbedBuilder()
            .setColor(0x8000FF)
            .setTitle('🎫 CENTRAL DE ATENDIMENTO')
            .setDescription('Selecione abaixo o tipo de atendimento que você precisa.')
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setFooter({ text: message.guild.name })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('suporte').setLabel('Suporte').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('duvida').setLabel('Dúvida').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('key').setLabel('Key').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('compra').setLabel('Compra').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('denuncia').setLabel('Denúncia').setStyle(ButtonStyle.Danger)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});


// ===== INTERAÇÕES =====
client.on('interactionCreate', async interaction => {

    if (interaction.isButton()) {

        const categorias = ['suporte', 'duvida', 'key', 'compra', 'denuncia'];

        if (categorias.includes(interaction.customId)) {

            await interaction.deferReply({ flags: 64 });

            const suporteRole = interaction.guild.roles.cache.find(r => r.name === "Suporte");
            const staffRole = interaction.guild.roles.cache.find(r => r.name === "Staff");

            const canal = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                    },
                    ...(suporteRole ? [{
                        id: suporteRole.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                    }] : []),
                    ...(staffRole ? [{
                        id: staffRole.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                    }] : [])
                ]
            });

            const embedTicket = new EmbedBuilder()
                .setColor(0x8000FF)
                .setTitle(`🎫 Ticket - ${interaction.customId.toUpperCase()}`)
                .setDescription(`Olá ${interaction.user}, explique seu problema.\nAguarde um membro da equipe.`)
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .setTimestamp();

            const rowTicket = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('reivindicar')
                    .setLabel('Reivindicar')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('fechar')
                    .setLabel('Fechar Ticket')
                    .setStyle(ButtonStyle.Danger)
            );

            await canal.send({ embeds: [embedTicket], components: [rowTicket] });

            await interaction.editReply({ content: `✅ Seu ticket foi criado: ${canal}` });
        }

        if (interaction.customId === 'reivindicar') {
            await interaction.reply({ content: `📌 Ticket reivindicado por ${interaction.user}` });
        }

        if (interaction.customId === 'fechar') {

            const modal = new ModalBuilder()
                .setCustomId('modal_fechar')
                .setTitle('Fechar Ticket');

            const motivoInput = new TextInputBuilder()
                .setCustomId('motivo')
                .setLabel('Motivo do fechamento')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const row = new ActionRowBuilder().addComponents(motivoInput);
            modal.addComponents(row);

            await interaction.showModal(modal);
        }
    }

    if (interaction.isModalSubmit()) {

        if (interaction.customId === 'modal_fechar') {

            const motivo = interaction.fields.getTextInputValue('motivo');

            const embedFechamento = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🔒 Ticket Fechado')
                .setDescription(`Fechado por: ${interaction.user}\nMotivo: ${motivo}`)
                .setTimestamp();

            await interaction.reply({ embeds: [embedFechamento] });

            setTimeout(() => {
                interaction.channel.delete().catch(() => {});
            }, 5000);
        }
    }

});

// LOGIN SEGURO
client.login(process.env.TOKEN);
