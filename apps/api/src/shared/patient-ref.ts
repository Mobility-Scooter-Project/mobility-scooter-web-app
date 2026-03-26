import { Patient } from '@infra/db/entity/unit/patient';
import { Repository } from 'typeorm';

type PatientRefSelect = {
  id: true;
  unit: { id: true };
  patientInputId: true;
};

const patientRefSelect: PatientRefSelect = {
  id: true,
  unit: { id: true },
  patientInputId: true,
};

/** Find a patient by internal UUID or by unit + patientInputId.
 * @param patientRepository - The repository to use to find the patient.
 * @param unitId - The ID of the unit to find the patient in.
 * @param patientInputId - The ID of the patient to find.
 * @returns The patient if found, otherwise null.
 */
export async function findPatientByRef(
  patientRepository: Repository<Patient>,
  unitId: string,
  patientInputId: string,
): Promise<Patient | null> {
  const ref = patientInputId.trim();
  return patientRepository.findOne({
    where: { unit: { id: unitId }, patientInputId: ref },
    relations: { unit: true },
    select: patientRefSelect,
  });
}
