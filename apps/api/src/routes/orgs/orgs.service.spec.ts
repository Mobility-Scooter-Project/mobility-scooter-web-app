import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrgsService } from './orgs.service';
import { Org } from '@src/infra/db/entity/org/org';

describe('OrgsService', () => {
  let service: OrgsService;
  let orgRepository: Repository<Org>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrgsService,
        {
          provide: getRepositoryToken(Org),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrgsService>(OrgsService);
    orgRepository = module.get<Repository<Org>>(getRepositoryToken(Org));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns org options with only non-deleted units sorted by name', async () => {
    jest.spyOn(orgRepository, 'find').mockResolvedValue([
      {
        id: 'org-1',
        name: 'Alpha Org',
        cud: { deletedAt: null },
        units: [
          { id: 'u-2', name: 'Zulu Unit', cud: { deletedAt: null } },
          { id: 'u-1', name: 'Bravo Unit', cud: { deletedAt: null } },
          { id: 'u-deleted', name: 'Deleted Unit', cud: { deletedAt: new Date() } },
        ],
      },
    ] as unknown as Org[]);

    const result = await service.listJoinSignupOptions();

    expect(orgRepository.find).toHaveBeenCalledWith({
      relations: { units: true },
      order: { name: 'ASC' },
    });

    expect(result).toEqual([
      {
        id: 'org-1',
        name: 'Alpha Org',
        units: [
          { id: 'u-1', name: 'Bravo Unit' },
          { id: 'u-2', name: 'Zulu Unit' },
        ],
      },
    ]);
  });

  it('filters out deleted orgs and orgs with no active units', async () => {
    jest.spyOn(orgRepository, 'find').mockResolvedValue([
      {
        id: 'org-deleted',
        name: 'Deleted Org',
        cud: { deletedAt: new Date() },
        units: [{ id: 'u-1', name: 'Unit', cud: { deletedAt: null } }],
      },
      {
        id: 'org-no-units',
        name: 'No Units Org',
        cud: { deletedAt: null },
        units: [{ id: 'u-deleted', name: 'Old Unit', cud: { deletedAt: new Date() } }],
      },
      {
        id: 'org-ok',
        name: 'Active Org',
        cud: { deletedAt: null },
        units: [{ id: 'u-ok', name: 'Active Unit', cud: { deletedAt: null } }],
      },
    ] as unknown as Org[]);

    const result = await service.listJoinSignupOptions();

    expect(result).toEqual([
      {
        id: 'org-ok',
        name: 'Active Org',
        units: [{ id: 'u-ok', name: 'Active Unit' }],
      },
    ]);
  });
});
