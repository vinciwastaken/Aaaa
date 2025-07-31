import { CitizenBot } from '../bots/bot1-cittadini';
import { PoliceBot } from '../bots/bot2-polizia';

export class DiscordService {
  private citizenBot: CitizenBot | null = null;
  private policeBot: PoliceBot | null = null;

  async startBots() {
    try {
      console.log('🚀 Avvio dei bot Discord...');

      // Start Citizen Bot
      if (process.env.BOT1_TOKEN || process.env.DISCORD_BOT1_TOKEN) {
        this.citizenBot = new CitizenBot();
        await this.citizenBot.start();
        console.log('✅ Bot Cittadini avviato con successo');
      } else {
        console.warn('⚠️ BOT1_TOKEN non trovato, Bot Cittadini non avviato');
      }

      // Start Police Bot
      if (process.env.BOT2_TOKEN || process.env.DISCORD_BOT2_TOKEN) {
        this.policeBot = new PoliceBot();
        await this.policeBot.start();
        console.log('✅ Bot Polizia/Admin avviato con successo');
      } else {
        console.warn('⚠️ BOT2_TOKEN non trovato, Bot Polizia/Admin non avviato');
      }

      console.log('🎉 Tutti i bot Discord sono stati avviati!');
    } catch (error) {
      console.error('❌ Errore nell\'avvio dei bot:', error);
      throw error;
    }
  }

  getCitizenBot(): CitizenBot | null {
    return this.citizenBot;
  }

  getPoliceBot(): PoliceBot | null {
    return this.policeBot;
  }

  async stopBots() {
    console.log('🛑 Spegnimento dei bot Discord...');
    
    if (this.citizenBot) {
      this.citizenBot.getClient().destroy();
      this.citizenBot = null;
      console.log('✅ Bot Cittadini spento');
    }

    if (this.policeBot) {
      this.policeBot.getClient().destroy();
      this.policeBot = null;
      console.log('✅ Bot Polizia/Admin spento');
    }

    console.log('🎉 Tutti i bot Discord sono stati spenti!');
  }

  getBotsStatus() {
    return {
      citizenBot: {
        isActive: this.citizenBot !== null,
        uptime: this.citizenBot?.getClient().uptime || 0,
        guilds: this.citizenBot?.getClient().guilds.cache.size || 0,
        users: this.citizenBot?.getClient().users.cache.size || 0
      },
      policeBot: {
        isActive: this.policeBot !== null,
        uptime: this.policeBot?.getClient().uptime || 0,
        guilds: this.policeBot?.getClient().guilds.cache.size || 0,
        users: this.policeBot?.getClient().users.cache.size || 0
      }
    };
  }
}

export const discordService = new DiscordService();
