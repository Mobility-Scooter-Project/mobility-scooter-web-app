import { HTTP_METHODS, USER_ROLES } from "@config/enums";
import { RoutePermissions } from "@infra/db/entity/user/route-permissions";
import db from "datasource";


const permissions: Partial<RoutePermissions>[] = [
    {
        route: "/api/v1/units/*/users/*",
        method: HTTP_METHODS.PUT,
        role: [USER_ROLES.ADMIN, USER_ROLES.LEAD]
    },
    {
        route: "/api/v1/units/*/users/*",
        method: HTTP_METHODS.DELETE,
        role: [USER_ROLES.ADMIN, USER_ROLES.LEAD]
    },
    {
        route: "/api/v1/units/*/users",
        method: HTTP_METHODS.GET,
        role: [USER_ROLES.ADMIN, USER_ROLES.LEAD, USER_ROLES.RESEARCHER, USER_ROLES.TRAINEE]
    },
    {
        route: "/api/v1/units/*/invite",
        method: HTTP_METHODS.POST,
        role: [USER_ROLES.ADMIN, USER_ROLES.LEAD]
    }
]

async function main() {
    try {
        await db.initialize();

        const permissionRepository = db.getRepository(RoutePermissions);

        await permissionRepository.upsert(permissions, { conflictPaths: ["route", "method", "role"] });
        console.log("Permissions upserted successfully.");
        await db.destroy();
    } catch (error) {
        console.error("Error during Data Source initialization:", error);
        throw new Error(`Seed failed: ${error}`);
    }
}

main();