import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit,OnModuleDestroy {
  // constructor  
  constructor(){
    super({
      datasources:{
        db:{
          // url: "postgresql://postgres:5432@localhost:5432/prisma-pasword?schema=public"
          url:process.env.DATABASE_URL
        }
      }
    })
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
