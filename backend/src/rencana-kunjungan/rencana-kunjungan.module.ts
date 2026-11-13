import { Module } from '@nestjs/common';
import { RencanaKunjunganService } from './rencana-kunjungan.service';
import { RencanaKunjunganController } from './rencana-kunjungan.controller';

@Module({
  controllers: [RencanaKunjunganController],
  providers: [RencanaKunjunganService],
})
export class RencanaKunjunganModule {}

