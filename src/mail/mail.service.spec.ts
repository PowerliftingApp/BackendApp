import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;
  let configService: ConfigService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config = {
          EMAIL_USER: 'test@example.com',
          EMAIL_PASS: 'test-password',
          EMAIL_FROM: 'noreply@powermind.com',
          FRONTEND_URL: 'http://localhost:3000',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have ConfigService injected', () => {
    expect(configService).toBeDefined();
  });

  it('should get email configuration from ConfigService', () => {
    expect(configService.get('EMAIL_USER')).toBe('test@example.com');
    expect(configService.get('EMAIL_PASS')).toBe('test-password');
    expect(configService.get('EMAIL_FROM')).toBe('noreply@powermind.com');
    expect(configService.get('FRONTEND_URL')).toBe('http://localhost:3000');
  });
});
