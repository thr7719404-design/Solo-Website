import { PartialType } from '@nestjs/mapped-types';
import { CreateLandingSectionDto } from './create-landing-section.dto';

export class UpdateLandingSectionDto extends PartialType(CreateLandingSectionDto) {}
