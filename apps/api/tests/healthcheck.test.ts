const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000'
it('should return 200 OK', async () => {
  const response = await fetch(`${BASE_URL}/healthcheck`)

  expect(response.status).toBe(200)
})
