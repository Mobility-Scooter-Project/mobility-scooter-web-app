import { Controller, Delete, Get, Param, Patch, Put } from '@nestjs/common';

@Controller('units')
export class UnitsController {
  @Put(':unitId')
  async updateUnit() {
    // TODO
  }

  @Delete(':unitId')
  async softDeleteUnit() {
    // TODO
  }
}
