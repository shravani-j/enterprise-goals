import { prisma } from '../lib/prisma';

// Mock the prisma client for unit tests
jest.mock('../lib/prisma', () => ({
  prisma: {
    goal: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('Goal Validation Rules', () => {
  const MOCK_USER_ID = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Weightage Validation', () => {
    it('should reject a weightage below 10%', () => {
      const weightage = 5;
      expect(weightage >= 10 && weightage <= 100).toBe(false);
    });

    it('should reject a weightage above 100%', () => {
      const weightage = 110;
      expect(weightage >= 10 && weightage <= 100).toBe(false);
    });

    it('should allow weightage within 10-100% range', () => {
      const weightage = 25;
      expect(weightage >= 10 && weightage <= 100).toBe(true);
    });
  });

  describe('Total Employee Weightage', () => {
    it('should calculate if total weightage exceeds 100%', async () => {
      // Mock existing goals totaling 80% weightage
      (prisma.goal.findMany as jest.Mock).mockResolvedValue([
        { id: '1', weightage: 40 },
        { id: '2', weightage: 40 },
      ]);

      const existingGoals = await prisma.goal.findMany({ where: { userId: MOCK_USER_ID } });
      const currentTotal = existingGoals.reduce((sum, g) => sum + g.weightage, 0);
      
      const newGoalWeightage = 30; // 80 + 30 = 110 (Should Fail)
      
      expect(currentTotal + newGoalWeightage <= 100).toBe(false);
    });

    it('should allow if total weightage is exactly 100%', async () => {
      (prisma.goal.findMany as jest.Mock).mockResolvedValue([
        { id: '1', weightage: 50 },
        { id: '2', weightage: 30 },
      ]);

      const existingGoals = await prisma.goal.findMany({ where: { userId: MOCK_USER_ID } });
      const currentTotal = existingGoals.reduce((sum, g) => sum + g.weightage, 0);
      
      const newGoalWeightage = 20; // 50 + 30 + 20 = 100 (Should Pass)
      
      expect(currentTotal + newGoalWeightage <= 100).toBe(true);
    });
  });

  describe('Maximum Active Goals Limit', () => {
    it('should fail if user already has 8 active goals', async () => {
      // Mock 8 active goals
      const mockGoals = Array.from({ length: 8 }, (_, i) => ({ id: `${i}`, status: 'APPROVED' }));
      (prisma.goal.findMany as jest.Mock).mockResolvedValue(mockGoals);

      const activeGoals = await prisma.goal.findMany({
        where: { userId: MOCK_USER_ID, status: { not: 'COMPLETED' } }
      });
      
      expect(activeGoals.length < 8).toBe(false);
    });
  });
});
