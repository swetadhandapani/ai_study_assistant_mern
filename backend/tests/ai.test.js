// ------------------- MOCKS -------------------

// Skip authentication and mock logged-in user
jest.mock("../middleware/authMiddleware", () => ({
  protect: (req, res, next) => {
    req.user = { _id: "test-user-id" };
    next();
  },
}));

// Mock AI controller functions
jest.mock("../controllers/aiController", () => ({
  generateMaterials: jest.fn(async (req, res) => res.json({ success: true })),
  getStudyMaterial: jest.fn(async (req, res) => res.json({ success: true })),
  askAboutNote: jest.fn(async (req, res) =>
    res.json({
      answer: `Pretend AI answer to: "${req.body.question}" based on this content: "Sample note text..."`,
    })
  ),
  generateMindmap: jest.fn(async (req, res) =>
    res.json({ mindmap: { nodes: [{ id: "1", label: "Main" }], edges: [] } })
  ),
  generateMarkdown: jest.fn(async (req, res) =>
    res.json({ markdown: "# Dummy Markdown\n- Point 1\n- Point 2" })
  ),
}));

// ------------------- SETUP -------------------
const request = require("supertest");
const { app } = require("../server");
const mongoose = require("mongoose");

describe("AI Endpoints", () => {
  // Test: Ask-AI
  it("POST /api/ai/ask -> should return AI answer", async () => {
    const res = await request(app)
      .post("/api/ai/ask")
      .send({ noteId: "test-note-id", question: "Hello AI?" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("answer");
    expect(res.body.answer).toContain("Pretend AI answer");
  });

  // Test: Generate Materials
  it("POST /api/ai/generate -> should return success", async () => {
    const res = await request(app)
      .post("/api/ai/generate")
      .send({ noteId: "test-note-id", actions: ["summary"] });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
  });

  // Test: Get Study Material
  it("GET /api/ai/material/:noteId -> should return study material", async () => {
    const res = await request(app).get("/api/ai/material/test-note-id");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
  });

  // Test: Generate Mindmap
  it("POST /api/ai/mindmap/:noteId -> should return mindmap", async () => {
    const res = await request(app).post("/api/ai/mindmap/test-note-id");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("mindmap");
    expect(res.body.mindmap).toHaveProperty("nodes");
    expect(res.body.mindmap).toHaveProperty("edges");
  });

  // Test: Generate Markdown
  it("POST /api/ai/markdown/:noteId -> should return markdown", async () => {
    const res = await request(app).post("/api/ai/markdown/test-note-id");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("markdown");
    expect(res.body.markdown).toContain("# Dummy Markdown");
  });
});

// ------------------- TEARDOWN -------------------
afterAll(async () => {
  await mongoose.connection.close();
});
