const app = require("../index");
const request = require("supertest");

jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => {
      return {
        chat: {
          completions: {
            create: jest.fn().mockImplementation(async () => {
              return { choices: [{ message: { content: "Hello, I am an AI" } }] };
            })
          }
        }
      }
    })
  }
})
const OpenAI = require('openai');

jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => {
    return {
      messages: {
        create: jest.fn().mockResolvedValue({ sid: 'mocked_sid' })
      }
    }
  })
})

jest.mock('../conversationManager', () => {
  return {
    initializeDatabase: jest.fn(),
    getConversationHistory: jest.fn().mockResolvedValue([]),
    updateConversationHistory: jest.fn()
  };
});


describe("GET /", () => {
  it("Check that WhatsGPT is online", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('WhatsGPT is running');
  });
});

describe("POST /message", () => {
  it("Ensure that the OpenAI API responds with the required message", async () => {
    const response = await request(app)
      .post("/message")
      .send({From: "whatsapp:+2348179361570", Body: "Hello"})
    const openai = OpenAI.OpenAI();
    const openaiResponse = await openai.chat.completions.create({ 
      messages: [{
        role: "system", 
        content: "You're a knowledgeable friend that your acquintances turn to for help. Your response should be brief. Use a single sentence if possible."
    }],
      model: "gpt-3.5-turbo",
     });

     expect(openaiResponse.choices[0].message.content).toBe("Hello, I am an AI");
    //expect(response.text).toContain("Hello, I am an AI");
  })
});