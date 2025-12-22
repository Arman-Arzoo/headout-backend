import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { RolesGuard } from 'src/auth/RolesGuard';
import { Role, TicketStatus } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // Create a support ticket
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('create')
  @Roles(Role.USER)
  async createSupportTicket(
    @Req() req,
    @Body('subject') subject: string,
    @Body('message') message: string,
  ) {
    return this.supportService.createSupportTicket(
      req.user.id,
      subject,
      message,
    );
  }

  // Get all support tickets for a user
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('tickets')
  @Roles(Role.USER)
  async getUserSupportTickets(@Req() req) {
    return this.supportService.getUserSupportTickets(req.user.id);
  }

  // PATCH /support/:id/status → Update ticket status
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/status')
  @Roles(Role.ADMIN)
  async updateSupportTicketStatus(
    @Body('status') status: TicketStatus,
    @Body('ticketId') ticketId: string,
  ) {
    return this.supportService.updateSupportTicketStatus(
      ticketId,
      status as any,
    );
  }
}
