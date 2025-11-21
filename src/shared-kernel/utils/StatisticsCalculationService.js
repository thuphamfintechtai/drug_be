/**
 * StatisticsCalculationService - Service for statistical calculations
 */
export default class StatisticsCalculationService {
  /**
   * Calculate today vs yesterday statistics
   * @param {number} todayCount 
   * @param {number} yesterdayCount 
   * @returns {Object} { diff, percentChange }
   */
  static calculateTodayYesterdayStats(todayCount, yesterdayCount) {
    const diff = todayCount - yesterdayCount;
    
    let percentChange = 0;
    if (yesterdayCount > 0) {
      percentChange = Math.round((diff / yesterdayCount) * 100 * 100) / 100;
    } else if (todayCount > 0) {
      percentChange = 100; // 100% increase from 0
    }

    return { diff, percentChange };
  }

  /**
   * Calculate average per day
   * @param {number} total 
   * @param {number} days 
   * @returns {number}
   */
  static calculateAveragePerDay(total, days) {
    if (days === 0) return 0;
    return Math.round((total / days) * 100) / 100;
  }

  /**
   * Calculate percentage
   * @param {number} part 
   * @param {number} total 
   * @returns {number}
   */
  static calculatePercentage(part, total) {
    if (total === 0) return 0;
    return Math.round((part / total) * 100 * 100) / 100;
  }

  /**
   * Calculate growth rate
   * @param {number} current 
   * @param {number} previous 
   * @returns {number}
   */
  static calculateGrowthRate(current, previous) {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100 * 100) / 100;
  }

  /**
   * Calculate summary statistics
   * @param {Array} numbers 
   * @returns {Object} { min, max, avg, sum, count }
   */
  static calculateSummary(numbers) {
    if (!numbers || numbers.length === 0) {
      return { min: 0, max: 0, avg: 0, sum: 0, count: 0 };
    }

    const sum = numbers.reduce((acc, num) => acc + num, 0);
    const count = numbers.length;
    const avg = Math.round((sum / count) * 100) / 100;
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);

    return { min, max, avg, sum, count };
  }
}

