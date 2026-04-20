import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { UserRole } from '../../common/enums/user-role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { LIMITED_ROLE_ALLOWED_REGION_IDS } from './constants/locus.constants';
import { GetLocusQueryDto } from './dto/get-locus.query.dto';
import { Locus } from './entities/locus.entity';
import { LocusSideloadInclude } from './enums/locus-sideload-include.enum';
import { LocusSortField } from './enums/locus-sort-field.enum';
import { SortOrder } from './enums/sort-order.enum';
import { LocusService } from './locus.service';

describe('LocusService', () => {
  let service: LocusService;
  let mockQueryBuilder: Partial<SelectQueryBuilder<Locus>>;
  let mockRepository: Partial<Repository<Locus>>;

  beforeEach(async () => {
    mockQueryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocusService,
        {
          provide: getRepositoryToken(Locus),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<LocusService>(LocusService);
  });

  const defaultQuery: GetLocusQueryDto = {
    page: 1,
    limit: 1000,
    sortBy: LocusSortField.ID,
    sortOrder: SortOrder.ASC,
  };

  describe('getLocus', () => {
    it('should throw ForbiddenException when normal role requests sideloading', async () => {
      const user: AuthUser = { id: 2, username: 'normal', role: UserRole.NORMAL };
      const query: GetLocusQueryDto = {
        ...defaultQuery,
        include: LocusSideloadInclude.LOCUS_MEMBERS,
      };

      await expect(service.getLocus(query, user)).rejects.toThrow(ForbiddenException);
    });

    it('should apply allowed regionIds filter for limited role', async () => {
      const user: AuthUser = { id: 3, username: 'limited', role: UserRole.LIMITED };

      await service.getLocus(defaultQuery, user);

      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'locus.locusMembers',
        'lm',
        expect.stringContaining('lm.region_id IN'),
        expect.objectContaining({
          allowedRegionIds: LIMITED_ROLE_ALLOWED_REGION_IDS,
        }),
      );
    });

    it('should NOT join members for admin without filters and without sideloading', async () => {
      const user: AuthUser = { id: 1, username: 'admin', role: UserRole.ADMIN };

      await service.getLocus(defaultQuery, user);

      expect(mockQueryBuilder.leftJoin).not.toHaveBeenCalled();
      expect(mockQueryBuilder.leftJoinAndSelect).not.toHaveBeenCalled();
    });

    it('should use leftJoinAndSelect when admin requests sideloading', async () => {
      const user: AuthUser = { id: 1, username: 'admin', role: UserRole.ADMIN };
      const query: GetLocusQueryDto = {
        ...defaultQuery,
        include: LocusSideloadInclude.LOCUS_MEMBERS,
      };

      await service.getLocus(query, user);

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalled();
    });

    it('should apply pagination correctly', async () => {
      const user: AuthUser = { id: 1, username: 'admin', role: UserRole.ADMIN };
      const query: GetLocusQueryDto = { ...defaultQuery, page: 3, limit: 10 };

      await service.getLocus(query, user);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });
  });
});