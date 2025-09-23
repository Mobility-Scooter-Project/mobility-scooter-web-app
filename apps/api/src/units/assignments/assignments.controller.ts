import { Controller, Get, Put } from '@nestjs/common';

@Controller('units/:unitId/assignments')
export class AssignmentsController {
    @Get()
    getAllAssignments() {
        // TODO
    }

    @Put(':assignmentId/keypoints/:frameId')
    updateKeypoints() {
        // TODO
    }

    @Put(':assignmentId/labels')
    updateLabels() {
        // TODO
    }
}
