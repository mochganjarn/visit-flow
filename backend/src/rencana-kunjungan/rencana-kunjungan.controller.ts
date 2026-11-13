import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RencanaKunjunganService } from './rencana-kunjungan.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class RencanaKunjunganController {
  constructor(
    private readonly rencanaKunjunganService: RencanaKunjunganService,
  ) {}

  @Get('entity')
  async getEntities() {
    return this.rencanaKunjunganService.getAllEntities();
  }

  @Get('rencana-kunjungan')
  async getRencanaKunjungan(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('segmen') segmen?: string,
    @Query('status') status?: string,
  ) {
    return this.rencanaKunjunganService.getRencanaKunjungan(req.user, {
      search,
      startDate,
      endDate,
      segmen,
      status,
    });
  }

  @Post('rencana-kunjungan')
  async createRencanaKunjungan(
    @Request() req: any,
    @Body()
    body: {
      entity: number;
      status: string;
      segmen: string;
      tanggal_kunjungan: string;
    },
  ) {
    return this.rencanaKunjunganService.createRencanaKunjungan(
      req.user.id,
      body,
    );
  }

  @Patch('rencana-kunjungan/:id/status')
  async updateStatusKunjungan(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Request() req: any,
  ) {
    return this.rencanaKunjunganService.updateStatusKunjungan(
      Number(id),
      body.status,
      req.user,
    );
  }
}

