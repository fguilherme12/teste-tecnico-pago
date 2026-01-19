import { Global, Module } from '@nestjs/common';
import { MongoDbService } from './core/mongodb.service';

@Global()
@Module({
  providers: [MongoDbService],
  exports: [MongoDbService],
})
export class DatabaseModule {}
