import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

import { GetLocusQueryDto } from './dto/get-locus.query.dto';
import { LocusResponseDto } from './dto/locus.response.dto';
import { LocusService } from './locus.service';

@ApiTags('locus')
@ApiBearerAuth()
@Controller('locus')
export class LocusController {
  constructor(private readonly locusService: LocusService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.NORMAL, UserRole.LIMITED)
  @ApiOperation({ summary: 'Get locus list with optional filters and sideloading' })
  @ApiOkResponse({ type: [LocusResponseDto] })
  getLocus(
    @Query() query: GetLocusQueryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<LocusResponseDto[]> {
    return this.locusService.getLocus(query, user);
  }
}