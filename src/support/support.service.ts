import { Injectable } from '@nestjs/common';
import { TicketStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SupportService {
    constructor(private readonly prisma:PrismaService){}

    // Create a support ticket
    async createSupportTicket(userId: string, subject: string, message: string) {    
        return this.prisma.supportTicket.create({
            data: {
                userId,
                subject,
                message,
            },
        });
    }

    // Get all support tickets for a user
    async getUserSupportTickets(userId: string) {
        return this.prisma.supportTicket.findMany({
            where: {
                userId,
            },
        });
    }

    // PATCH /support/:id/status → Update ticket status
    async updateSupportTicketStatus(ticketId: string, status: TicketStatus) {
        return this.prisma.supportTicket.update({
            where: {
                id: ticketId,
            },
            data: {
                status,
            },
        });
    }
}
