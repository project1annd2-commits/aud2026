import fs from 'fs';
import path from 'path';

// Function to parse SQL INSERT statement and extract data
function parseInsertStatement(sql) {
  console.log('Parsing SQL:', sql.substring(0, 200) + '...');

  // Extract table name
  const tableMatch = sql.match(/INSERT INTO "public"\."([^"]+)"/);
  if (!tableMatch) {
    console.log('No table match found');
    return null;
  }

  const tableName = tableMatch[1];
  console.log('Table name:', tableName);

  // Extract column names
  const columnsMatch = sql.match(/\("([^"]+(?:","[^"]+)*)"\)/);
  if (!columnsMatch) {
    console.log('No columns match found, trying alternative pattern');
    // Try alternative pattern
    const altMatch = sql.match(/INSERT INTO "public"\."[^"]+"\s*\(([^)]+)\)/);
    if (!altMatch) {
      console.log('Alternative pattern also failed');
      return null;
    }
    const columns = altMatch[1].split(',').map(col => col.trim().replace(/"/g, ''));
    console.log('Columns (alt):', columns);
    return { tableName, columns, valuesStr: sql.match(/VALUES\s*\(([\s\S]*?)\);?$/)[1] };
  }

  const columns = columnsMatch[1].split('","');
  console.log('Columns:', columns);

  // Extract values - handle the entire VALUES block
  const valuesMatch = sql.match(/VALUES\s*\(([\s\S]*?)\);?$/);
  if (!valuesMatch) {
    console.log('No values match found');
    return null;
  }

  const valuesStr = valuesMatch[1];
  console.log('Values string length:', valuesStr.length);

  // Parse the values - split by ),( to get individual records
  const recordStrings = valuesStr.split(/\),\s*\(/);
  console.log('Number of record strings:', recordStrings.length);

  const records = recordStrings.map((recordStr, index) => {
    console.log(`Processing record ${index + 1}:`, recordStr.substring(0, 100) + '...');

    // Clean up the record string
    let cleanRecord = recordStr.replace(/^\s*\(/, '').replace(/\)\s*$/, '');

    // Split by comma, but be careful with commas inside strings and JSON
    const values = [];
    let currentValue = '';
    let inString = false;
    let braceCount = 0;
    let bracketCount = 0;

    for (let i = 0; i < cleanRecord.length; i++) {
      const char = cleanRecord[i];

      if (char === "'" && (i === 0 || cleanRecord[i-1] !== '\\')) {
        inString = !inString;
      }

      if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (char === '[') bracketCount++;
        if (char === ']') bracketCount--;
      }

      if (char === ',' && !inString && braceCount === 0 && bracketCount === 0) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }

    if (currentValue.trim()) {
      values.push(currentValue.trim());
    }

    console.log(`Record ${index + 1} has ${values.length} values, expected ${columns.length}`);

    const record = {};

    if (values.length === columns.length) {
      columns.forEach((col, index) => {
        let value = values[index];

        // Remove surrounding quotes if present
        if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
          // Unescape single quotes
          value = value.replace(/''/g, "'");
        }

        // Try to parse as JSON if it looks like JSON
        if ((value.startsWith('{') && value.endsWith('}')) ||
            (value.startsWith('[') && value.endsWith(']'))) {
          try {
            record[col] = JSON.parse(value);
          } catch (e) {
            console.log(`Failed to parse JSON for ${col}:`, value);
            record[col] = value;
          }
        } else {
          record[col] = value;
        }
      });
    }

    return record;
  });

  console.log(`Parsed ${records.length} records`);
  return { tableName, records };
}

// Function to parse multiple INSERT statements
function parseMultipleInserts(sql) {
  // The SQL files contain single INSERT statements, not multiple
  const parsed = parseInsertStatement(sql);
  const result = {};

  if (parsed) {
    result[parsed.tableName] = parsed.records;
  }

  return result;
}

// Main function
function main() {
  const files = [
    { sqlFile: 'schools_rows.sql', jsonFile: 'schools.json' },
    { sqlFile: 'teachers_rows.sql', jsonFile: 'teachers.json' },
    { sqlFile: 'mentors_rows.sql', jsonFile: 'mentors.json' },
    { sqlFile: 'audits_rows.sql', jsonFile: 'audits.json' },
    { sqlFile: 'infrastructure_audits_rows.sql', jsonFile: 'infrastructure_audits.json' }
  ];

  files.forEach(({ sqlFile, jsonFile }) => {
    try {
      console.log(`Processing ${sqlFile}...`);

      const sqlContent = fs.readFileSync(sqlFile, 'utf8');
      const parsedData = parseMultipleInserts(sqlContent);

      // Get the table name from the file
      const tableName = sqlFile.replace('_rows.sql', '');

      if (parsedData[tableName]) {
        const outputPath = path.join('extracted_data', jsonFile);
        fs.writeFileSync(outputPath, JSON.stringify(parsedData[tableName], null, 2));
        console.log(`Saved ${parsedData[tableName].length} records to ${outputPath}`);
      } else {
        console.log(`No data found for table ${tableName}`);
      }
    } catch (error) {
      console.error(`Error processing ${sqlFile}:`, error.message);
    }
  });
}

main();