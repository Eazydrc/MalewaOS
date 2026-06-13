import { IsString, IsObject, IsNotEmpty } from 'class-validator';

export class SubscribeDto {
  @IsString()
  @IsNotEmpty()
  endpoint: string;

  @IsObject()
  keys: { p256dh: string; auth: string };
}
