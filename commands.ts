import { SlashCommandBuilder } from 'discord.js';

export const citizenCommands = [
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
          { name: 'Giornalista', value: 'giornalista' },
          { name: 'Avvocato', value: 'avvocato' }
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
        ))
];

export const policeCommands = [
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
];

export const adminCommands = [
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
    .setName('clear')
    .setDescription('Elimina un numero preciso di messaggi')
    .addIntegerOption(option =>
      option.setName('numero')
        .setDescription('Numero di messaggi da eliminare')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100))
];
