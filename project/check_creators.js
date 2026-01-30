
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'data', 'localStorageData.json');

try {
    const data = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(data);

    // Look for any 'createdBy' fields or similar
    const schools = json.schools ? JSON.parse(json.schools) : [];
    const creators = new Set();
    schools.forEach(s => {
        if (s.createdBy) creators.add(s.createdBy);
    });

    console.log("Creators found:", Array.from(creators));

} catch (e) {
    console.error(e);
}
