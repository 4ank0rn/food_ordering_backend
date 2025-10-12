/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { Cloudinary } from './cloudinary.provider';

describe('Cloudinary', () => {
  let provider: Cloudinary;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Cloudinary],
    }).compile();

    provider = module.get<Cloudinary>(Cloudinary);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
