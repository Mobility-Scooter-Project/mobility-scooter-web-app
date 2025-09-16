import * as unitRepo from "../repositories/unitRepository";

export async function createUnit(tenantId: string, name: string) {
  return await unitRepo.createUnit(tenantId, name);
}

export async function updateUnit(unitId: number, data: { name?: string }) {
  return await unitRepo.updateUnit(unitId, data);
}

export async function getUnitsByTenant(tenantId: string) {
  return await unitRepo.getUnitsByTenant(tenantId);
}

export async function getUnitById(unitId: number) {
  return await unitRepo.getUnitById(unitId);
}

export async function deleteUnit(unitId: number) {
  return await unitRepo.deleteUnit(unitId);
}

export async function addUserToUnit(unitId: number, userId: string) {
  return await unitRepo.addUserToUnit(unitId, userId);
}

export async function removeUserFromUnit(unitId: number, userId: string) {
  return await unitRepo.removeUserFromUnit(unitId, userId);
}

export async function getUsersInUnit(unitId: number) {
  return await unitRepo.getUsersInUnit(unitId);
}
