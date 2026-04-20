import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { UserRole } from '../../../common/enums/user-role.enum';
import { LocusMemberResponseDto } from './locus-member.response.dto';

export class LocusResponseDto {
  @ApiProperty({ description: 'bigint as string' })
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  assemblyId: string;

  @ApiProperty()
  @Expose()
  locusName: string;

  @ApiProperty()
  @Expose()
  publicLocusName: string;

  @ApiProperty()
  @Expose()
  chromosome: string;

  @ApiProperty()
  @Expose()
  strand: string;

  @ApiProperty()
  @Expose()
  locusStart: number;

  @ApiProperty()
  @Expose()
  locusStop: number;

  @ApiProperty()
  @Expose()
  memberCount: number;

  @ApiPropertyOptional({
    type: [LocusMemberResponseDto],
    description: 'Only returned for admin/limited roles when sideloading is requested',
  })
  @Expose({ groups: [UserRole.ADMIN, UserRole.LIMITED] })
  @Type(() => LocusMemberResponseDto)
  locusMembers?: LocusMemberResponseDto[];
}