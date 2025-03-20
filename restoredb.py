import re

# Read the SQL file
with open('c:\\Users\\Elev\\Downloads\\s156544_divisionlogger-2025-03-12T16_34_28.521Z.sql', 'r') as file:
    sql_content = file.read()

# Replace the date format
fixed_sql_content = re.sub(r'&\{(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \+\d{4} UTC %!s\(bool=true\)\}', r'\1', sql_content)

# Write the fixed SQL content back to the file
with open('c:\\Users\\Elev\\Downloads\\s156544_divisionlogger-2025-03-12T16_34_28.521Z_fixed.sql', 'w') as file:
    file.write(fixed_sql_content)