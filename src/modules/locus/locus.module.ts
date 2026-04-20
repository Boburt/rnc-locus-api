import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Locus } from './entities/locus.entity';
import { LocusMember } from './entities/locus-member.entity';
import { LocusController } from './locus.controller';
import { LocusService } from './locus.service';

@Module({
  imports: [TypeOrmModule.forFeature([Locus, LocusMember])],
  controllers: [LocusController],
  providers: [LocusService],
})
export class LocusModule {}