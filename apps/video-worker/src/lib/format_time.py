def format_time(td):
    """
    Formats a timedelta object as a string in HH:MM:SS.mmm format.
    """
    seconds = int(td.total_seconds())
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    seconds = seconds % 60
    milliseconds = td.microseconds // 1000

    return f"{hours:02}:{minutes:02}:{seconds:02}.{milliseconds:03}"
