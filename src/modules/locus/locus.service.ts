import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';

import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { UserRole } from '../../common/enums/user-role.enum';

import { LIMITED_ROLE_ALLOWED_REGION_IDS } from './constants/locus.constants';
import { GetLocusQueryDto } from './dto/get-locus.query.dto';
import { LocusResponseDto } from './dto/locus.response.dto';
import { LocusSideloadInclude } from './enums/locus-sideload-include.enum';
import { Locus } from './entities/locus.entity';

@Injectable()
export class LocusService {
  constructor(
    @InjectRepository(Locus)
    private readonly locusRepository: Repository<Locus>,
  ) {}

  async getLocus(query: GetLocusQueryDto, user: AuthUser): Promise<LocusResponseDto[]> {
    // 1) Ролевая проверка: normal не может использовать sideloading
    if (
      query.include === LocusSideloadInclude.LOCUS_MEMBERS &&
      user.role === UserRole.NORMAL
    ) {
      throw new ForbiddenException('Role "normal" cannot use sideloading');
    }

    // 2) Определяем, нужен ли JOIN и нужно ли селектить members в ответ
    const wantsMembersInResponse =
      query.include === LocusSideloadInclude.LOCUS_MEMBERS &&
      user.role !== UserRole.NORMAL;

    const needsMembersJoin =
      wantsMembersInResponse ||
      user.role === UserRole.LIMITED ||
      query.regionId !== undefined ||
      query.membershipStatus !== undefined;

    // 3) Базовый QueryBuilder
    const qb = this.locusRepository.createQueryBuilder('locus');

    // 4) JOIN с members, если нужен
    if (needsMembersJoin) {
      // Для limited фильтруем members прямо в ON, чтобы не утекали запрещённые regionId
      const joinConditions: string[] = [];
      const joinParams: Record<string, unknown> = {};

      if (user.role === UserRole.LIMITED) {
        joinConditions.push('lm.region_id IN (:...allowedRegionIds)');
        joinParams.allowedRegionIds = LIMITED_ROLE_ALLOWED_REGION_IDS;
      }

      if (query.regionId?.length) {
        joinConditions.push('lm.region_id IN (:...regionIds)');
        joinParams.regionIds = query.regionId;
      }

      if (query.membershipStatus) {
        joinConditions.push('lm.membership_status = :membershipStatus');
        joinParams.membershipStatus = query.membershipStatus;
      }

      const joinCondition = joinConditions.length
        ? joinConditions.join(' AND ')
        : undefined;

      if (wantsMembersInResponse) {
        qb.leftJoinAndSelect('locus.locusMembers', 'lm', joinCondition, joinParams);
      } else {
        qb.leftJoin('locus.locusMembers', 'lm', joinCondition, joinParams);
      }

      // Для limited: locus попадает в результат только если у него есть хотя бы один allowed member
      if (user.role === UserRole.LIMITED) {
        qb.andWhere('lm.id IS NOT NULL');
      }

      // Аналогично для фильтров по members (regionId / membershipStatus):
      // INNER-семантика: locus должен иметь хотя бы один member, подходящий под фильтр
      if (
        user.role !== UserRole.LIMITED &&
        (query.regionId?.length || query.membershipStatus)
      ) {
        qb.andWhere('lm.id IS NOT NULL');
      }
    }

    // 5) Фильтры по rl
    if (query.id?.length) {
      qb.andWhere('locus.id IN (:...ids)', { ids: query.id });
    }

    if (query.assemblyId) {
      qb.andWhere('locus.assembly_id = :assemblyId', {
        assemblyId: query.assemblyId,
      });
    }

    // 6) Сортировка
    qb.orderBy(`locus.${query.sortBy}`, query.sortOrder);

    // 7) Пагинация
    // Если JOIN есть, но members не селектим в ответ — возможны дубликаты locus.
    // Для корректной пагинации используем distinct() по locus.id.
    if (needsMembersJoin && !wantsMembersInResponse) {
      qb.distinct(true);
    }

    qb.skip((query.page - 1) * query.limit).take(query.limit);

    // 8) Выполнить запрос
    const entities = await qb.getMany();

    // 9) Сериализация с учётом роли
    return plainToInstance(LocusResponseDto, entities, {
      groups: [user.role],
      excludeExtraneousValues: true,
    });
  }
}