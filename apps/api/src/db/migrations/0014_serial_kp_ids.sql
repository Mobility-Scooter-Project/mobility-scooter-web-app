ALTER TABLE "storage"."keypoints" DROP COLUMN "id";
ALTER TABLE "storage"."keypoints" ADD COLUMN "id" SERIAL PRIMARY KEY;