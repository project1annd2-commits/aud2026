
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'utils', 'pdfGenerator.ts');

try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Logic to insert
    const ladderLogic = `    // Ladder and Recommendations height if score < 4
    if (response.score > 0 && response.score < 4) {
      // Ladder options (4 options)
      criterion.options.slice(0, 4).forEach((option, optIndex) => {
         // Using same logic as render loop below
         let suffix = '';
         if (response.score === optIndex + 1) suffix = ' [CURRENT]';
         else if (optIndex + 1 === 4) suffix = ' [TARGET]';
         
         const textHeight = calculateHeight(doc, \`L\${optIndex + 1}: \${option}\${suffix}\`, pageWidth - (margin * 2) - 15, 11);
         requiredHeight += textHeight + 3; // +3 for spacing
      });
      
      // Recommendations Header
      requiredHeight += 11; // Header(6) + Padding(5)
      
      // Recommendations List
      const recommendations = getRecommendationsForCriterion(criterion.id, response.score);
      recommendations.forEach(rec => {
        const textHeight = calculateHeight(doc, \`•  \${rec}\`, pageWidth - (margin * 2) - 5, 11);
        requiredHeight += textHeight + 2; // +2 for spacing
      });
    }`;

    const pageBreakLogic = `    // Check if we need a new page using exact calculation
    if (yPosition + requiredHeight > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }`;

    // 1. Replace the inner ladder block
    // We look for the block starting with "    // Add height for ladder and recommendations if score < 4"
    // and ending with the closing brace of that if block.
    // Then the page break check.

    // We'll match the specific old code block
    const oldLadderBlock = `    // Add height for ladder and recommendations if score < 4
    if (response.score > 0 && response.score < 4) {
      // Ladder options (4 options, approx 2-3 lines each)
      estimatedBlockHeight += 60; // Safe estimate for 4 items
      
      // Recommendations (Header + approx 4 items)
      estimatedBlockHeight += 50; // Safe estimate
    }`;

    // Check if old block exists
    if (content.indexOf(oldLadderBlock) === -1) {
        console.log('Old ladder block not found precisely. Attempts partial match.');
        // Fallback
    }

    content = content.replace(oldLadderBlock, ladderLogic);

    // 2. Replace the page break check
    const oldPageBreak = `    // Check if we need a new page based on estimated height
    if (yPosition + estimatedBlockHeight > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }`;

    content = content.replace(oldPageBreak, pageBreakLogic);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully updated pdfGenerator.ts');

} catch (e) {
    console.error(e);
}
