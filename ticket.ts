import { storage } from '../storage';
import { generateTicketId } from '../bots/shared/utils';

export interface TicketData {
  userId: string;
  title: string;
  description: string;
  priority?: 'bassa' | 'media' | 'alta' | 'urgente';
  category?: string;
}

export class TicketService {
  async createTicket(data: TicketData) {
    const ticket = await storage.createTicket({
      userId: data.userId,
      title: data.title,
      description: data.description,
      priority: data.priority || 'media',
      status: 'aperto'
    });

    return ticket;
  }

  async getTicketById(id: string) {
    return await storage.getTicket(id);
  }

  async getTicketsByUser(userId: string) {
    return await storage.getTicketsByUser(userId);
  }

  async getAllTickets() {
    return await storage.getAllTickets();
  }

  async getOpenTickets() {
    return await storage.getOpenTickets();
  }

  async updateTicketStatus(id: string, status: 'aperto' | 'in_corso' | 'risolto' | 'chiuso') {
    return await storage.updateTicket(id, { status });
  }

  async assignTicket(id: string, assignedTo: string) {
    return await storage.updateTicket(id, { 
      assignedTo, 
      status: 'in_corso' 
    });
  }

  async closeTicket(id: string) {
    return await storage.updateTicket(id, { 
      status: 'chiuso' 
    });
  }

  async getTicketStats() {
    const allTickets = await this.getAllTickets();
    const openTickets = await this.getOpenTickets();
    
    const stats = {
      total: allTickets.length,
      open: openTickets.filter(t => t.status === 'aperto').length,
      inProgress: openTickets.filter(t => t.status === 'in_corso').length,
      resolved: allTickets.filter(t => t.status === 'risolto').length,
      closed: allTickets.filter(t => t.status === 'chiuso').length,
      byPriority: {
        urgent: openTickets.filter(t => t.priority === 'urgente').length,
        high: openTickets.filter(t => t.priority === 'alta').length,
        medium: openTickets.filter(t => t.priority === 'media').length,
        low: openTickets.filter(t => t.priority === 'bassa').length
      }
    };

    return stats;
  }
}

export const ticketService = new TicketService();
