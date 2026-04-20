import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { Locus } from '../src/modules/locus/entities/locus.entity';
import { LocusMember } from '../src/modules/locus/entities/locus-member.entity';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mockQueryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    const mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(Locus))
      .useValue(mockRepository)
      .overrideProvider(getRepositoryToken(LocusMember))
      .useValue(mockRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should return access token for valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'admin', password: 'adminpass' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(typeof res.body.accessToken).toBe('string');
        });
    });

    it('should return 401 for invalid password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'admin', password: 'wrong' })
        .expect(401);
    });

    it('should return 400 for missing body', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });
  });

  describe('GET /locus', () => {
    let adminToken: string;
    let normalToken: string;

    beforeAll(async () => {
      const adminRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'admin', password: 'adminpass' });
      adminToken = adminRes.body.accessToken;

      const normalRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'normal', password: 'normalpass' });
      normalToken = normalRes.body.accessToken;
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer()).get('/locus').expect(401);
    });

    it('should return 200 with valid admin token', () => {
      return request(app.getHttpServer())
        .get('/locus')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should return 403 when normal role requests sideloading', () => {
      return request(app.getHttpServer())
        .get('/locus?include=locusMembers')
        .set('Authorization', `Bearer ${normalToken}`)
        .expect(403);
    });

    it('should return 400 for unknown query parameter', () => {
      return request(app.getHttpServer())
        .get('/locus?unknown=value')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });
});