import fs from 'fs';
import path from 'path';

// Function to parse CSV and convert to JSON
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = [];
    let currentValue = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];

      if (char === '"') {
        if (inQuotes && line[j + 1] === '"') {
          // Escaped quote
          currentValue += '"';
          j++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }

    // Add the last field
    values.push(currentValue.trim());

    const record = {};
    headers.forEach((header, index) => {
      let value = values[index] || '';

      // Remove surrounding quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }

      record[header] = value;
    });

    records.push(record);
  }

  return records;
}

// Main function
function main() {
  const files = [
    { csvFile: 'schools_rows.csv', jsonFile: 'schools.json' },
    { csvFile: 'teachers_rows.csv', jsonFile: 'teachers.json' },
    { csvFile: 'mentors_rows.csv', jsonFile: 'mentors.json' },
    { csvFile: 'audits_rows.csv', jsonFile: 'audits.json' },
    { csvFile: 'infrastructure_audits_rows.csv', jsonFile: 'infrastructure_audits.json' },
    // Additional files with (1) in their names
    { csvFile: 'schools_rows (1).csv', jsonFile: 'schools_additional.json' },
    { csvFile: 'teachers_rows (1).csv', jsonFile: 'teachers_additional.json' },
    { csvFile: 'mentors_rows (1).csv', jsonFile: 'mentors_additional.json' },
    { csvFile: 'audits_rows (1).csv', jsonFile: 'audits_additional.json' },
    { csvFile: 'infrastructure_audits_rows (1).csv', jsonFile: 'infrastructure_audits_additional.json' }
  ];

  files.forEach(({ csvFile, jsonFile }) => {
    try {
      if (fs.existsSync(csvFile)) {
        console.log(`Processing ${csvFile}...`);
        
        const csvContent = fs.readFileSync(csvFile, 'utf8');
        const records = parseCSV(csvContent);
        
        const outputPath = path.join('extracted_data', jsonFile);
        fs.writeFileSync(outputPath, JSON.stringify(records, null, 2));
        console.log(`Saved ${records.length} records to ${outputPath}`);
      } else {
        console.log(`File ${csvFile} not found, skipping...`);
      }
    } catch (error) {
      console.error(`Error processing ${csvFile}:`, error.message);
    }
  });
}

main();