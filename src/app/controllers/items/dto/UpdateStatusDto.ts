import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export type MeliItemStatus = 'active' | 'paused' | 'closed';

export class UpdateStatusDto {
  @ApiProperty({ example: 'paused', enum: ['active', 'paused', 'closed'] })
  @IsIn(['active', 'paused', 'closed'])
  status: MeliItemStatus;
}
