import { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { storage } from '../storage';
import { registerCommands, createErrorEmbed, createSuccessEmbed } from './shared/utils';

const BOT1_TOKEN = process.env.BOT1_TOKEN || process.env.DISCORD_BOT1_TOKEN || "";

export class CitizenBot {
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
      console.log(`🤖 Bot Cittadini connesso come ${this.client.user?.tag}`);
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
      // Roleplay commands
      new SlashCommandBuilder()
        .setName('me')
        .setDescription('Esegue un\'azione roleplay')
        .addStringOption(option =>
          option.setName('azione')
            .setDescription('L\'azione da eseguire')
            .setRequired(true)),

      new SlashCommandBuilder()
        .setName('documento')
        .setDescription('Mostra o vede un documento')
        .addUserOption(option =>
          option.setName('cittadino')
            .setDescription('Il cittadino di cui vedere il documento')),

      new SlashCommandBuilder()
        .setName('turno')
        .setDescription('Inizia o finisce il turno lavorativo')
        .addStringOption(option =>
          option.setName('lavoro')
            .setDescription('Il tipo di lavoro')
            .setRequired(true)
            .addChoices(
              { name: 'Poliziotto', value: 'poliziotto' },
              { name: 'Medico', value: 'medico' },
              { name: 'Pompiere', value: 'pompiere' },
              { name: 'Meccanico', value: 'meccanico' },
              { name: 'Camionista', value: 'camionista' },
              { name: 'Chef', value: 'chef' },
              { name: 'Insegnante', value: 'insegnante' },
              { name: 'Giornalista', value: 'giornalista' }
            ))
        .addStringOption(option =>
          option.setName('stato')
            .setDescription('Inizio o fine turno')
            .setRequired(true)
            .addChoices(
              { name: 'Inizio', value: 'inizio' },
              { name: 'Fine', value: 'fine' }
            )),

      new SlashCommandBuilder()
        .setName('set-nickname')
        .setDescription('Imposta il tuo nickname per il roleplay')
        .addStringOption(option =>
          option.setName('nome')
            .setDescription('Il nuovo nickname')
            .setRequired(true)),

      new SlashCommandBuilder()
        .setName('anonimo')
        .setDescription('Scrive un messaggio in anonimo')
        .addStringOption(option =>
          option.setName('testo')
            .setDescription('Il messaggio da inviare')
            .setRequired(true)),

      // Drug system
      new SlashCommandBuilder()
        .setName('raccolta-droga')
        .setDescription('Inizia o finisce la raccolta di droga')
        .addStringOption(option =>
          option.setName('droga')
            .setDescription('Il tipo di droga')
            .setRequired(true)
            .addChoices(
              { name: 'Marijuana', value: 'marijuana' },
              { name: 'Cocaina', value: 'cocaina' },
              { name: 'Eroina', value: 'eroina' },
              { name: 'Metanfetamine', value: 'metanfetamine' },
              { name: 'Ecstasy', value: 'ecstasy' }
            ))
        .addStringOption(option =>
          option.setName('stato')
            .setDescription('Inizia o finisce')
            .setRequired(true)
            .addChoices(
              { name: 'Inizio', value: 'inizio' },
              { name: 'Fine', value: 'fine' }
            )),

      new SlashCommandBuilder()
        .setName('processo-droga')
        .setDescription('Inizia o finisce il processo di una droga')
        .addStringOption(option =>
          option.setName('droga')
            .setDescription('Il tipo di droga')
            .setRequired(true)
            .addChoices(
              { name: 'Marijuana', value: 'marijuana' },
              { name: 'Cocaina', value: 'cocaina' },
              { name: 'Eroina', value: 'eroina' },
              { name: 'Metanfetamine', value: 'metanfetamine' },
              { name: 'Ecstasy', value: 'ecstasy' }
            ))
        .addStringOption(option =>
          option.setName('stato')
            .setDescription('Inizia o finisce')
            .setRequired(true)
            .addChoices(
              { name: 'Inizio', value: 'inizio' },
              { name: 'Fine', value: 'fine' }
            )),

      // Crime system
      new SlashCommandBuilder()
        .setName('rapina')
        .setDescription('Segnala l\'inizio di una rapina')
        .addStringOption(option =>
          option.setName('luogo')
            .setDescription('Il luogo della rapina')
            .setRequired(true)),

      new SlashCommandBuilder()
        .setName('911')
        .setDescription('Chiama servizi di emergenza')
        .addStringOption(option =>
          option.setName('emergenza')
            .setDescription('Descrizione dell\'emergenza')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('tipo')
            .setDescription('Tipo di servizio richiesto')
            .setRequired(true)
            .addChoices(
              { name: 'Polizia', value: 'polizia' },
              { name: 'Medici', value: 'medico' },
              { name: 'Pompieri', value: 'pompieri' }
            )),

      // Vehicle system
      new SlashCommandBuilder()
        .setName('libretto-veicolo')
        .setDescription('Mostra i tuoi libretti veicolo'),

      new SlashCommandBuilder()
        .setName('registra-veicolo')
        .setDescription('Registra un nuovo veicolo (solo con ruoli autorizzati)')
        .addUserOption(option =>
          option.setName('cittadino')
            .setDescription('Il proprietario del veicolo')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('nome-veicolo')
            .setDescription('Il nome/modello del veicolo')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('targa')
            .setDescription('La targa del veicolo')
            .setRequired(true)),

      new SlashCommandBuilder()
        .setName('registra-assicurazione')
        .setDescription('Registra l\'assicurazione di un veicolo (solo con ruoli autorizzati)')
        .addStringOption(option =>
          option.setName('targa')
            .setDescription('La targa del veicolo')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('durata')
            .setDescription('Durata dell\'assicurazione in giorni')
            .setRequired(true))
    ];

    await registerCommands(this.client, commands, BOT1_TOKEN);
  }

  private async handleCommand(interaction: any) {
    const { commandName, user, options } = interaction;

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

    switch (commandName) {
      case 'me':
        await this.handleMeCommand(interaction, dbUser);
        break;
      case 'documento':
        await this.handleDocumentoCommand(interaction, dbUser);
        break;
      case 'turno':
        await this.handleTurnoCommand(interaction, dbUser);
        break;
      case 'set-nickname':
        await this.handleSetNicknameCommand(interaction, dbUser);
        break;
      case 'anonimo':
        await this.handleAnonimoCommand(interaction, dbUser);
        break;
      case 'raccolta-droga':
        await this.handleRaccoltaDrogaCommand(interaction, dbUser);
        break;
      case 'processo-droga':
        await this.handleProcessoDrogaCommand(interaction, dbUser);
        break;
      case 'rapina':
        await this.handleRapinaCommand(interaction, dbUser);
        break;
      case '911':
        await this.handle911Command(interaction, dbUser);
        break;
      case 'libretto-veicolo':
        await this.handleLibrettoVeicoloCommand(interaction, dbUser);
        break;
      case 'registra-veicolo':
        await this.handleRegistraVeicoloCommand(interaction, dbUser);
        break;
      case 'registra-assicurazione':
        await this.handleRegistraAssicurazioneCommand(interaction, dbUser);
        break;
    }
  }

  private async handleMeCommand(interaction: any, user: any) {
    const azione = interaction.options.getString('azione');
    
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setDescription(`**${user.nickname || user.username}** ${azione}`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }

  private async handleDocumentoCommand(interaction: any, user: any) {
    const targetUser = interaction.options.getUser('cittadino');
    
    if (targetUser) {
      const targetDbUser = await storage.getUserByDiscordId(targetUser.id);
      if (!targetDbUser) {
        const errorEmbed = createErrorEmbed('Utente non trovato nel database.');
        return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle('📄 Documento d\'Identità')
        .addFields(
          { name: 'Nome', value: targetDbUser.nickname || targetDbUser.username, inline: true },
          { name: 'Ruolo', value: targetDbUser.role, inline: true },
          { name: 'Stato', value: targetDbUser.isOnDuty ? '🟢 In servizio' : '🔴 Fuori servizio', inline: true },
          { name: 'Fedina Penale', value: `Arresti: ${targetDbUser.criminalRecord.arrests}\nMulte: €${targetDbUser.criminalRecord.totalAmount}`, inline: false }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } else {
      // Show own document
      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle('📄 Il Tuo Documento d\'Identità')
        .addFields(
          { name: 'Nome', value: user.nickname || user.username, inline: true },
          { name: 'Ruolo', value: user.role, inline: true },
          { name: 'Stato', value: user.isOnDuty ? '🟢 In servizio' : '🔴 Fuori servizio', inline: true },
          { name: 'Fedina Penale', value: `Arresti: ${user.criminalRecord.arrests}\nMulte: €${user.criminalRecord.totalAmount}`, inline: false }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }

  private async handleTurnoCommand(interaction: any, user: any) {
    const lavoro = interaction.options.getString('lavoro');
    const stato = interaction.options.getString('stato');

    if (stato === 'inizio') {
      await storage.updateUser(user.id, { isOnDuty: true, role: lavoro as any });
      await storage.createWorkShift({
        userId: user.id,
        role: lavoro as any,
        startTime: new Date(),
        isActive: true
      });

      const embed = createSuccessEmbed(`Turno di **${lavoro}** iniziato con successo!`);
      await interaction.reply({ embeds: [embed] });
    } else {
      await storage.updateUser(user.id, { isOnDuty: false });
      
      // End active work shift
      const activeShifts = await storage.getUserWorkShifts(user.id);
      const currentShift = activeShifts.find(s => s.isActive);
      if (currentShift) {
        await storage.updateWorkShift(currentShift.id, {
          endTime: new Date(),
          isActive: false
        });
      }

      const embed = createSuccessEmbed(`Turno di **${lavoro}** terminato con successo!`);
      await interaction.reply({ embeds: [embed] });
    }
  }

  private async handleSetNicknameCommand(interaction: any, user: any) {
    const nome = interaction.options.getString('nome');
    
    await storage.updateUser(user.id, { nickname: nome });
    
    const embed = createSuccessEmbed(`Nickname impostato a: **${nome}**`);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  private async handleAnonimoCommand(interaction: any, user: any) {
    const testo = interaction.options.getString('testo');
    
    const embed = new EmbedBuilder()
      .setColor(0x95a5a6)
      .setTitle('💬 Messaggio Anonimo')
      .setDescription(testo)
      .setFooter({ text: 'Messaggio inviato in forma anonima' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }

  private async handleRaccoltaDrogaCommand(interaction: any, user: any) {
    const droga = interaction.options.getString('droga');
    const stato = interaction.options.getString('stato');

    if (stato === 'inizio') {
      const activity = await storage.createDrugActivity({
        userId: user.id,
        drugType: droga as any,
        activity: 'raccolta',
        isActive: true
      });

      const embed = createSuccessEmbed(`Raccolta di **${droga}** iniziata!`);
      await interaction.reply({ embeds: [embed] });
    } else {
      const activities = await storage.getDrugActivitiesByUser(user.id);
      const activeActivity = activities.find(a => a.isActive && a.drugType === droga && a.activity === 'raccolta');
      
      if (activeActivity) {
        await storage.updateDrugActivity(activeActivity.id, {
          isActive: false,
          endedAt: new Date()
        });

        const embed = createSuccessEmbed(`Raccolta di **${droga}** terminata!`);
        await interaction.reply({ embeds: [embed] });
      } else {
        const errorEmbed = createErrorEmbed('Non hai attività di raccolta attive per questa droga.');
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }

  private async handleProcessoDrogaCommand(interaction: any, user: any) {
    const droga = interaction.options.getString('droga');
    const stato = interaction.options.getString('stato');

    if (stato === 'inizio') {
      const activity = await storage.createDrugActivity({
        userId: user.id,
        drugType: droga as any,
        activity: 'processo',
        isActive: true
      });

      const embed = createSuccessEmbed(`Processo di **${droga}** iniziato!`);
      await interaction.reply({ embeds: [embed] });
    } else {
      const activities = await storage.getDrugActivitiesByUser(user.id);
      const activeActivity = activities.find(a => a.isActive && a.drugType === droga && a.activity === 'processo');
      
      if (activeActivity) {
        await storage.updateDrugActivity(activeActivity.id, {
          isActive: false,
          endedAt: new Date()
        });

        const embed = createSuccessEmbed(`Processo di **${droga}** terminato!`);
        await interaction.reply({ embeds: [embed] });
      } else {
        const errorEmbed = createErrorEmbed('Non hai attività di processo attive per questa droga.');
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }

  private async handleRapinaCommand(interaction: any, user: any) {
    const luogo = interaction.options.getString('luogo');
    
    const robbery = await storage.createRobbery({
      userId: user.id,
      location: luogo,
      isActive: true
    });

    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle('🚨 RAPINA IN CORSO')
      .setDescription(`**Luogo:** ${luogo}`)
      .addFields(
        { name: 'Segnalato da', value: user.nickname || user.username, inline: true },
        { name: 'Orario', value: new Date().toLocaleTimeString('it-IT'), inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Notify police (this would be sent to a police channel)
    // Implementation would depend on Discord server setup
  }

  private async handle911Command(interaction: any, user: any) {
    const emergenza = interaction.options.getString('emergenza');
    const tipo = interaction.options.getString('tipo');

    const call = await storage.createEmergencyCall({
      callerId: user.id,
      type: tipo,
      description: emergenza,
      isResolved: false
    });

    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle('🚨 CHIAMATA DI EMERGENZA')
      .setDescription(emergenza)
      .addFields(
        { name: 'Servizio Richiesto', value: tipo.toUpperCase(), inline: true },
        { name: 'Chiamante', value: user.nickname || user.username, inline: true },
        { name: 'ID Chiamata', value: call.id.slice(-6), inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }

  private async handleLibrettoVeicoloCommand(interaction: any, user: any) {
    const vehicles = await storage.getVehiclesByOwner(user.id);
    
    if (vehicles.length === 0) {
      const errorEmbed = createErrorEmbed('Non possiedi nessun veicolo registrato.');
      return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('🚗 I Tuoi Veicoli')
      .setDescription('Ecco tutti i tuoi veicoli registrati:');

    vehicles.forEach(vehicle => {
      const insuranceStatus = vehicle.insuranceExpiry && vehicle.insuranceExpiry > new Date() ? '✅ Valida' : '❌ Scaduta';
      const seizureStatus = vehicle.isSeized ? '🚫 Sequestrato' : '✅ Disponibile';
      
      embed.addFields({
        name: `${vehicle.name} - ${vehicle.licensePlate}`,
        value: `**Assicurazione:** ${insuranceStatus}\n**Stato:** ${seizureStatus}`,
        inline: true
      });
    });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  private async handleRegistraVeicoloCommand(interaction: any, user: any) {
    // Check if user has permission (this would check Discord roles)
    if (!['amministratore', 'super_admin'].includes(user.role)) {
      const errorEmbed = createErrorEmbed('Non hai i permessi per registrare veicoli.');
      return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    const cittadino = interaction.options.getUser('cittadino');
    const nomeVeicolo = interaction.options.getString('nome-veicolo');
    const targa = interaction.options.getString('targa');

    const targetUser = await storage.getUserByDiscordId(cittadino.id);
    if (!targetUser) {
      const errorEmbed = createErrorEmbed('Utente non trovato nel database.');
      return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    const vehicle = await storage.createVehicle({
      ownerId: targetUser.id,
      name: nomeVeicolo,
      licensePlate: targa
    });

    const embed = createSuccessEmbed(`Veicolo **${nomeVeicolo}** con targa **${targa}** registrato per ${targetUser.nickname || targetUser.username}!`);
    await interaction.reply({ embeds: [embed] });
  }

  private async handleRegistraAssicurazioneCommand(interaction: any, user: any) {
    // Check if user has permission
    if (!['amministratore', 'super_admin'].includes(user.role)) {
      const errorEmbed = createErrorEmbed('Non hai i permessi per registrare assicurazioni.');
      return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    const targa = interaction.options.getString('targa');
    const durata = interaction.options.getInteger('durata');

    const vehicle = await storage.getVehicleByPlate(targa);
    if (!vehicle) {
      const errorEmbed = createErrorEmbed('Veicolo non trovato.');
      return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + durata);

    await storage.updateVehicle(vehicle.id, {
      insuranceExpiry: expiryDate
    });

    const embed = createSuccessEmbed(`Assicurazione registrata per il veicolo **${targa}**. Scadenza: ${expiryDate.toLocaleDateString('it-IT')}`);
    await interaction.reply({ embeds: [embed] });
  }

  public async start() {
    if (!BOT1_TOKEN) {
      throw new Error('BOT1_TOKEN è richiesto per avviare il bot cittadini');
    }
    await this.client.login(BOT1_TOKEN);
  }

  public getClient() {
    return this.client;
  }
}
