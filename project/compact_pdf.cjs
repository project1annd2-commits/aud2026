
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'utils', 'pdfGenerator.ts');

try {
    let content = fs.readFileSync(filePath, 'utf8');

    // We need to replace the entire block inside `currentVersion.responses.forEach` 
    // starting roughly from "    // Check if we need a new page" down to "    yPosition += 5; // Bottom padding inside box"

    // Since matching large blocks is fragile, let's try to match from "    // Check if we need a new page" 
    // and cut until the end of the loop iteration.

    // The start marker:
    const startMarker = "    // Check if we need a new page";
    const endMarker = "    yPosition += 5; // Bottom padding inside box";

    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);

    if (startIndex === -1 || endIndex === -1) {
        console.log("Could not find start or end markers.");
        process.exit(1);
    }

    // New Compact Logic
    const newLogic = `    // Check if we need a new page
    // Calculate exact height needed for this block
    let requiredHeight = 25; // Header(10) + Response(5) + Interpretation(5) + Padding(5) - Reduced
    
    // Response text height
    requiredHeight += calculateHeight(doc, \`Response: \${response.selectedOption}\`, pageWidth - (margin * 2), 10);
    
    // Comment height
    if (response.comment) {
      requiredHeight += calculateHeight(doc, \`Note: \${response.comment}\`, pageWidth - (margin * 2), 10) + 1; 
    }
    
    // Ladder and Recommendations height if score < 4
    if (response.score > 0 && response.score < 4) {
      // Ladder options (4 options)
      criterion.options.slice(0, 4).forEach((option, optIndex) => {
         let suffix = '';
         if (response.score === optIndex + 1) suffix = ' [CURRENT]';
         else if (optIndex + 1 === 4) suffix = ' [TARGET]';
         
         const textHeight = calculateHeight(doc, \`L\${optIndex + 1}: \${option}\${suffix}\`, pageWidth - (margin * 2) - 15, 9);
         requiredHeight += textHeight + 2; // +2 for spacing - Reduced
      });
      
      // Recommendations Header
      requiredHeight += 8; // Header(5) + Padding(3) - Reduced
      
      // Recommendations List
      const recommendations = getRecommendationsForCriterion(criterion.id, response.score);
      recommendations.forEach(rec => {
        const textHeight = calculateHeight(doc, \`•  \${rec}\`, pageWidth - (margin * 2) - 5, 9);
        requiredHeight += textHeight + 1; // +1 for spacing - Reduced
      });
    }

    // Check if we need a new page using exact calculation
    if (yPosition + requiredHeight > pageHeight - 15) {
      doc.addPage();
      yPosition = 15;
    }

    const boxStartY = yPosition - 4; // Start box slightly above header

    // Highlighted Header Background
    doc.setFillColor(240, 247, 255); // Very light blue
    doc.setDrawColor(200, 220, 255);
    doc.rect(margin - 5, yPosition - 2, pageWidth - (margin * 2) + 10, 8, 'F'); // REDUCED HEIGHT 10->8

    // Question number and title
    doc.setFontSize(12); // REDUCED 15->12
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(\`\${index + 1}. \${criterion.label}\`, margin, yPosition + 4); // Adjusted Y

    // Score Indicator in header (Right aligned)
    const percentage = response.score / 4;
    let scoreColor = [244, 67, 54]; // Red
    if (percentage === 1) scoreColor = [27, 94, 32]; // Dark Green (Score 4)
    else if (percentage >= 0.75) scoreColor = [33, 150, 243]; // Blue (Score 3)
    else if (percentage >= 0.5) scoreColor = [255, 143, 0]; // Amber

    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.setFontSize(11); // REDUCED 14->11
    const scoreText = \`Score: \${response.score}/4\`;
    const scoreTextWidth = doc.getTextWidth(scoreText);
    doc.text(scoreText, pageWidth - margin - scoreTextWidth, yPosition + 4);
    doc.setTextColor(0, 0, 0);

    yPosition += 10; // REDUCED 15->10

    // Current response
    doc.setFontSize(10); // REDUCED 12->10
    doc.setFont('helvetica', 'normal');
    yPosition = addWrappedText(doc, \`Response: \${response.selectedOption}\`, margin, yPosition, pageWidth - (margin * 2), 10);

    // Add comment if present
    if (response.comment) {
      yPosition += 1;
      doc.setFont('helvetica', 'italic');
      yPosition = addWrappedText(doc, \`Note: \${response.comment}\`, margin, yPosition, pageWidth - (margin * 2), 10);
      doc.setFont('helvetica', 'normal');
    }

    yPosition += 2; // REDUCED 4->2

    // Score interpretation line
    doc.setFont('helvetica', 'bold');
    let interpText = '';
    if (response.score === 0) interpText = 'Not Applicable';
    else if (response.score >= 3) interpText = 'Good Performance';
    else if (response.score >= 2) interpText = 'Needs Attention';
    else interpText = 'Requires Improvement';

    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    yPosition = addWrappedText(doc, interpText, margin, yPosition, pageWidth - (margin * 2), 10);
    doc.setTextColor(0, 0, 0);

    // Add Improvement Ladder and Recommendations if score < 4
    if (response.score > 0 && response.score < 4) {
      yPosition += 4; // REDUCED 8->4

      const colors = [
        [211, 47, 47],   // Score 1: Red
        [255, 143, 0],   // Score 2: Amber
        [33, 150, 243],  // Score 3: Blue
        [27, 94, 32]     // Score 4: Dark Green
      ];

      criterion.options.slice(0, 4).forEach((option, optIndex) => {
        const score = optIndex + 1;
        const isCurrent = response.score === score;
        const isTarget = score === 4;
        const color = colors[optIndex];

        const markerX = margin + 2;
        const markerY = yPosition - 1.5;

        doc.setDrawColor(color[0], color[1], color[2]);
        doc.setLineWidth(0.5);
        let suffix = '';

        if (isCurrent) {
          doc.setFillColor(color[0], color[1], color[2]);
          doc.circle(markerX, markerY, 2.5, 'FD'); // Reduced circle size
          doc.setFont('helvetica', 'bold');
          suffix = ' [CURRENT]';
        } else if (isTarget) {
          doc.setLineWidth(1);
          doc.circle(markerX, markerY, 2.5, 'D');
          doc.setFont('helvetica', 'bold');
          suffix = ' [TARGET]';
        } else {
          doc.circle(markerX, markerY, 2.5, 'D');
          doc.setFont('helvetica', 'normal');
        }

        const textX = margin + 10;
        doc.setFontSize(9); // REDUCED 11->9
        doc.setTextColor(isCurrent || isTarget ? 0 : 60, isCurrent || isTarget ? 0 : 60, isCurrent || isTarget ? 0 : 60);

        // Render text
        const splitText = doc.splitTextToSize(\`L\${score}: \${option}\${suffix}\`, pageWidth - (margin * 2) - 15);
        doc.text(splitText, textX, yPosition);
        yPosition += (splitText.length * 5 * 0.8) + 2; // REDUCED Spacing
      });

      // Recommendations
      yPosition += 4; // REDUCED 5->4
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10); // REDUCED 12->10
      doc.setTextColor(25, 118, 210);
      doc.text('Actionable Steps:', margin, yPosition);
      yPosition += 5; // REDUCED 6->5

      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9); // REDUCED 11->9
      const recommendations = getRecommendationsForCriterion(criterion.id, response.score);
      recommendations.forEach(rec => {
        const bulletLines = doc.splitTextToSize(\`•  \${rec}\`, pageWidth - (margin * 2) - 5);
        doc.text(bulletLines, margin + 2, yPosition);
        yPosition += (bulletLines.length * 5 * 0.8) + 1; // REDUCED Spacing
      });
    }`;

    // Combine substrings
    const before = content.substring(0, startIndex);
    const after = content.substring(endIndex);

    const finalContent = before + newLogic + after;

    fs.writeFileSync(filePath, finalContent, 'utf8');
    console.log('Successfully applied compact layout logic');

} catch (e) {
    console.error(e);
}
