import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { MembershipStatus } from '../enums/membership-status.enum';
import { LocusSideloadInclude } from '../enums/locus-sideload-include.enum';
import { LocusSortField } from '../enums/locus-sort-field.enum';
import { SortOrder } from '../enums/sort-order.enum';

export class GetLocusQueryDto {
  @ApiPropertyOptional({
    description: 'Comma-separated list of locus IDs (bigint as string)',
    example: '3106326,3106352',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map((v) => v.trim()) : value,
  )
  @IsNumberString({}, { each: true })
  id?: string[];

  @ApiPropertyOptional({
    description: 'Assembly identifier (text)',
    example: 'Rrox_v1',
  })
  @IsOptional()
  @IsString()
  assemblyId?: string;

  @ApiPropertyOptional({
    description: 'Comma-separated list of region IDs',
    example: '182936,182939',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map((v) => parseInt(v.trim(), 10)) : value,
  )
  @IsInt({ each: true })
  regionId?: number[];

  @ApiPropertyOptional({
    enum: MembershipStatus,
    description: 'Filter by membership status',
  })
  @IsOptional()
  @IsEnum(MembershipStatus)
  membershipStatus?: MembershipStatus;

  @ApiPropertyOptional({
    enum: LocusSideloadInclude,
    description: 'Include related entities in response',
  })
  @IsOptional()
  @IsEnum(LocusSideloadInclude)
  include?: LocusSideloadInclude;

  @ApiPropertyOptional({
    description: 'Page number (starts from 1)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Rows per page',
    default: 1000,
    minimum: 1,
    maximum: 5000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5000)
  limit: number = 1000;

  @ApiPropertyOptional({
    enum: LocusSortField,
    default: LocusSortField.ID,
  })
  @IsOptional()
  @IsEnum(LocusSortField)
  sortBy: LocusSortField = LocusSortField.ID;

  @ApiPropertyOptional({
    enum: SortOrder,
    default: SortOrder.ASC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder: SortOrder = SortOrder.ASC;
}