import { IsNotEmpty, IsUUID, Matches } from 'class-validator';

export class SessionDto {
  @IsUUID()
  patientId: string;

  // YYYY-MM-DD
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  sessionDate: string;

  // HH:MM:SS 
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/)
  sessionTime: string;
}
