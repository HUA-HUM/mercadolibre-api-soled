import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateDescriptionDto {
  @ApiProperty({ example: 'Texto plano, sin HTML.' })
  @IsString()
  @IsNotEmpty()
  description: string;
}
