import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
import { CepModule } from './modules/cep/cep.module';
import { ViaCepModule } from './integrations/viacep/viacep.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    CommonModule,
    ViaCepModule,
    CepModule,
  ],
})
export class AppModule {}
