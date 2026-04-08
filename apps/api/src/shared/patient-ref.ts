import { Patient } from '@infra/db/entity/unit/patient';
import { Repository } from 'typeorm';

type PatientRefSelect = {
  uuid: true;
  unit: { id: true };
  patientId: true;
};

const patientRefSelect: PatientRefSelect = {
  uuid: true,
  unit: { id: true },
  patientId: true,
};

/** Find a patient by internal UUID or by unit + patientId.
 * @param patientRepository - The repository to use to find the patient.
 * @param unitId - The ID of the unit to find the patient in.
 * @param patientId - The ID of the patient to find.
 * @returns The patient if found, otherwise null.
 */
export async function findPatientByRef(
  patientRepository: Repository<Patient>,
  unitId: string,
  patientId: string,
): Promise<Patient | null> {
  const ref = patientId.trim();
  return patientRepository.findOne({
    where: { unit: { id: unitId }, patientId: ref },
    relations: { unit: true },
    select: patientRefSelect,
  });
}
