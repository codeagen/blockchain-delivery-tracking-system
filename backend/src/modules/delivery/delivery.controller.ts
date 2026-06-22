import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { AssignAgentDto } from './dto/assign-agent.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { Role } from '../../common/enums/role.enum';
import { Delivery } from '../blockchain/delivery.interface';

/**
 * DeliveryController routes REST requests to DeliveryService. Every route is
 * JWT-protected and role-gated to mirror the on-chain access rules. It contains
 * NO business logic — all of that lives in DeliveryService / BlockchainService.
 */
@ApiTags('deliveries')
@ApiBearerAuth()
@Controller('deliveries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeliveryController {
  constructor(private readonly delivery: DeliveryService) {}

  /** POST /deliveries — SELLER creates a new delivery (signed by their wallet). */
  @Post()
  @ApiOperation({ summary: 'Create a new delivery (seller only)' })
  @Roles(Role.SELLER)
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateDeliveryDto,
  ): Promise<Delivery & { txHash: string }> {
    return this.delivery.create(user.sub, dto.customer, dto.description);
  }

  /** POST /deliveries/:id/assign — ADMIN assigns an agent. */
  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign a delivery agent (admin only)' })
  @Roles(Role.ADMIN)
  assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignAgentDto,
  ): Promise<Delivery & { txHash: string }> {
    return this.delivery.assignAgent(id, dto.agent);
  }

  /** PATCH /deliveries/:id/status — AGENT advances the status (signed by them). */
  @Patch(':id/status')
  @ApiOperation({ summary: 'Advance a delivery status (assigned agent only)' })
  @Roles(Role.AGENT)
  updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ): Promise<Delivery & { txHash: string }> {
    return this.delivery.updateStatus(user.sub, id, dto.status);
  }

  /** POST /deliveries/:id/confirm — CUSTOMER confirms receipt (signed by them). */
  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm receipt of a delivery (customer only)' })
  @Roles(Role.CUSTOMER)
  confirm(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Delivery & { txHash: string }> {
    return this.delivery.confirm(user.sub, id);
  }

  /** GET /deliveries/:id — any authenticated user reads one delivery. */
  @Get(':id')
  @ApiOperation({ summary: 'Get a single delivery with its transaction hashes' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Delivery & { txHashes: string[] }> {
    return this.delivery.findOne(id);
  }

  /** GET /deliveries — any authenticated user lists all deliveries. */
  @Get()
  @ApiOperation({ summary: 'List all deliveries' })
  findAll(): Promise<Delivery[]> {
    return this.delivery.findAll();
  }
}
