const {
  initializeDatabase,
  getConversationHistory,
  updateConversationHistory,
  summarizeConversation,
  countTokens
} = require('../conversationManager');

const { Pool } = require('pg');

jest.mock('pg', () => {
  const mQuery = jest.fn();
  const mPool = {
    query: mQuery,
    connect: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool), mQuery };
});

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => {
    return {
      chat: {
        completions: {
          create: jest.fn().mockImplementation(async () => {
            return { choices: [{ message: { content: "Summarized conversation" } }] };
          })
        }
      }
    };
  });
});

const OpenAI = require('openai');

jest.mock('@dqbd/tiktoken', () => {
  return {
    encoding_for_model: jest.fn().mockImplementation(() => {
      return {
        encode: jest.fn().mockImplementation((text) => {
          // Mock the behavior of the tokenization
          // For simplicity, let's say each word is a token
          return text.split(' ');
        }),
        free: jest.fn()
      };
    })
  };
});

beforeEach(() => {
  Pool.mockClear();
  Pool().query.mockClear();
  Pool().query.mockImplementation(() => Promise.resolve({ rows: [] })); // Default mock implementation
});


describe('conversationManager', () => {
  describe('initializeDatabase', () => {
    it('should initialize the database', async () => {
      Pool().query.mockResolvedValueOnce({});

      await initializeDatabase();

      expect(Pool().query).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS user_conversations'));
    });
  });

  describe('getConversationHistory', () => {
    it('should retrieve conversation history', async () => {
      const mockResult = { rows: [{ conversation_history: JSON.stringify([{ role: 'user', content: 'Hello' }]) }] };
      Pool().query.mockResolvedValueOnce(mockResult);

      const history = await getConversationHistory('whatsapp:+123456789');
      expect(history).toEqual([{ role: 'user', content: 'Hello' }]);
    });
  });

  describe('updateConversationHistory', () => {
    it('should update conversation history', async () => {
      Pool().query.mockResolvedValueOnce({});

      const whatsappNumber = 'whatsapp:+123456789';
      const conversationHistory = [{ role: 'user', content: 'Hello' }];

      await updateConversationHistory(whatsappNumber, conversationHistory);

      expect(Pool().query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_conversations'),
        [whatsappNumber, JSON.stringify(conversationHistory)]
      );
    });
  });

  describe('summarizeConversation', () => {
    it('should summarize the conversation', async () => {
      const conversationHistory = [{ role: 'user', content: 'Hello' }];
      OpenAI.mockImplementation(() => {
        return {
          chat: {
            completions: {
              create: jest.fn().mockResolvedValue({ choices: [{ message: { content: "Summarized conversation" } }] })
            }
          }
        };
      });

      const summary = await summarizeConversation(conversationHistory);

      expect(summary).toEqual([{ role: 'system', content: 'Summarized conversation' }]);
    });
  });

  describe('countTokens', () => {
    it('should count the tokens in a text', async () => {
      const text = 'Hello world';
      const expectedTokenCount = 2; // Mocked token count for the text

      const tokenCount = await countTokens(text);

      expect(tokenCount).toBe(expectedTokenCount);
    });
  });
});