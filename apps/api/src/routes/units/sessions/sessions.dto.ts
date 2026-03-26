import { IsNotEmpty, Matches, MaxLength, MinLength } from 'class-validator';

/** Unit-scoped patient id from the client (e.g. "10", "STUDY-001"). */
export class SessionDto {
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(64)
  patientInputId: string;

  // YYYY-MM-DD
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  sessionDate: string;

  // HH:MM:SS
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/)
  sessionTime: string;
}
