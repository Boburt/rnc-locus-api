import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { MembershipStatus } from '../enums/membership-status.enum';

export class LocusMemberResponseDto {
  @ApiProperty({ description: 'bigint as string' })
  @Expose()
  locusMemberId: string;

  @ApiProperty()
  @Expose()
  ursTaxid: string;

  @ApiProperty()
  @Expose()
  regionId: number;

  @ApiProperty({ description: 'bigint as string' })
  @Expose()
  locusId: string;

  @ApiProperty({ enum: MembershipStatus })
  @Expose()
  membershipStatus: MembershipStatus;
}