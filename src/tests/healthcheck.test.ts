import { testClient } from "hono/testing";
import { app } from "..";

const headers = {
  Authorization: `Bearer ${process.env.TESTING_API_KEY}`,
};


it("should return 200 OK", async () => {
  const response = await testClient(app).healthcheck.$get();

  expect(response.status).toBe(200);
});
