export enum APPLICATION_STATUS {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'denied',
}

export enum ASSIGNMENT_STATUS {
  TODO = 'todo',
  INPROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  DENIED = 'denied',
}

export enum USER_ROLES {
  LEAD = 'lead',
  RESEARCHER = 'researcher',
  TRAINEE = 'trainee',
  ADMIN = 'admin',
}

export enum IDENTITY_PROVIDERS {
  EMAIL = 'email',
  IDP = 'idp',
}

export enum HTTP_METHODS {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

export enum INVITE_STATUS {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REVOKED = 'revoked',
}
