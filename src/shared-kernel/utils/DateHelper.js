/**
 * DateHelper - Utility class for date operations
 */
export default class DateHelper {
  /**
   * Get date range for the last week (7 days)
   * @returns {Object} { start, end }
   */
  static getWeekRange() {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    
    const start = new Date();
    start.setDate(start.getDate() - 6); // 7 days including today
    start.setHours(0, 0, 0, 0);
    
    return { start, end };
  }

  /**
   * Get date range for today
   * @returns {Object} { start, end }
   */
  static getTodayRange() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }

  /**
   * Get date range for yesterday
   * @returns {Object} { start, end }
   */
  static getYesterdayRange() {
    const start = new Date();
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date();
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }

  /**
   * Parse date range from strings
   * @param {string} startDate 
   * @param {string} endDate 
   * @returns {Object} { start, end }
   */
  static parseDateRange(startDate, endDate) {
    if (!startDate || !endDate) {
      throw new Error("Vui lòng cung cấp startDate và endDate");
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (start > end) {
      throw new Error("startDate phải nhỏ hơn hoặc bằng endDate");
    }

    return { start, end };
  }

  /**
   * Get difference in days between two dates
   * @param {Date} start 
   * @param {Date} end 
   * @returns {number}
   */
  static getDaysDifference(start, end) {
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Format date to YYYY-MM-DD
   * @param {Date} date 
   * @returns {string}
   */
  static formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

