const request = require("supertest");
const app = require("../app/app");


describe("Authentication Tests", () => {
  it("should load login page", async () => {
    const res = await request(app).get("/auth/login");
    expect(res.statusCode).toBe(200);
  });

  it("should not login with wrong credentials", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "wrong@mail.com", password: "wrong" });

    expect(res.statusCode).toBe(400);
  });
});
