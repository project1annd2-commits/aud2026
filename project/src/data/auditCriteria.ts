export interface AuditCriteria {
  id: string;
  label: string;
  options: string[];
  scores: number[];
}

export const teacherAuditCriteria: AuditCriteria[] = [
  {
    id: 'lesson_planning',
    label: 'Lesson Planning and Preparation',
    options: [
      'No evidence of lesson planning or preparation',
      'Basic lesson plan exists but lacks detail and structure',
      'Well-structured lesson plan with clear objectives and activities',
      'Comprehensive lesson plan with differentiated activities and assessment strategies',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  },
  {
    id: 'subject_knowledge',
    label: 'Subject Knowledge and Content Delivery',
    options: [
      'Limited subject knowledge with frequent errors',
      'Basic subject knowledge with occasional inaccuracies',
      'Good subject knowledge with clear explanations',
      'Excellent subject mastery with engaging and accurate content delivery',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  },
  {
    id: 'teaching_methods',
    label: 'Teaching Methods and Strategies',
    options: [
      'Uses only traditional lecture methods with no variety',
      'Limited variety in teaching methods, mostly teacher-centered',
      'Uses multiple teaching strategies with some student engagement',
      'Employs diverse, innovative teaching methods with high student engagement',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  },
  {
    id: 'classroom_management',
    label: 'Classroom Management and Environment',
    options: [
      'Poor classroom control with frequent disruptions',
      'Basic classroom management with some behavioral issues',
      'Good classroom management with clear rules and procedures',
      'Excellent classroom environment that promotes learning and respect',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  },
  {
    id: 'student_interaction',
    label: 'Student Interaction and Communication',
    options: [
      'Minimal interaction with students, poor communication',
      'Basic interaction with limited student engagement',
      'Good communication with regular student interaction',
      'Excellent rapport with students, encouraging and supportive communication',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  },
  {
    id: 'assessment_feedback',
    label: 'Assessment and Feedback',
    options: [
      'No formal assessment or feedback provided',
      'Basic assessment with limited feedback',
      'Regular assessment with constructive feedback',
      'Comprehensive assessment strategies with detailed, actionable feedback',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  },
  {
    id: 'technology_integration',
    label: 'Technology Integration and Innovation',
    options: [
      'No use of technology in teaching',
      'Basic use of technology with limited effectiveness',
      'Good integration of technology to enhance learning',
      'Innovative and effective use of technology to transform learning experiences',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  },
  {
    id: 'professional_development',
    label: 'Professional Development and Growth',
    options: [
      'No evidence of professional development activities',
      'Minimal participation in professional development',
      'Regular participation in professional development activities',
      'Active pursuit of professional growth with evidence of implementation',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  },
  {
    id: 'collaboration',
    label: 'Collaboration and Teamwork',
    options: [
      'Works in isolation with no collaboration',
      'Limited collaboration with colleagues',
      'Good collaboration and teamwork with staff',
      'Excellent collaborative skills, actively contributes to school community',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  },
  {
    id: 'punctuality_attendance',
    label: 'Punctuality and Attendance',
    options: [
      'Frequent absences and tardiness affecting teaching quality',
      'Occasional absences or tardiness with some impact',
      'Good attendance and punctuality with rare absences',
      'Excellent attendance and punctuality, highly reliable',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  }
];

export const mentorAuditCriteria: AuditCriteria[] = [
  {
    id: 'mentoring_skills',
    label: 'Mentoring and Guidance Skills',
    options: [
      'Poor mentoring skills with ineffective guidance',
      'Basic mentoring abilities with limited impact',
      'Good mentoring skills with positive influence on mentees',
      'Excellent mentoring abilities with transformative impact on student development',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  },
  {
    id: 'student_support',
    label: 'Student Support and Counseling',
    options: [
      'Minimal support provided to students',
      'Basic support with limited follow-up',
      'Good support system with regular check-ins',
      'Comprehensive support with proactive intervention and follow-up',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  },
  {
    id: 'program_coordination',
    label: 'Program Coordination and Management',
    options: [
      'Poor coordination with frequent organizational issues',
      'Basic coordination with some organizational challenges',
      'Good coordination with well-managed programs',
      'Excellent coordination with innovative and efficient program management',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  },
  {
    id: 'communication_skills',
    label: 'Communication and Interpersonal Skills',
    options: [
      'Poor communication affecting relationships',
      'Basic communication with limited effectiveness',
      'Good communication skills with positive relationships',
      'Excellent communication fostering strong, supportive relationships',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  },
  {
    id: 'problem_solving',
    label: 'Problem Solving and Conflict Resolution',
    options: [
      'Ineffective at resolving conflicts or problems',
      'Basic problem-solving with limited success',
      'Good problem-solving skills with effective resolutions',
      'Excellent problem-solving abilities with innovative and lasting solutions',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  },
  {
    id: 'professional_knowledge',
    label: 'Professional Knowledge and Expertise',
    options: [
      'Limited knowledge in area of expertise',
      'Basic knowledge with some gaps',
      'Good knowledge with competent application',
      'Excellent expertise with advanced knowledge and application',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  },
  {
    id: 'initiative_leadership',
    label: 'Initiative and Leadership',
    options: [
      'Shows no initiative or leadership qualities',
      'Limited initiative with basic leadership skills',
      'Good initiative with emerging leadership qualities',
      'Excellent initiative and strong leadership inspiring others',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  },
  {
    id: 'record_keeping',
    label: 'Record Keeping and Documentation',
    options: [
      'Poor record keeping with missing documentation',
      'Basic record keeping with some gaps',
      'Good record keeping with organized documentation',
      'Excellent record keeping with comprehensive and systematic documentation',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  },
  {
    id: 'parent_community_engagement',
    label: 'Parent and Community Engagement',
    options: [
      'No engagement with parents or community',
      'Limited engagement with minimal impact',
      'Good engagement with positive community relationships',
      'Excellent engagement fostering strong community partnerships',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  },
  {
    id: 'reliability_commitment',
    label: 'Reliability and Commitment',
    options: [
      'Unreliable with poor commitment to responsibilities',
      'Basic reliability with occasional lapses',
      'Good reliability with consistent performance',
      'Excellent reliability and unwavering commitment to excellence',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  }
];

export const infrastructureAuditCriteria: AuditCriteria[] = [
  {
    id: 'building_condition',
    label: 'Building Structure and Condition',
    options: [
      'Poor structural condition requiring immediate attention',
      'Fair condition with some maintenance needs',
      'Good structural condition with minor issues',
      'Excellent structural condition, well-maintained',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  },
  {
    id: 'classroom_facilities',
    label: 'Classroom Facilities and Equipment',
    options: [
      'Inadequate facilities with poor equipment',
      'Basic facilities with limited equipment',
      'Good facilities with adequate equipment',
      'Excellent facilities with modern, well-maintained equipment',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  },
  {
    id: 'safety_security',
    label: 'Safety and Security Measures',
    options: [
      'Poor safety measures with security concerns',
      'Basic safety measures with some gaps',
      'Good safety protocols with adequate security',
      'Excellent safety and security systems in place',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  },
  {
    id: 'sanitation_hygiene',
    label: 'Sanitation and Hygiene Facilities',
    options: [
      'Poor sanitation with hygiene concerns',
      'Basic sanitation with some cleanliness issues',
      'Good sanitation with adequate hygiene facilities',
      'Excellent sanitation and hygiene standards maintained',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  },
  {
    id: 'technology_infrastructure',
    label: 'Technology and IT Infrastructure',
    options: [
      'No or outdated technology infrastructure',
      'Basic technology with limited functionality',
      'Good technology infrastructure meeting current needs',
      'Excellent, modern technology infrastructure supporting advanced learning',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  },
  {
    id: 'library_resources',
    label: 'Library and Learning Resources',
    options: [
      'Inadequate library with limited resources',
      'Basic library with some learning materials',
      'Good library with adequate resources',
      'Excellent library with comprehensive, up-to-date resources',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  },
  {
    id: 'recreational_facilities',
    label: 'Recreational and Sports Facilities',
    options: [
      'No recreational facilities available',
      'Limited recreational facilities in poor condition',
      'Good recreational facilities meeting basic needs',
      'Excellent recreational and sports facilities promoting holistic development',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  },
  {
    id: 'accessibility',
    label: 'Accessibility and Inclusive Design',
    options: [
      'No accessibility features for differently-abled individuals',
      'Limited accessibility with basic accommodations',
      'Good accessibility features meeting standard requirements',
      'Excellent accessibility with comprehensive inclusive design',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  },
  {
    id: 'maintenance_upkeep',
    label: 'Maintenance and Upkeep',
    options: [
      'Poor maintenance with visible neglect',
      'Basic maintenance with some areas needing attention',
      'Good maintenance with regular upkeep',
      'Excellent maintenance with proactive care and attention to detail',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  },
  {
    id: 'environmental_sustainability',
    label: 'Environmental Sustainability',
    options: [
      'No environmental considerations or sustainability measures',
      'Basic environmental awareness with limited green practices',
      'Good environmental practices with some sustainability measures',
      'Excellent environmental sustainability with comprehensive green initiatives',
      'Not Applicable'
    ],
    scores: [1, 2, 3, 4, 0]
  }
];