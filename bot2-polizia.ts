import { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { storage } from '../storage';
import { registerCommands, createErrorEmbed, createSuccessEmbed } from './shared/utils';

const BOT2_TOKEN = process.env.BOT2_TOKEN || process.env.DISCORD_BOT2_TOKEN || "";

export class PoliceBot {
  private client: Client;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
      ]
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.once('ready', async () => {
      console.log(`👮‍♂️ Bot Polizia/Admin connesso come ${this.client.user?.tag}`);
      await this.registerSlashCommands();
    });

    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      try {
        await this.handleCommand(interaction);
      } catch (error) {
        console.error('Errore nel comando:', error);
        const errorEmbed = createErrorEmbed('Si è verificato un errore durante l\'esecuzione del comando.');
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    });
  }

  private async registerSlashCommands() {
    const commands = [
      // Police commands
      new SlashCommandBuilder()
        .setName('multa')
        .setDescription('Multa un cittadino per una trasgressione')
        .addUserOption(option =>
          option.setName('cittadino')
            .setDescription('Il cittadino da multare')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('motivo')
            .setDescription('Il motivo della multa')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('importo')
            .setDescription('L\'importo della multa in euro')
            .setRequired(true)),

      new SlashCommandBuilder()
        .setName('arresto')
        .setDescription('Arresta un cittadino e sporca la fedina')
        .addUserOption(option =>
          option.setName('cittadino')
            .setDescription('Il cittadino da arrestare')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('motivo')
            .setDescription('Il motivo dell\'arresto')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('pena')
            .setDescription('La pena da scontare')
            .setRequired(true))
        .addAttachmentOption(option =>
          option.setName('foto-segnaletica')
            .setDescription('Foto segnaletica del sospetto')),

      new SlashCommandBuilder()
        .setName('pulisci-fedina')
        .setDescription('Pulisce la fedina penale di un cittadino')
        .addUserOption(option =>
          option.setName('cittadino')
            .setDescription('Il cittadino di cui pulire la fedina')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('motivo')
            .setDescription('Il motivo della pulizia della fedina')
            .setRequired(true)),

      new SlashCommandBuilder()
        .setName('sequestro')
        .setDescription('Formalizza il sequestro di un veicolo')
        .addUserOption(option =>
          option.setName('cittadino')
            .setDescription('Il proprietario del veicolo')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('targa')
            .setDescription('La targa del veicolo da sequestrare')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('motivo')
            .setDescription('Il motivo del sequestro')
            .setRequired(true))
        .addAttachmentOption(option =>
          option.setName('foto-veicolo')
            .setDescription('Foto del veicolo sequestrato')),

      new SlashCommandBuilder()
        .setName('disequestro')
        .setDescription('Segnala il dissequestro di un veicolo')
        .addStringOption(option =>
          option.setName('targa')
            .setDescription('La targa del veicolo da liberare')
            .setRequired(true)),

      new SlashCommandBuilder()
        .setName('cerca-veicolo')
        .setDescription('Cerca informazioni su un veicolo tramite targa')
        .addStringOption(option =>
          option.setName('targa')
            .setDescription('La targa del veicolo da cercare')
            .setRequired(true)),

      // Admin commands
      new SlashCommandBuilder()
        .setName('impostazioni')
        .setDescription('Configura i ruoli designati per automatizzare i comandi')
        .addRoleOption(option =>
          option.setName('ruolo-polizia')
            .setDescription('Ruolo per i poliziotti'))
        .addRoleOption(option =>
          option.setName('ruolo-admin')
            .setDescription('Ruolo per gli amministratori')),

      new SlashCommandBuilder()
        .setName('impostazioni-rapina')
        .setDescription('Abilita/disabilita le rapine')
        .addStringOption(option =>
          option.setName('stato')
            .setDescription('Stato delle rapine')
            .setRequired(true)
            .addChoices(
              { name: 'Abilita', value: 'abilita' },
              { name: 'Disabilita', value: 'disabilita' }
            ))
        .addStringOption(option =>
          option.setName('rapina')
            .setDescription('Tipo di rapina')
            .setRequired(true)),

      new SlashCommandBuilder()
        .setName('roleplay')
        .setDescription('Aggiorna lo stato del server roleplay')
        .addStringOption(option =>
          option.setName('stato')
            .setDescription('Stato del roleplay')
            .setRequired(true)
            .addChoices(
              { name: 'Attiva', value: 'on' },
              { name: 'Disattiva', value: 'off' }
            )),

      new SlashCommandBuilder()
        .setName('say')
        .setDescription('Il bot scrive al posto tuo')
        .addStringOption(option =>
          option.setName('testo')
            .setDescription('Il messaggio da inviare')
            .setRequired(true)),

      new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Elimina un numero preciso di messaggi')
        .addIntegerOption(option =>
          option.setName('numero')
            .setDescription('Numero di messaggi da eliminare')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100)),

      new SlashCommandBuilder()
        .setName('reset-documenti')
        .setDescription('Resetta il database dei documenti')
        .addStringOption(option =>
          option.setName('tipo')
            .setDescription('Tipo di reset')
            .setRequired(true)
            .addChoices(
              { name: 'Totale', value: 'totale' },
              { name: 'Utente', value: 'utente' }
            ))
        .addUserOption(option =>
          option.setName('cittadino')
            .setDescription('Il cittadino specifico (se tipo = utente)')),

      new SlashCommandBuilder()
        .setName('reset-database-veicoli')
        .setDescription('Resetta il database dei veicoli')
        .addStringOption(option =>
          option.setName('tipo')
            .setDescription('Tipo di reset')
            .setRequired(true)
            .addChoices(
              { name: 'Totale', value: 'totale' },
              { name: 'Utente', value: 'utente' }
            ))
        .addUserOption(option =>
          option.setName('cittadino')
            .setDescription('Il cittadino specifico (se tipo = utente)')),

      new SlashCommandBuilder()
        .setName('sondaggio-rp')
        .setDescription('Crea un sondaggio per il roleplay')
        .addStringOption(option =>
          option.setName('domanda')
            .setDescription('La domanda del sondaggio')
            .setRequired(true)),

      new SlashCommandBuilder()
        .setName('annuncio')
        .setDescription('Crea un annuncio personalizzato')
        .addStringOption(option =>
          option.setName('titolo')
            .setDescription('Il titolo dell\'annuncio')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('testo')
            .setDescription('Il contenuto dell\'annuncio')
            .setRequired(true))
        .addRoleOption(option =>
          option.setName('ruolo-da-taggare')
            .setDescription('Il ruolo da menzionare nell\'annuncio')),

      new SlashCommandBuilder()
        .setName('set-ruolo')
        .setDescription('Cambia il ruolo di un utente (solo super admin)')
        .addUserOption(option =>
          option.setName('utente')
            .setDescription('L\'utente di cui cambiare il ruolo')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('ruolo')
            .setDescription('Il nuovo ruolo da assegnare')
            .setRequired(true)
            .addChoices(
              { name: 'Cittadino', value: 'cittadino' },
              { name: 'Poliziotto', value: 'poliziotto' },
              { name: 'Medico', value: 'medico' },
              { name: 'Pompiere', value: 'pompiere' },
              { name: 'Meccanico', value: 'meccanico' },
              { name: 'Amministratore', value: 'amministratore' },
              { name: 'Super Admin', value: 'super_admin' }
            ))
    ];

    await registerCommands(this.client, commands, BOT2_TOKEN);
  }

  private async handleCommand(interaction: any) {
    const { commandName, user } = interaction;

    // Get or create user
    let dbUser = await storage.getUserByDiscordId(user.id);
    if (!dbUser) {
      // Create user with default values
      dbUser = await storage.createUser({
        discordId: user.id,
        username: user.username,
        nickname: user.displayName || null,
        role: 'cittadino',
        isOnDuty: false,
        criminalRecord: {
          arrests: 0,
          fines: 0,
          totalAmount: 0,
          charges: []
        }
      });
    }

    // Check permissions for police/admin commands
    const policeCommands = ['multa', 'arresto', 'pulisci-fedina', 'sequestro', 'disequestro', 'cerca-veicolo'];
    const adminCommands = ['impostazioni', 'impostazioni-rapina', 'roleplay', 'say', 'clear', 'reset-documenti', 'reset-database-veicoli', 'sondaggio-rp', 'annuncio'];
    const superAdminCommands = ['set-ruolo'];

    // For new users, show their current role and provide instructions
    if (policeCommands.includes(commandName) && !['poliziotto', 'amministratore', 'super_admin'].includes(dbUser.role)) {
      const errorEmbed = createErrorEmbed(`❌ **Permessi insufficienti**\n\n**Il tuo ruolo attuale:** ${dbUser.role}\n**Ruolo richiesto:** Poliziotto o superiore\n\n💡 **Come ottenere i permessi:**\n• Contatta un amministratore del server\n• Il tuo Discord ID: \`${user.id}\`\n• Username: \`${user.username}\``);
      return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    if (adminCommands.includes(commandName) && !['amministratore', 'super_admin'].includes(dbUser.role)) {
      const errorEmbed = createErrorEmbed(`❌ **Permessi insufficienti**\n\n**Il tuo ruolo attuale:** ${dbUser.role}\n**Ruolo richiesto:** Amministratore\n\n💡 **Come ottenere i permessi:**\n• Contatta un super-amministratore del server\n• Il tuo Discord ID: \`${user.id}\`\n• Username: \`${user.username}\``);
      return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    if (superAdminCommands.includes(commandName) && dbUser.role !== 'super_admin') {
      const errorEmbed = createErrorEmbed(`❌ **Permessi insufficienti**\n\n**Il tuo ruolo attuale:** ${dbUser.role}\n**Ruolo richiesto:** Super Admin\n\n💡 **Come ottenere i permessi:**\n• Solo i super-amministratori possono eseguire questo comando\n• Il tuo Discord ID: \`${user.id}\`\n• Username: \`${user.username}\``);
      return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    switch (commandName) {
      case 'multa':
        await this.handleMultaCommand(interaction, dbUser);
        break;
      case 'arresto':
        await this.handleArrestoCommand(interaction, dbUser);
        break;
      case 'pulisci-fedina':
        await this.handlePulisciFedinaCommand(interaction, dbUser);
        break;
      case 'sequestro':
        await this.handleSequestroCommand(interaction, dbUser);
        break;
      case 'disequestro':
        await this.handleDisequestroCommand(interaction, dbUser);
        break;
      case 'cerca-veicolo':
        await this.handleCercaVeicoloCommand(interaction, dbUser);
        break;
      case 'impostazioni':
        await this.handleImpostazioniCommand(interaction, dbUser);
        break;
      case 'roleplay':
        await this.handleRoleplayCommand(interaction, dbUser);
        break;
      case 'say':
        await this.handleSayCommand(interaction, dbUser);
        break;
      case 'clear':
        await this.handleClearCommand(interaction, dbUser);
        break;
      case 'sondaggio-rp':
        await this.handleSondaggioRpCommand(interaction, dbUser);
        break;
      case 'annuncio':
        await this.handleAnnuncioCommand(interaction, dbUser);
        break;
      case 'set-ruolo':
        await this.handleSetRuoloCommand(interaction, dbUser);
        break;
    }
  }

  private async handleMultaCommand(interaction: any, officer: any) {
    const cittadino = interaction.options.getUser('cittadino');
    const motivo = interaction.options.getString('motivo');
    const importo = interaction.options.getInteger('importo');

    const targetUser = await storage.getUserByDiscordId(cittadino.id);
    if (!targetUser) {
      const errorEmbed = createErrorEmbed('Utente non trovato nel database.');
      return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    const crime = await storage.createCrime({
      suspectId: targetUser.id,
      officerId: officer.id,
      type: 'altro',
      description: motivo,
      fine: importo
    });

    // Update criminal record
    const currentRecord = targetUser.criminalRecord || { arrests: 0, fines: 0, totalAmount: 0, charges: [] };
    const newRecord = {
      arrests: currentRecord.arrests,
      fines: currentRecord.fines + 1,
      totalAmount: currentRecord.totalAmount + importo,
      charges: [...currentRecord.charges, motivo]
    };

    await storage.updateUser(targetUser.id, { criminalRecord: newRecord });

    const embed = new EmbedBuilder()
      .setColor(0xf39c12)
      .setTitle('💸 MULTA EMESSA')
      .addFields(
        { name: 'Cittadino', value: targetUser.nickname || targetUser.username, inline: true },
        { name: 'Importo', value: `€${importo}`, inline: true },
        { name: 'Ufficiale', value: officer.nickname || officer.username, inline: true },
        { name: 'Motivo', value: motivo, inline: false }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }

  private async handleArrestoCommand(interaction: any, officer: any) {
    const cittadino = interaction.options.getUser('cittadino');
    const motivo = interaction.options.getString('motivo');
    const pena = interaction.options.getString('pena');
    const attachment = interaction.options.getAttachment('foto-segnaletica');

    const targetUser = await storage.getUserByDiscordId(cittadino.id);
    if (!targetUser) {
      const errorEmbed = createErrorEmbed('Utente non trovato nel database.');
      return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    const crime = await storage.createCrime({
      suspectId: targetUser.id,
      officerId: officer.id,
      type: 'altro',
      description: motivo,
      sentence: pena,
      mugshot: attachment?.url
    });

    // Update criminal record
    const currentRecord = targetUser.criminalRecord || { arrests: 0, fines: 0, totalAmount: 0, charges: [] };
    const newRecord = {
      arrests: currentRecord.arrests + 1,
      fines: currentRecord.fines,
      totalAmount: currentRecord.totalAmount,
      charges: [...currentRecord.charges, motivo]
    };

    await storage.updateUser(targetUser.id, { criminalRecord: newRecord });

    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle('🚔 ARRESTO EFFETTUATO')
      .addFields(
        { name: 'Sospetto', value: targetUser.nickname || targetUser.username, inline: true },
        { name: 'Pena', value: pena, inline: true },
        { name: 'Ufficiale', value: officer.nickname || officer.username, inline: true },
        { name: 'Motivo', value: motivo, inline: false }
      )
      .setTimestamp();

    if (attachment) {
      embed.setImage(attachment.url);
    }

    await interaction.reply({ embeds: [embed] });
  }

  private async handlePulisciFedinaCommand(interaction: any, officer: any) {
    const cittadino = interaction.options.getUser('cittadino');
    const motivo = interaction.options.getString('motivo');

    const targetUser = await storage.getUserByDiscordId(cittadino.id);
    if (!targetUser) {
      const errorEmbed = createErrorEmbed('Utente non trovato nel database.');
      return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    // Reset criminal record
    const cleanRecord = {
      arrests: 0,
      fines: 0,
      totalAmount: 0,
      charges: []
    };

    await storage.updateUser(targetUser.id, { criminalRecord: cleanRecord });

    const embed = createSuccessEmbed(`Fedina penale di **${targetUser.nickname || targetUser.username}** pulita con successo.\n**Motivo:** ${motivo}`);
    await interaction.reply({ embeds: [embed] });
  }

  private async handleSequestroCommand(interaction: any, officer: any) {
    const cittadino = interaction.options.getUser('cittadino');
    const targa = interaction.options.getString('targa');
    const motivo = interaction.options.getString('motivo');
    const attachment = interaction.options.getAttachment('foto-veicolo');

    const vehicle = await storage.getVehicleByPlate(targa);
    if (!vehicle) {
      const errorEmbed = createErrorEmbed('Veicolo non trovato.');
      return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    await storage.updateVehicle(vehicle.id, {
      isSeized: true,
      seizedBy: officer.id,
      seizedReason: motivo,
      seizedPhoto: attachment?.url
    });

    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle('🚫 VEICOLO SEQUESTRATO')
      .addFields(
        { name: 'Veicolo', value: `${vehicle.name} - ${targa}`, inline: true },
        { name: 'Ufficiale', value: officer.nickname || officer.username, inline: true },
        { name: 'Motivo', value: motivo, inline: false }
      )
      .setTimestamp();

    if (attachment) {
      embed.setImage(attachment.url);
    }

    await interaction.reply({ embeds: [embed] });
  }

  private async handleDisequestroCommand(interaction: any, officer: any) {
    const targa = interaction.options.getString('targa');

    const vehicle = await storage.getVehicleByPlate(targa);
    if (!vehicle) {
      const errorEmbed = createErrorEmbed('Veicolo non trovato.');
      return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    if (!vehicle.isSeized) {
      const errorEmbed = createErrorEmbed('Il veicolo non è attualmente sequestrato.');
      return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    await storage.updateVehicle(vehicle.id, {
      isSeized: false,
      seizedBy: null,
      seizedReason: null,
      seizedPhoto: null
    });

    const embed = createSuccessEmbed(`Veicolo **${vehicle.name} - ${targa}** liberato dal sequestro.`);
    await interaction.reply({ embeds: [embed] });
  }

  private async handleCercaVeicoloCommand(interaction: any, officer: any) {
    const targa = interaction.options.getString('targa');

    const vehicle = await storage.getVehicleByPlate(targa);
    if (!vehicle) {
      const errorEmbed = createErrorEmbed('Veicolo non trovato.');
      return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    const owner = await storage.getUser(vehicle.ownerId);
    const seizedByOfficer = vehicle.seizedBy ? await storage.getUser(vehicle.seizedBy) : null;

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('🔍 INFORMAZIONI VEICOLO')
      .addFields(
        { name: 'Modello', value: vehicle.name, inline: true },
        { name: 'Targa', value: vehicle.licensePlate, inline: true },
        { name: 'Proprietario', value: owner?.nickname || owner?.username || 'N/D', inline: true },
        { name: 'Assicurazione', value: vehicle.insuranceExpiry && vehicle.insuranceExpiry > new Date() ? '✅ Valida' : '❌ Scaduta', inline: true },
        { name: 'Stato', value: vehicle.isSeized ? '🚫 Sequestrato' : '✅ Disponibile', inline: true }
      );

    if (vehicle.isSeized && seizedByOfficer) {
      embed.addFields(
        { name: 'Sequestrato da', value: seizedByOfficer.nickname || seizedByOfficer.username, inline: true },
        { name: 'Motivo sequestro', value: vehicle.seizedReason || 'N/D', inline: false }
      );
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  private async handleImpostazioniCommand(interaction: any, officer: any) {
    const ruoloPolizia = interaction.options.getRole('ruolo-polizia');
    const ruoloAdmin = interaction.options.getRole('ruolo-admin');

    const settings: any = {};
    if (ruoloPolizia) settings.policeRoleId = ruoloPolizia.id;
    if (ruoloAdmin) settings.adminRoleId = ruoloAdmin.id;

    await storage.setSetting('discord_roles', settings);

    const embed = createSuccessEmbed('Impostazioni ruoli aggiornate con successo!');
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  private async handleRoleplayCommand(interaction: any, officer: any) {
    const stato = interaction.options.getString('stato');
    const isActive = stato === 'on';

    await storage.setSetting('roleplay_active', isActive);

    const embed = new EmbedBuilder()
      .setColor(isActive ? 0x2ecc71 : 0xe74c3c)
      .setTitle(isActive ? '✅ ROLEPLAY ATTIVATO' : '❌ ROLEPLAY DISATTIVATO')
      .setDescription(`La modalità roleplay è stata ${isActive ? 'attivata' : 'disattivata'} da ${officer.nickname || officer.username}`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }

  private async handleSayCommand(interaction: any, officer: any) {
    const testo = interaction.options.getString('testo');

    await interaction.reply({ content: testo });
  }

  private async handleClearCommand(interaction: any, officer: any) {
    const numero = interaction.options.getInteger('numero');

    try {
      const messages = await interaction.channel.bulkDelete(numero, true);
      const embed = createSuccessEmbed(`Eliminati ${messages.size} messaggi.`);
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      const errorEmbed = createErrorEmbed('Errore nell\'eliminazione dei messaggi. Potrebbero essere troppo vecchi.');
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }

  private async handleSondaggioRpCommand(interaction: any, officer: any) {
    const domanda = interaction.options.getString('domanda');

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('📊 SONDAGGIO ROLEPLAY')
      .setDescription(domanda)
      .setFooter({ text: `Sondaggio creato da ${officer.nickname || officer.username}` })
      .setTimestamp();

    const message = await interaction.reply({ embeds: [embed], fetchReply: true });
    
    // Add reactions for voting
    await message.react('✅');
    await message.react('❌');
    await message.react('🤷');
  }

  private async handleAnnuncioCommand(interaction: any, officer: any) {
    const titolo = interaction.options.getString('titolo');
    const testo = interaction.options.getString('testo');
    const ruoloDaTaggare = interaction.options.getRole('ruolo-da-taggare');

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`📢 ${titolo}`)
      .setDescription(testo)
      .setFooter({ text: `Annuncio di ${officer.nickname || officer.username}` })
      .setTimestamp();

    const content = ruoloDaTaggare ? `${ruoloDaTaggare}` : undefined;
    await interaction.reply({ content, embeds: [embed] });
  }

  private async handleSetRuoloCommand(interaction: any, admin: any) {
    const targetUser = interaction.options.getUser('utente');
    const newRole = interaction.options.getString('ruolo');

    // Get user from database
    const dbUser = await storage.getUserByDiscordId(targetUser.id);
    if (!dbUser) {
      const errorEmbed = createErrorEmbed('Utente non trovato nel database.');
      return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    // Update user role
    await storage.updateUser(dbUser.id, { role: newRole as any });

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle('👑 RUOLO AGGIORNATO')
      .addFields(
        { name: 'Utente', value: dbUser.nickname || dbUser.username, inline: true },
        { name: 'Ruolo Precedente', value: dbUser.role, inline: true },
        { name: 'Nuovo Ruolo', value: newRole, inline: true },
        { name: 'Aggiornato da', value: admin.nickname || admin.username, inline: false }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Send notification to user
    try {
      const dmEmbed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle('📢 Aggiornamento Ruolo')
        .setDescription(`Il tuo ruolo è stato aggiornato a: **${newRole}**`)
        .addFields(
          { name: 'Aggiornato da', value: admin.nickname || admin.username }
        )
        .setTimestamp();

      await targetUser.send({ embeds: [dmEmbed] });
    } catch (error) {
      console.log(`Impossibile inviare DM a ${targetUser.username}`);
    }
  }

  public async start() {
    if (!BOT2_TOKEN) {
      throw new Error('BOT2_TOKEN è richiesto per avviare il bot polizia/admin');
    }
    await this.client.login(BOT2_TOKEN);
  }

  public getClient() {
    return this.client;
  }
}
