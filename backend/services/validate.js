const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Validate that a date range is well-formed and start <= end. */
function validateDateRange(startDate, endDate) {
  if (!startDate || !endDate || !DATE_REGEX.test(startDate) || !DATE_REGEX.test(endDate)) {
    return "Dates must be provided in YYYY-MM-DD format.";
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "One or both dates are not valid calendar dates.";
  }
  if (start > end) {
    return "The start date must be on or before the end date.";
  }
  // Open-Meteo's free forecast endpoint only reliably covers ~16 days ahead.
  const maxFuture = new Date();
  maxFuture.setDate(maxFuture.getDate() + 16);
  if (end > maxFuture) {
    return "End date can be at most 16 days in the future (free forecast API limit).";
  }
  // Keep ranges reasonable so a single request doesn't hammer the free API.
  const spanDays = (end - start) / (1000 * 60 * 60 * 24);
  if (spanDays > 92) {
    return "Date range is too large. Please choose a range of 92 days or fewer.";
  }
  return null; // valid
}

module.exports = { validateDateRange, DATE_REGEX };
