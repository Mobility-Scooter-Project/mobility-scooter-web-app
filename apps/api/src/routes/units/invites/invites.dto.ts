import { USER_ROLES } from '@config/enums';

export class InviteDto {
  role: USER_ROLES;
  email: string;
}
