// import { Test, TestingModule } from '@nestjs/testing';
// import { PrismaService } from './prisma.service';

// describe('PrismaService', () => {
//   let service: PrismaService;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [PrismaService],
//     }).compile();

//     service = module.get<PrismaService>(PrismaService);
//   });

//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });
// });

// import { Test, TestingModule } from '@nestjs/testing';
// import { PrismaService } from './prisma.service';

// describe('PrismaService', () => {
//   let service: PrismaService;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [PrismaService],
//     }).compile();

//     service = module.get<PrismaService>(PrismaService);
//   });

//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });
// });

// import {
//   Injectable,
//   OnModuleInit,
//   OnModuleDestroy,
// } from '@nestjs/common';
// import { PrismaClient } from '@prisma/client';

// @Injectable()
// export class PrismaService
//   extends PrismaClient
//   implements OnModuleInit, OnModuleDestroy
// {
//   async onModuleInit() {
//     await this.$connect(); // create single pool at startup
//   }

//   async onModuleDestroy() {
//     await this.$disconnect();
//   }
// }
