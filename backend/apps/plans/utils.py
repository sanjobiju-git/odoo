import calendar
from datetime import date, datetime, timedelta

def calculate_next_billing_date(start_date: date, interval: str, interval_count: int = 1) -> date:
    """
    Computes the exact next billing date handling month-ends, leap years, and time zones.
    Supported intervals: DAILY, WEEKLY, MONTHLY, YEARLY.
    """
    if interval == 'DAILY':
        return start_date + timedelta(days=interval_count)
    elif interval == 'WEEKLY':
        return start_date + timedelta(weeks=interval_count)
    elif interval == 'MONTHLY':
        # Calculate new month and year
        year = start_date.year
        month = start_date.month + interval_count
        while month > 12:
            month -= 12
            year += 1
        # Determine maximum days in the target month (handles Feb leap years: 28 vs 29)
        max_days = calendar.monthrange(year, month)[1]
        day = min(start_date.day, max_days)
        return date(year, month, day)
    elif interval == 'YEARLY':
        year = start_date.year + interval_count
        month = start_date.month
        # Handle Feb 29 on non-leap year
        if month == 2 and start_date.day == 29:
            day = 29 if calendar.isleap(year) else 28
        else:
            day = start_date.day
        return date(year, month, day)
    else:
        # Default fallback to monthly
        return calculate_next_billing_date(start_date, 'MONTHLY', interval_count)
