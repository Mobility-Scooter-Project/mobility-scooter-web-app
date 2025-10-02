import { CreateUpdateDeleteFields } from '@infra/db/entity/shared';
import { User } from '@infra/db/entity/user/user';
import { IsOptional, IsPhoneNumber } from 'class-validator';

export class UpdateUserDto implements Partial<User> {
  @IsOptional()
  givenName?: string | undefined;

  @IsOptional()
  surname?: string | undefined;

  @IsOptional()
  title?: string | undefined;

  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string | undefined;

  @IsOptional()
  city?: string | undefined;

  @IsOptional()
  cud?: CreateUpdateDeleteFields | undefined;
}
