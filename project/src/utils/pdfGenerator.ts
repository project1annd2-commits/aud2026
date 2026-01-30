import jsPDF from 'jspdf';
import { Audit, InfrastructureAudit } from '../types';
import { storage } from './storage';
import { formatDate, calculatePercentage, calculateAdjustedScore, getEmployeeDisplayName } from './helpers';
import { teacherAuditCriteria, mentorAuditCriteria, infrastructureAuditCriteria } from '../data/auditCriteria';

// Helper function to get specific recommendations for each criterion based on current score
const getRecommendationsForCriterion = (criterionId: string, currentScore: number): string[] => {
  const recommendations: Record<string, Record<number, string[]>> = {
    // Teacher Audit Criteria Recommendations
    'lesson_planning': {
      1: [
        'Develop detailed lesson plans with clear learning objectives for each class',
        'Include time allocations for different activities in your lesson plans',
        'Create assessment strategies aligned with learning objectives',
        'Seek mentoring from experienced teachers on lesson planning'
      ],
      2: [
        'Enhance lesson plan structure with more detailed activity descriptions',
        'Include differentiation strategies for diverse learners',
        'Add formative assessment checkpoints throughout lessons',
        'Incorporate varied instructional materials and resources'
      ],
      3: [
        'Refine assessment strategies with more detailed rubrics',
        'Include extension activities for advanced learners',
        'Add reflection components to evaluate lesson effectiveness',
        'Integrate technology tools to enhance learning experiences'
      ]
    },
    'subject_knowledge': {
      1: [
        'Review curriculum standards and subject matter requirements',
        'Participate in subject-specific professional development',
        'Collaborate with colleagues to deepen content understanding',
        'Use curriculum resources and textbooks effectively'
      ],
      2: [
        'Engage in continuous learning through workshops and courses',
        'Join professional learning communities in your subject area',
        'Practice explaining concepts in multiple ways',
        'Stay updated with current developments in your field'
      ],
      3: [
        'Share expertise with colleagues through mentoring',
        'Develop advanced instructional strategies for complex topics',
        'Create supplementary materials to support student learning',
        'Pursue advanced certification or coursework in your subject'
      ]
    },
    'teaching_methods': {
      1: [
        'Learn and implement varied teaching strategies beyond lectures',
        'Incorporate group work and collaborative learning activities',
        'Use visual aids and hands-on materials in instruction',
        'Observe effective teachers to learn new methods'
      ],
      2: [
        'Increase student engagement through interactive activities',
        'Implement formative assessment techniques during lessons',
        'Use technology tools to enhance instruction',
        'Differentiate instruction to meet diverse learning needs'
      ],
      3: [
        'Experiment with innovative teaching approaches',
        'Integrate project-based learning experiences',
        'Use data to inform instructional decisions',
        'Mentor other teachers on effective pedagogical strategies'
      ]
    },
    'classroom_management': {
      1: [
        'Establish clear classroom rules and expectations',
        'Develop consistent routines and procedures',
        'Learn de-escalation techniques for managing disruptions',
        'Seek support from mentors on classroom management strategies'
      ],
      2: [
        'Implement positive behavior reinforcement systems',
        'Use proximity and non-verbal cues effectively',
        'Develop transition strategies between activities',
        'Create a positive classroom culture'
      ],
      3: [
        'Refine proactive management techniques',
        'Develop restorative practices for conflict resolution',
        'Create systems for student self-regulation',
        'Share successful strategies with colleagues'
      ]
    },
    'student_interaction': {
      1: [
        'Practice active listening skills with students',
        'Use positive language and encouraging feedback',
        'Learn culturally responsive communication strategies',
        'Create opportunities for student voice and choice'
      ],
      2: [
        'Provide specific, constructive feedback to students',
        'Use questioning techniques to promote critical thinking',
        'Build positive relationships with all students',
        'Implement peer collaboration strategies'
      ],
      3: [
        'Foster a supportive learning environment',
        'Use advanced questioning techniques to deepen understanding',
        'Provide personalized feedback based on individual needs',
        'Model effective communication skills'
      ]
    },
    'assessment_feedback': {
      1: [
        'Develop clear assessment criteria and rubrics',
        'Provide timely feedback to students',
        'Use multiple assessment methods',
        'Align assessments with learning objectives'
      ],
      2: [
        'Give specific, actionable feedback to students',
        'Use formative assessment to guide instruction',
        'Provide opportunities for student self-assessment',
        'Track student progress over time'
      ],
      3: [
        'Design comprehensive assessment strategies',
        'Provide detailed feedback that promotes growth',
        'Use assessment data to differentiate instruction',
        'Share assessment practices with colleagues'
      ]
    },
    'technology_integration': {
      1: [
        'Learn basic educational technology tools',
        'Explore digital resources aligned with curriculum',
        'Attend technology training sessions',
        'Start with simple tools and gradually increase complexity'
      ],
      2: [
        'Integrate technology to enhance learning experiences',
        'Use digital tools for assessment and feedback',
        'Explore collaborative platforms for student work',
        'Connect with other educators through online communities'
      ],
      3: [
        'Transform learning through innovative technology use',
        'Design technology-rich learning experiences',
        'Mentor colleagues on effective technology integration',
        'Stay current with emerging educational technologies'
      ]
    },
    'professional_development': {
      1: [
        'Identify professional learning goals',
        'Participate in school-based professional development',
        'Join professional organizations in your field',
        'Create a professional growth plan'
      ],
      2: [
        'Engage in ongoing professional learning',
        'Apply new learning to classroom practice',
        'Collaborate with colleagues on professional goals',
        'Document professional growth and achievements'
      ],
      3: [
        'Take leadership in professional learning initiatives',
        'Share expertise with colleagues',
        'Pursue advanced professional credentials',
        'Contribute to the broader educational community'
      ]
    },
    'collaboration': {
      1: [
        'Communicate regularly with colleagues',
        'Participate in team meetings and discussions',
        'Share resources and ideas with peers',
        'Seek input from colleagues on instructional decisions'
      ],
      2: [
        'Engage in collaborative planning and problem-solving',
        'Participate in professional learning communities',
        'Contribute to school improvement initiatives',
        'Support colleagues through mentoring and feedback'
      ],
      3: [
        'Take leadership in collaborative efforts',
        'Facilitate team meetings and discussions',
        'Mentor new teachers and colleagues',
        'Contribute to district or community initiatives'
      ]
    },
    'punctuality_attendance': {
      1: [
        'Establish consistent daily routines',
        'Plan ahead to ensure timely arrival',
        'Communicate proactively about absences or delays',
        'Prioritize professional responsibilities'
      ],
      2: [
        'Maintain excellent attendance records',
        'Arrive prepared and ready for the school day',
        'Model punctuality for students and colleagues',
        'Demonstrate reliability in all professional commitments'
      ],
      3: [
        'Consistently exceed attendance expectations',
        'Serve as a role model for punctuality',
        'Support colleagues in maintaining professional standards',
        'Take on additional responsibilities that require reliability'
      ]
    },
    // Mentor Audit Criteria Recommendations
    'mentoring_skills': {
      1: [
        'Develop foundational mentoring techniques',
        'Learn effective questioning and listening skills',
        'Study adult learning principles',
        'Observe experienced mentors in action'
      ],
      2: [
        'Refine mentoring approaches based on mentee needs',
        'Provide specific, actionable feedback',
        'Use goal-setting frameworks with mentees',
        'Document mentoring conversations and progress'
      ],
      3: [
        'Implement transformative mentoring strategies',
        'Support mentee leadership development',
        'Facilitate peer mentoring networks',
        'Contribute to mentoring program improvement'
      ]
    },
    'student_support': {
      1: [
        'Learn basic counseling and support techniques',
        'Understand referral processes for specialized support',
        'Develop active listening skills',
        'Create a safe, supportive environment for students'
      ],
      2: [
        'Implement systematic support procedures',
        'Develop follow-up strategies for at-risk students',
        'Collaborate with families and community resources',
        'Use data to identify student needs'
      ],
      3: [
        'Design comprehensive support systems',
        'Lead intervention and prevention programs',
        'Mentor colleagues on student support strategies',
        'Advocate for systemic improvements'
      ]
    },
    'program_coordination': {
      1: [
        'Learn basic organizational and planning skills',
        'Develop clear communication protocols',
        'Establish simple tracking systems',
        'Seek guidance from experienced coordinators'
      ],
      2: [
        'Implement efficient program management systems',
        'Use data to inform program decisions',
        'Coordinate effectively with stakeholders',
        'Develop contingency plans for challenges'
      ],
      3: [
        'Design innovative program solutions',
        'Lead organizational change initiatives',
        'Mentor others in program coordination',
        'Contribute to policy development'
      ]
    },
    'communication_skills': {
      1: [
        'Practice clear, respectful communication',
        'Learn conflict resolution techniques',
        'Develop active listening skills',
        'Seek feedback on communication effectiveness'
      ],
      2: [
        'Build strong, positive relationships',
        'Use communication to resolve conflicts',
        'Adapt communication style to different audiences',
        'Provide constructive feedback to others'
      ],
      3: [
        'Model exceptional communication skills',
        'Facilitate difficult conversations effectively',
        'Mentor others on communication strategies',
        'Lead communication training sessions'
      ]
    },
    'problem_solving': {
      1: [
        'Learn basic problem-solving frameworks',
        'Practice identifying root causes of issues',
        'Seek input from others when facing challenges',
        'Document problem-solving processes and outcomes'
      ],
      2: [
        'Use data to inform problem-solving decisions',
        'Implement systematic approaches to challenges',
        'Collaborate with others to find solutions',
        'Evaluate effectiveness of solutions'
      ],
      3: [
        'Design innovative, lasting solutions',
        'Lead complex problem-solving initiatives',
        'Mentor others in problem-solving approaches',
        'Contribute to systemic improvements'
      ]
    },
    'professional_knowledge': {
      1: [
        'Stay current with field developments',
        'Participate in relevant professional development',
        'Join professional organizations',
        'Read current research and best practices'
      ],
      2: [
        'Apply new knowledge to practice',
        'Share expertise with colleagues',
        'Engage in professional learning communities',
        'Document professional growth'
      ],
      3: [
        'Lead professional learning initiatives',
        'Contribute to field knowledge through research or publication',
        'Mentor others in professional development',
        'Serve in leadership roles in professional organizations'
      ]
    },
    'initiative_leadership': {
      1: [
        'Take on small leadership tasks',
        'Show initiative in school improvement efforts',
        'Volunteer for committees or projects',
        'Follow through on commitments'
      ],
      2: [
        'Lead small projects or initiatives',
        'Mentor new staff members',
        'Propose solutions to school challenges',
        'Model positive professional behaviors'
      ],
      3: [
        'Lead major school or district initiatives',
        'Inspire and motivate others to excel',
        'Drive systemic change and improvement',
        'Serve in formal leadership roles'
      ]
    },
    'record_keeping': {
      1: [
        'Establish organized filing systems',
        'Maintain accurate, up-to-date records',
        'Follow established documentation protocols',
        'Seek training on record-keeping best practices'
      ],
      2: [
        'Implement efficient documentation systems',
        'Use technology to streamline record-keeping',
        'Ensure compliance with legal and policy requirements',
        'Regularly review and update records'
      ],
      3: [
        'Design comprehensive documentation systems',
        'Lead training on record-keeping best practices',
        'Ensure quality and consistency across systems',
        'Contribute to policy development'
      ]
    },
    'parent_community_engagement': {
      1: [
        'Communicate regularly with families',
        'Welcome parent involvement in school activities',
        'Learn culturally responsive engagement strategies',
        'Create multiple communication channels'
      ],
      2: [
        'Develop meaningful partnerships with families',
        'Engage community resources in school programs',
        'Organize events that bring families together',
        'Use data to improve engagement strategies'
      ],
      3: [
        'Build strong community partnerships',
        'Lead initiatives that connect school with community',
        'Mentor others on engagement strategies',
        'Advocate for community-school connections'
      ]
    },
    'reliability_commitment': {
      1: [
        'Meet all professional commitments consistently',
        'Communicate proactively about challenges',
        'Take responsibility for outcomes',
        'Seek feedback on performance'
      ],
      2: [
        'Exceed expectations in all responsibilities',
        'Support colleagues and team goals',
        'Demonstrate unwavering commitment to excellence',
        'Model professionalism for others'
      ],
      3: [
        'Serve as a role model for reliability',
        'Take on additional responsibilities',
        'Mentor others on professional commitment',
        'Lead initiatives that require high reliability'
      ]
    },
    // Infrastructure Audit Criteria Recommendations
    'building_condition': {
      1: [
        'Document all structural issues immediately',
        'Prioritize safety concerns for immediate attention',
        'Develop maintenance schedules for all facilities',
        'Seek funding for critical repairs'
      ],
      2: [
        'Address minor maintenance issues promptly',
        'Implement preventive maintenance programs',
        'Conduct regular facility inspections',
        'Plan for facility upgrades'
      ],
      3: [
        'Maintain excellent facility conditions',
        'Implement proactive maintenance strategies',
        'Plan for long-term facility improvements',
        'Share best practices with other institutions'
      ]
    },
    'classroom_facilities': {
      1: [
        'Identify and replace inadequate equipment',
        'Ensure basic classroom functionality',
        'Develop inventory tracking systems',
        'Prioritize essential classroom resources'
      ],
      2: [
        'Upgrade classroom technology and materials',
        'Ensure adequate supplies for all classrooms',
        'Implement equipment maintenance programs',
        'Align resources with curriculum needs'
      ],
      3: [
        'Provide state-of-the-art learning environments',
        'Integrate cutting-edge educational technology',
        'Ensure equitable resource distribution',
        'Lead innovation in classroom design'
      ]
    },
    'safety_security': {
      1: [
        'Address immediate safety hazards',
        'Implement basic security measures',
        'Train staff on safety protocols',
        'Develop emergency response procedures'
      ],
      2: [
        'Strengthen security systems and procedures',
        'Conduct regular safety drills',
        'Improve lighting and visibility',
        'Establish visitor management protocols'
      ],
      3: [
        'Maintain comprehensive safety and security',
        'Implement advanced security technologies',
        'Lead safety training and awareness programs',
        'Share best practices with other institutions'
      ]
    },
    'sanitation_hygiene': {
      1: [
        'Address immediate sanitation issues',
        'Ensure basic cleanliness standards',
        'Provide adequate hygiene supplies',
        'Implement cleaning schedules'
      ],
      2: [
        'Improve sanitation procedures and practices',
        'Enhance cleaning protocols',
        'Ensure adequate hygiene facilities',
        'Monitor cleanliness regularly'
      ],
      3: [
        'Maintain exceptional sanitation standards',
        'Implement sustainable cleaning practices',
        'Lead hygiene education programs',
        'Exceed health department requirements'
      ]
    },
    'technology_infrastructure': {
      1: [
        'Upgrade outdated technology systems',
        'Ensure basic connectivity for all areas',
        'Provide essential technology training',
        'Develop technology maintenance plans'
      ],
      2: [
        'Enhance technology capabilities and access',
        'Implement robust network infrastructure',
        'Provide ongoing technology support',
        'Align technology with learning needs'
      ],
      3: [
        'Maintain cutting-edge technology infrastructure',
        'Lead innovation in educational technology',
        'Provide comprehensive technology support',
        'Share expertise with other institutions'
      ]
    },
    'library_resources': {
      1: [
        'Acquire basic library materials',
        'Ensure library is accessible to all',
        'Develop basic cataloging systems',
        'Create welcoming library environment'
      ],
      2: [
        'Expand library collection and resources',
        'Implement effective resource management systems',
        'Provide information literacy instruction',
        'Create collaborative learning spaces'
      ],
      3: [
        'Maintain comprehensive, current resources',
        'Lead innovation in information services',
        'Provide expert research support',
        'Serve as a model learning resource center'
      ]
    },
    'recreational_facilities': {
      1: [
        'Address safety issues in recreational areas',
        'Ensure basic recreational equipment',
        'Maintain playing fields and courts',
        'Develop recreational activity schedules'
      ],
      2: [
        'Improve recreational facilities and equipment',
        'Expand program offerings',
        'Ensure adequate space for activities',
        'Maintain facilities in good condition'
      ],
      3: [
        'Provide exceptional recreational opportunities',
        'Lead innovative programming',
        'Maintain world-class facilities',
        'Serve as a model for other institutions'
      ]
    },
    'accessibility': {
      1: [
        'Identify and address accessibility barriers',
        'Ensure compliance with legal requirements',
        'Provide basic accommodations',
        'Train staff on accessibility needs'
      ],
      2: [
        'Enhance accessibility features',
        'Implement universal design principles',
        'Provide comprehensive accommodations',
        'Ensure equitable access for all'
      ],
      3: [
        'Maintain exemplary accessibility standards',
        'Lead inclusive design initiatives',
        'Exceed accessibility requirements',
        'Serve as a model for inclusive design'
      ]
    },
    'maintenance_upkeep': {
      1: [
        'Address immediate maintenance needs',
        'Develop basic maintenance schedules',
        'Train staff on maintenance procedures',
        'Prioritize critical maintenance tasks'
      ],
      2: [
        'Implement systematic maintenance programs',
        'Use preventive maintenance strategies',
        'Track maintenance activities and costs',
        'Ensure consistent upkeep standards'
      ],
      3: [
        'Maintain exceptional facility conditions',
        'Implement proactive maintenance approaches',
        'Lead maintenance innovation and efficiency',
        'Share best practices with other institutions'
      ]
    },
    'environmental_sustainability': {
      1: [
        'Implement basic environmental practices',
        'Reduce energy and water consumption',
        'Establish recycling programs',
        'Educate community on sustainability'
      ],
      2: [
        'Enhance environmental sustainability efforts',
        'Implement comprehensive green practices',
        'Measure and track environmental impact',
        'Engage community in sustainability initiatives'
      ],
      3: [
        'Lead environmental sustainability innovation',
        'Achieve carbon neutrality or better',
        'Serve as a model for sustainable practices',
        'Influence policy and practice beyond institution'
      ]
    }
  };

  // Return recommendations if available, otherwise return generic ones
  if (recommendations[criterionId] && recommendations[criterionId][currentScore]) {
    return recommendations[criterionId][currentScore];
  }

  // Generic recommendations if specific ones are not available
  switch (currentScore) {
    case 1:
      return [
        'Focus on establishing basic standards and procedures',
        'Seek training and guidance from experienced practitioners',
        'Develop step-by-step improvement plans',
        'Document progress regularly'
      ];
    case 2:
      return [
        'Build upon existing foundation with systematic enhancements',
        'Implement regular monitoring and feedback mechanisms',
        'Invest in additional resources and training',
        'Set specific, measurable improvement goals'
      ];
    case 3:
      return [
        'Fine-tune existing practices for excellence',
        'Focus on consistency and sustainability',
        'Share best practices with others',
        'Pursue innovative approaches to common challenges'
      ];
    default:
      return [
        'Continue maintaining current high standards',
        'Mentor others in best practices',
        'Stay current with developments in your field',
        'Look for opportunities to innovate and improve'
      ];
  }
};

// Enhanced helper function to add text with word wrapping and better formatting
const addWrappedText = (doc: jsPDF, text: string, x: number, y: number, maxWidth: number, fontSize: number = 12, fontStyle: string = 'normal'): number => {
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', fontStyle);
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + (lines.length * (fontSize * 0.55)); // Slightly increased line height
};

// Helper to calculate exact height of a text block
const calculateHeight = (doc: jsPDF, text: string, maxWidth: number, fontSize: number): number => {
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(text, maxWidth);
  return lines.length * (fontSize * 0.55);
};

// Enhanced helper function to check if we need a new page
const checkNewPage = (doc: jsPDF, yPosition: number, requiredSpace: number): number => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (yPosition + requiredSpace > pageHeight - 15) { // Reduced margin
    doc.addPage();
    return 15;
  }
  return yPosition;
};

// Function to add a section header with consistent styling
const addSectionHeader = (doc: jsPDF, text: string, yPosition: number, fontSize: number = 18): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;

  doc.setFontSize(fontSize);
  doc.setFont('helvetica', 'bold');
  doc.setDrawColor(50, 50, 50);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);
  return addWrappedText(doc, text, margin, yPosition + 5, pageWidth - 40, fontSize, 'bold');
};

// Function to add a subsection header


// Function to add a score indicator with visual representation
const addScoreIndicator = (doc: jsPDF, score: number, maxScore: number, yPosition: number): number => {

  const margin = 30;
  const barWidth = 100;
  const barHeight = 8;

  // Draw score bar background
  doc.setFillColor(230, 230, 230);
  doc.rect(margin, yPosition, barWidth, barHeight, 'F');

  // Draw score bar fill
  const percentage = score / maxScore;
  const fillWidth = barWidth * percentage;

  if (percentage >= 0.9) {
    doc.setFillColor(76, 175, 80); // Green
  } else if (percentage >= 0.7) {
    doc.setFillColor(255, 193, 7); // Amber
  } else {
    doc.setFillColor(244, 67, 54); // Red
  }

  doc.rect(margin, yPosition, fillWidth, barHeight, 'F');

  // Add score text
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`${score}/${maxScore}`, margin + barWidth + 10, yPosition + 6);

  return yPosition + 15;
};

export const generateAuditPDF = async (audit: Audit | InfrastructureAudit): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;
  const margin = 15;

  // Add header with school logo placeholder
  doc.setFillColor(25, 118, 210); // Blue background
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255); // White text
  doc.text('SCHOOL AUDIT REPORT', pageWidth / 2, 22, { align: 'center' });

  doc.setTextColor(0, 0, 0); // Reset to black
  yPosition = 45;

  // Get school and audit details
  const school = await storage.getSchoolById(audit.schoolId);
  const currentVersion = audit.versions[audit.currentVersion];

  let criteria = infrastructureAuditCriteria;
  if ('type' in audit) {
    criteria = audit.type === 'teacher' ? teacherAuditCriteria : mentorAuditCriteria;
  }

  const { totalScore, maxScore } = calculateAdjustedScore(currentVersion.responses, criteria);
  const percentage = calculatePercentage(totalScore, maxScore);

  let subjectName = '';
  let auditType = '';

  if ('type' in audit) {
    auditType = audit.type;

    if (audit.type === 'teacher') {
      const teacher = await storage.getTeacherById(audit.subjectId);
      subjectName = teacher?.name || 'Unknown Teacher';
    } else {
      const mentor = await storage.getMentorById(audit.subjectId);
      subjectName = mentor?.name || 'Unknown Mentor';
    }
  } else {
    auditType = 'infrastructure';
    subjectName = 'Infrastructure Audit';
  }

  // Audit Information Section
  yPosition = addSectionHeader(doc, 'AUDIT INFORMATION', yPosition, 20);
  yPosition += 8;

  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  yPosition = addWrappedText(doc, `School: ${school?.name || 'Unknown School'}`, margin, yPosition, pageWidth - 40, 13);
  yPosition = addWrappedText(doc, `Location: ${school?.location || 'Unknown Location'}`, margin, yPosition, pageWidth - 40, 13);
  yPosition = addWrappedText(doc, `${auditType === 'infrastructure' ? 'Audit Type' : (auditType === 'teacher' ? 'Teacher' : 'Mentor')}: ${subjectName}`, margin, yPosition, pageWidth - 40, 13);
  yPosition = addWrappedText(doc, `Audit Date: ${formatDate(currentVersion.timestamp)}`, margin, yPosition, pageWidth - 40, 13);
  yPosition = addWrappedText(doc, `Access Code: ${audit.accessCode}`, margin, yPosition, pageWidth - 40, 13);
  if (school?.createdBy) {
    yPosition = addWrappedText(doc, `Created by: ${getEmployeeDisplayName(school.createdBy)}`, margin, yPosition, pageWidth - 40, 13);
  }
  yPosition += 12;

  // Score Summary Section
  yPosition = addSectionHeader(doc, 'SCORE SUMMARY', yPosition, 20);
  yPosition += 8;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  yPosition = addWrappedText(doc, `Total Score: ${totalScore} / ${maxScore}`, margin, yPosition, pageWidth - 40, 14);
  yPosition = addScoreIndicator(doc, totalScore, maxScore, yPosition);

  // Add score interpretation
  let interpretation = '';
  if (percentage >= 90) {
    interpretation = 'Excellent Performance';
  } else if (percentage >= 80) {
    interpretation = 'Good Performance';
  } else if (percentage >= 70) {
    interpretation = 'Satisfactory Performance';
  } else if (percentage >= 60) {
    interpretation = 'Needs Improvement';
  } else {
    interpretation = 'Requires Immediate Attention';
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  yPosition = addWrappedText(doc, `Performance Level: ${interpretation}`, margin, yPosition, pageWidth - 40, 14);
  yPosition += 8;

  // Detailed recommendations integrated into individual results below
  yPosition += 10;

  // Current Audit Results Section
  yPosition = checkNewPage(doc, yPosition, 35);
  yPosition = addSectionHeader(doc, 'CURRENT AUDIT RESULTS', yPosition, 20);
  yPosition += 12;

  currentVersion.responses.forEach((response, index) => {
    const criterion = criteria.find(c => c.id === response.criteriaId);
    if (!criterion) return;

    // Check if we need a new page
    // Calculate exact height needed for this block
    let requiredHeight = 30; // Header(12) + Response(6) + Interpretation(6) + Padding(6)

    // Response text height
    requiredHeight += calculateHeight(doc, `Response: ${response.selectedOption}`, pageWidth - (margin * 2), 11);

    // Comment height
    if (response.comment) {
      requiredHeight += calculateHeight(doc, `Note: ${response.comment}`, pageWidth - (margin * 2), 11) + 2;
    }

    // Ladder and Recommendations height if score < 4
    if (response.score > 0 && response.score < 4) {
      // Ladder options (4 options)
      criterion.options.slice(0, 4).forEach((option, optIndex) => {
        let suffix = '';
        if (response.score === optIndex + 1) suffix = ' [CURRENT]';
        else if (optIndex + 1 === 4) suffix = ' [TARGET]';

        const textHeight = calculateHeight(doc, `L${optIndex + 1}: ${option}${suffix}`, pageWidth - (margin * 2) - 15, 10);
        requiredHeight += textHeight + 3; // +3 for spacing
      });

      // Recommendations Header
      requiredHeight += 10; // Header(6) + Padding(4)

      // Recommendations List
      const recommendations = getRecommendationsForCriterion(criterion.id, response.score);
      recommendations.forEach(rec => {
        const textHeight = calculateHeight(doc, `•  ${rec}`, pageWidth - (margin * 2) - 5, 10);
        requiredHeight += textHeight + 2; // +2 for spacing
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
    doc.rect(margin - 5, yPosition - 2, pageWidth - (margin * 2) + 10, 10, 'F'); // Header background

    // Question number and title
    doc.setFontSize(14); // Increased for readability
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`${index + 1}. ${criterion.label}`, margin, yPosition + 5); // Adjusted Y

    // Score Indicator in header (Right aligned)
    const percentage = response.score / 4;
    let scoreColor = [244, 67, 54]; // Red
    if (percentage === 1) scoreColor = [27, 94, 32]; // Dark Green (Score 4)
    else if (percentage >= 0.75) scoreColor = [33, 150, 243]; // Blue (Score 3)
    else if (percentage >= 0.5) scoreColor = [255, 143, 0]; // Amber

    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.setFontSize(13); // Increased for readability
    const scoreText = `Score: ${response.score}/4`;
    const scoreTextWidth = doc.getTextWidth(scoreText);
    doc.text(scoreText, pageWidth - margin - scoreTextWidth, yPosition + 5);
    doc.setTextColor(0, 0, 0);

    yPosition += 14; // Increased spacing

    // Current response
    doc.setFontSize(11); // Increased for readability
    doc.setFont('helvetica', 'normal');
    yPosition = addWrappedText(doc, `Response: ${response.selectedOption}`, margin, yPosition, pageWidth - (margin * 2), 11);

    // Add comment if present
    if (response.comment) {
      yPosition += 2;
      doc.setFont('helvetica', 'italic');
      yPosition = addWrappedText(doc, `Note: ${response.comment}`, margin, yPosition, pageWidth - (margin * 2), 11);
      doc.setFont('helvetica', 'normal');
    }

    yPosition += 4; // Increased spacing

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
      yPosition += 6; // Increased spacing

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
          doc.circle(markerX, markerY, 3, 'FD'); // Slightly larger circle
          doc.setFont('helvetica', 'bold');
          suffix = ' [CURRENT]';
        } else if (isTarget) {
          doc.setLineWidth(1);
          doc.circle(markerX, markerY, 3, 'D');
          doc.setFont('helvetica', 'bold');
          suffix = ' [TARGET]';
        } else {
          doc.circle(markerX, markerY, 3, 'D');
          doc.setFont('helvetica', 'normal');
        }

        const textX = margin + 10;
        doc.setFontSize(10); // Increased for readability
        doc.setTextColor(isCurrent || isTarget ? 0 : 60, isCurrent || isTarget ? 0 : 60, isCurrent || isTarget ? 0 : 60);

        // Render text
        const splitText = doc.splitTextToSize(`L${score}: ${option}${suffix}`, pageWidth - (margin * 2) - 15);
        doc.text(splitText, textX, yPosition);
        yPosition += (splitText.length * 5.5) + 3; // Increased spacing
      });

      // Recommendations
      yPosition += 6; // Increased spacing
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11); // Increased for readability
      doc.setTextColor(25, 118, 210);
      doc.text('Actionable Steps:', margin, yPosition);
      yPosition += 7; // Increased spacing

      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10); // Increased for readability
      const recommendations = getRecommendationsForCriterion(criterion.id, response.score);
      recommendations.forEach(rec => {
        const bulletLines = doc.splitTextToSize(`•  ${rec}`, pageWidth - (margin * 2) - 5);
        doc.text(bulletLines, margin + 2, yPosition);
        yPosition += (bulletLines.length * 5.5) + 2; // Increased spacing
      });
    }
    yPosition += 8; // Bottom padding inside box

    // Draw Box
    doc.setDrawColor(200, 200, 200); // Light gray border
    doc.setLineWidth(0.1);
    doc.rect(margin - 5, boxStartY, pageWidth - (margin * 2) + 10, yPosition - boxStartY); // Draw rect around entire section

    yPosition += 12; // Margin between items

  });

  // Areas for Improvement merged into Current Audit Results section above
  yPosition += 10;

  // Action Plan Template
  yPosition = checkNewPage(doc, yPosition, 45);
  yPosition = addSectionHeader(doc, 'ACTION PLAN FOR NEXT AUDIT', yPosition, 20);
  yPosition += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  yPosition = addWrappedText(doc, 'Based on your current scores, focus on these priority areas:', margin, yPosition, pageWidth - 40, 12);
  yPosition += 10;

  // Identify areas needing improvement
  const lowScoreAreas = currentVersion.responses
    .filter(response => response.score < 3)
    .sort((a, b) => a.score - b.score);

  if (lowScoreAreas.length > 0) {
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    yPosition = addWrappedText(doc, 'HIGH PRIORITY IMPROVEMENTS:', margin, yPosition, pageWidth - 40, 13);
    yPosition += 8;

    lowScoreAreas.slice(0, 5).forEach((response, index) => {
      const criterion = criteria.find(c => c.id === response.criteriaId);
      if (criterion) {
        yPosition = checkNewPage(doc, yPosition, 18);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        yPosition = addWrappedText(doc, `${index + 1}. ${criterion.label} (Current: ${response.score}/4)`, margin + 5, yPosition, pageWidth - 50, 12);
        yPosition += 5;
        yPosition = addWrappedText(doc, `   Target: Move to next performance level for better results`, margin + 5, yPosition, pageWidth - 50, 12);
        yPosition += 8;
      }
    });
  } else {
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    yPosition = addWrappedText(doc, 'EXCELLENT PERFORMANCE!', margin, yPosition, pageWidth - 40, 13);
    yPosition += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    yPosition = addWrappedText(doc, 'Continue maintaining high standards and consider mentoring others.', margin, yPosition, pageWidth - 40, 12);
  }

  yPosition += 18;

  // Version History (if multiple versions exist)
  const completedVersions = audit.versions.filter(v => !v.isDraft);
  if (completedVersions.length > 1) {
    yPosition = checkNewPage(doc, yPosition, 45);
    yPosition = addSectionHeader(doc, 'AUDIT HISTORY & PROGRESS TRACKING', yPosition, 20);
    yPosition += 12;

    completedVersions.forEach((version, index) => {
      yPosition = checkNewPage(doc, yPosition, 18);
      const versionAdjusted = calculateAdjustedScore(version.responses, criteria);
      const versionPercentage = calculatePercentage(versionAdjusted.totalScore, versionAdjusted.maxScore);

      doc.setFontSize(13);
      if (version.id === audit.versions[audit.currentVersion].id) {
        doc.setFont('helvetica', 'bold');
        yPosition = addWrappedText(doc, `► Version ${index + 1} (Current): ${formatDate(version.timestamp)}`, margin, yPosition, pageWidth - 40, 13);
      } else {
        doc.setFont('helvetica', 'normal');
        yPosition = addWrappedText(doc, `Version ${index + 1}: ${formatDate(version.timestamp)}`, margin, yPosition, pageWidth - 40, 13);
      }
      yPosition += 5;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      yPosition = addWrappedText(doc, `Score: ${versionAdjusted.totalScore}/${versionAdjusted.maxScore} (${versionPercentage}%)`, margin + 5, yPosition, pageWidth - 50, 12);

      // Show progress if not the first version
      if (index > 0) {
        const previousVersion = completedVersions[index - 1];
        const previousAdjusted = calculateAdjustedScore(previousVersion.responses, criteria);
        const previousPercentage = calculatePercentage(previousAdjusted.totalScore, previousAdjusted.maxScore);
        const improvement = versionPercentage - previousPercentage;

        if (improvement > 0) {
          yPosition = addWrappedText(doc, `Improvement: +${improvement.toFixed(1)}% ⬆`, margin + 5, yPosition, pageWidth - 50, 12);
        } else if (improvement < 0) {
          yPosition = addWrappedText(doc, `Change: ${improvement.toFixed(1)}% ⬇`, margin + 5, yPosition, pageWidth - 50, 12);
        } else {
          yPosition = addWrappedText(doc, `No change from previous audit`, margin + 5, yPosition, pageWidth - 50, 12);
        }
      }
      yPosition += 10;
    });
  }

  // Footer
  yPosition = checkNewPage(doc, yPosition, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`Generated on: ${formatDate(new Date().toISOString())}`, margin, pageHeight - 20);
  doc.text('School Management System - Comprehensive Audit Report', pageWidth - 120, pageHeight - 20);
  doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - 30, pageHeight - 10);

  // Save the PDF
  const safeSubjectName = subjectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const fileName = `comprehensive-${auditType}-audit-${safeSubjectName}-${audit.accessCode}.pdf`;
  doc.save(fileName);
};

export const generateSystemReportPDF = async (currentEmployee: any): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;
  const margin = 20;

  // Enhanced helper functions for system report
  const addWrappedTextSys = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10, fontStyle: string = 'normal'): number => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + (lines.length * (fontSize * 0.6));
  };

  const checkNewPageSys = (requiredSpace: number): number => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      doc.addPage();
      return 20;
    }
    return yPosition;
  };

  const addSectionHeaderSys = (text: string, fontSize: number = 14): number => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    doc.setDrawColor(50, 50, 50);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);
    return addWrappedTextSys(text, margin, yPosition + 5, pageWidth - 40, fontSize, 'bold');
  };

  // Add header
  doc.setFillColor(25, 118, 210);
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('SYSTEM AUDIT REPORT', pageWidth / 2, 18, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  yPosition = 40;

  // Get system data
  const schools = await storage.getSchools();
  const teacherPromises = schools.map(school => storage.getTeachersBySchool(school.id));
  const mentorPromises = schools.map(school => storage.getMentorsBySchool(school.id));

  const [teacherResults, mentorResults, allAudits, allInfrastructureAudits] = await Promise.all([
    Promise.all(teacherPromises),
    Promise.all(mentorPromises),
    storage.getAudits(),
    storage.getInfrastructureAudits()
  ]);

  const allTeachers = teacherResults.flat();
  const allMentors = mentorResults.flat();

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  yPosition = addWrappedTextSys('COMPREHENSIVE SYSTEM AUDIT REPORT', pageWidth / 2 - 60, yPosition, pageWidth - 40, 20);
  yPosition += 15;

  // Report Information
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  yPosition = addWrappedTextSys(`Generated: ${formatDate(new Date().toISOString())}`, margin, yPosition, pageWidth - 40);
  yPosition = addWrappedTextSys(`Generated by: ${currentEmployee.displayName} (System Administrator)`, margin, yPosition, pageWidth - 40);
  yPosition += 15;

  // System Overview
  yPosition = addSectionHeaderSys('SYSTEM OVERVIEW', 16);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  yPosition = addWrappedTextSys(`Total Schools: ${schools.length}`, margin, yPosition, pageWidth - 40);
  yPosition = addWrappedTextSys(`Total Teachers: ${allTeachers.length}`, margin, yPosition, pageWidth - 40);
  yPosition = addWrappedTextSys(`Total Mentors: ${allMentors.length}`, margin, yPosition, pageWidth - 40);
  yPosition = addWrappedTextSys(`Total Audits: ${allAudits.length + allInfrastructureAudits.length}`, margin, yPosition, pageWidth - 40);
  yPosition += 15;

  // Performance Analytics
  const allAuditVersions = [...allAudits, ...allInfrastructureAudits].flatMap(audit =>
    audit.versions.map(version => ({
      ...version,
      auditId: audit.id,
      schoolId: audit.schoolId,
      percentage: calculatePercentage(version.totalScore, version.maxScore)
    }))
  );

  if (allAuditVersions.length > 0) {
    const averagePerformance = allAuditVersions.reduce((sum, version) => sum + version.percentage, 0) / allAuditVersions.length;
    const excellentCount = allAuditVersions.filter(v => v.percentage >= 90).length;
    const goodCount = allAuditVersions.filter(v => v.percentage >= 80 && v.percentage < 90).length;
    const satisfactoryCount = allAuditVersions.filter(v => v.percentage >= 70 && v.percentage < 80).length;
    const needsImprovementCount = allAuditVersions.filter(v => v.percentage < 70).length;

    yPosition = addSectionHeaderSys('SYSTEM PERFORMANCE ANALYTICS', 16);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    yPosition = addWrappedTextSys(`Average System Performance: ${averagePerformance.toFixed(1)}%`, margin, yPosition, pageWidth - 40);
    yPosition += 5;
    yPosition = addWrappedTextSys(`Excellent Performance (90%+): ${excellentCount} audits`, margin, yPosition, pageWidth - 40);
    yPosition = addWrappedTextSys(`Good Performance (80-89%): ${goodCount} audits`, margin, yPosition, pageWidth - 40);
    yPosition = addWrappedTextSys(`Satisfactory Performance (70-79%): ${satisfactoryCount} audits`, margin, yPosition, pageWidth - 40);
    yPosition = addWrappedTextSys(`Needs Improvement (<70%): ${needsImprovementCount} audits`, margin, yPosition, pageWidth - 40);
    yPosition += 15;
  }

  // Schools by Employee
  const schoolsByEmployee = schools.reduce((acc, school) => {
    acc[school.createdBy] = (acc[school.createdBy] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  yPosition = addSectionHeaderSys('SCHOOLS BY EMPLOYEE', 16);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  Object.entries(schoolsByEmployee).forEach(([employee, count]) => {
    yPosition = checkNewPageSys(8);
    yPosition = addWrappedTextSys(`${getEmployeeDisplayName(employee)}: ${count} schools`, margin, yPosition, pageWidth - 40);
  });
  yPosition += 15;

  // Detailed School Information
  yPosition = addSectionHeaderSys('DETAILED SCHOOL INFORMATION', 16);
  yPosition += 8;

  schools.forEach((school) => {
    yPosition = checkNewPageSys(60);

    const teachers = allTeachers.filter(t => t.schoolId === school.id);
    const mentors = allMentors.filter(m => m.schoolId === school.id);
    const schoolAudits = allAudits.filter(audit => audit.schoolId === school.id);
    const infraAudit = allInfrastructureAudits.find(audit => audit.schoolId === school.id);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    yPosition = addWrappedTextSys(`School: ${school.name}`, margin, yPosition, pageWidth - 40, 12);
    yPosition += 3;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    yPosition = addWrappedTextSys(`Location: ${school.location}`, margin + 5, yPosition, pageWidth - 50);
    yPosition = addWrappedTextSys(`Code: ${school.code || 'N/A'}`, margin + 5, yPosition, pageWidth - 50);
    yPosition = addWrappedTextSys(`Created by: ${getEmployeeDisplayName(school.createdBy)}`, margin + 5, yPosition, pageWidth - 50);
    yPosition = addWrappedTextSys(`Created: ${formatDate(school.createdAt)}`, margin + 5, yPosition, pageWidth - 50);
    yPosition = addWrappedTextSys(`Teachers: ${teachers.length}`, margin + 5, yPosition, pageWidth - 50);
    yPosition = addWrappedTextSys(`Mentors: ${mentors.length}`, margin + 5, yPosition, pageWidth - 50);
    yPosition = addWrappedTextSys(`Audits Completed: ${schoolAudits.length + (infraAudit ? 1 : 0)}`, margin + 5, yPosition, pageWidth - 50);

    // Show latest audit scores if available
    const latestAudits = [...schoolAudits, ...(infraAudit ? [infraAudit] : [])]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        // Handle invalid dates
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;
        return dateB.getTime() - dateA.getTime();
      });

    if (latestAudits.length > 0) {
      yPosition += 3;
      doc.setFont('helvetica', 'bold');
      yPosition = addWrappedTextSys(`Latest Audit Scores:`, margin + 5, yPosition, pageWidth - 50);
      yPosition += 2;
      doc.setFont('helvetica', 'normal');

      latestAudits.slice(0, 3).forEach(audit => {
        const currentVersion = audit.versions[audit.currentVersion];
        const percentage = calculatePercentage(currentVersion.totalScore, currentVersion.maxScore);
        let auditType = '';

        if ('type' in audit) {
          auditType = (audit as Audit).type;
        } else {
          auditType = 'infrastructure';
        }

        yPosition = addWrappedTextSys(`  • ${auditType}: ${percentage}% (${audit.accessCode})`, margin + 10, yPosition, pageWidth - 60);
      });
    }

    yPosition += 10;
  });

  // Recent Audit Activity
  const recentAudits = [...allAudits, ...allInfrastructureAudits]
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      // Handle invalid dates
      if (isNaN(dateA.getTime())) return 1;
      if (isNaN(dateB.getTime())) return -1;
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 15);

  yPosition = checkNewPageSys(30);
  yPosition = addSectionHeaderSys('RECENT AUDIT ACTIVITY', 16);
  yPosition += 8;

  for (const audit of recentAudits) {
    yPosition = checkNewPageSys(15);

    const school = await storage.getSchoolById(audit.schoolId);
    const currentVersion = audit.versions[audit.currentVersion];
    const percentage = calculatePercentage(currentVersion.totalScore, currentVersion.maxScore);

    let subjectName = '';
    let auditType = '';

    if ('type' in audit) {
      const typedAudit = audit as Audit;
      auditType = typedAudit.type;
      if (typedAudit.type === 'teacher') {
        const teacher = allTeachers.find(t => t.id === typedAudit.subjectId);
        subjectName = teacher?.name || 'Unknown Teacher';
      } else {
        const mentor = allMentors.find(m => m.id === typedAudit.subjectId);
        subjectName = mentor?.name || 'Unknown Mentor';
      }
    } else {
      auditType = 'infrastructure';
      subjectName = 'Infrastructure';
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    yPosition = addWrappedTextSys(
      `${formatDate(audit.createdAt)} - ${school?.name} - ${auditType} Audit: ${subjectName} (${percentage}%) - Code: ${audit.accessCode}`,
      margin,
      yPosition,
      pageWidth - 40,
      9
    );
  }

  // System Recommendations
  yPosition = checkNewPageSys(40);
  yPosition = addSectionHeaderSys('SYSTEM RECOMMENDATIONS', 16);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  if (allAuditVersions.length > 0) {
    const averagePerformance = allAuditVersions.reduce((sum, version) => sum + version.percentage, 0) / allAuditVersions.length;

    if (averagePerformance >= 85) {
      yPosition = addWrappedTextSys('• System is performing excellently. Focus on maintaining standards and sharing best practices.', margin, yPosition, pageWidth - 40);
      yPosition = addWrappedTextSys('• Consider implementing peer mentoring programs between high-performing schools.', margin, yPosition, pageWidth - 40);
    } else if (averagePerformance >= 75) {
      yPosition = addWrappedTextSys('• System performance is good but has room for improvement.', margin, yPosition, pageWidth - 40);
      yPosition = addWrappedTextSys('• Focus on targeted training for schools scoring below 80%.', margin, yPosition, pageWidth - 40);
      yPosition = addWrappedTextSys('• Implement regular monitoring and support mechanisms.', margin, yPosition, pageWidth - 40);
    } else {
      yPosition = addWrappedTextSys('• System requires significant improvement across multiple areas.', margin, yPosition, pageWidth - 40);
      yPosition = addWrappedTextSys('• Implement comprehensive training programs for all staff.', margin, yPosition, pageWidth - 40);
      yPosition = addWrappedTextSys('• Consider additional resources and support for struggling schools.', margin, yPosition, pageWidth - 40);
      yPosition = addWrappedTextSys('• Establish regular review and improvement cycles.', margin, yPosition, pageWidth - 40);
    }
  } else {
    yPosition = addWrappedTextSys('• No audit data available yet. Encourage schools to begin conducting regular audits.', margin, yPosition, pageWidth - 40);
    yPosition = addWrappedTextSys('• Provide training on audit procedures and importance of regular assessment.', margin, yPosition, pageWidth - 40);
  }

  // Footer
  yPosition = checkNewPageSys(20);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(`Generated on: ${formatDate(new Date().toISOString())}`, margin, pageHeight - 15);
  doc.text('School Management System - Comprehensive System Report', pageWidth - 140, pageHeight - 15);

  // Save the PDF
  const fileName = `comprehensive-system-audit-report-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
