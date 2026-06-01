import { Module } from '@nestjs/common';
import { ResilienceModule } from '../common/resilience/resilience.module';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';

@Module({
  imports: [ConfigModule, ResilienceModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
