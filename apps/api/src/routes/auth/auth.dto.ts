import { USER_ROLES } from '@config/enums';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

const JOIN_INTENDED_ROLE_VALUES = Object.values(USER_ROLES);

export class EmailBodyDto {
  @IsEmail()
  email: string;
}

export class SignInWithEmailDto extends EmailBodyDto {
  @IsNotEmpty()
  password: string;
}

export class SignUpWithEmailDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  givenName?: string;

  @IsOptional()
  @IsString()
  surname?: string;
}

/** Join-org application (no password on submit; user completes via emailed link). */
export class JoinOrgApplicationDto {
  @IsEmail()
  email: string;

  @IsUUID()
  orgId: string;

  @IsUUID()
  unitId: string;

  @IsOptional()
  @IsString()
  givenName?: string;

  @IsOptional()
  @IsString()
  surname?: string;

  /** Optional requested role that will be applied when signup is completed. */
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === null || value === undefined ? undefined : value,
  )
  @IsIn(JOIN_INTENDED_ROLE_VALUES)
  intendedRole?: string;
}

export class CompleteJoinOrgDto {
  @IsNotEmpty()
  token: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

export class TokenDto {
  @IsNotEmpty()
  token: string;
}

export class NewPasswordDto extends TokenDto {
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}
