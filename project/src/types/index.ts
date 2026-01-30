export interface School {
  id: string;
  name: string;
  location: string;
  code?: string;
  createdBy: string; // Employee username who created the school
  createdAt: string;
}

export interface Teacher {
  id: string;
  schoolId: string;
  name: string;
  qualification: string;
  phone: string;
  email?: string;
  subject: string;
  createdAt: string;
}

export interface Mentor {
  id: string;
  schoolId: string;
  name: string;
  qualification: string;
  phone: string;
  email?: string;
  expertise: string;
  createdAt: string;
}

export interface Employee {
  username: string;
  password: string;
  displayName: string;
  role: 'admin' | 'employee' | 'viewer';
}

export interface LoginSession {
  id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'employee' | 'viewer';
  timestamp: string;
  deviceInfo: {
    browser: string;
    os: string;
    device: string; // 'Mobile' | 'Tablet' | 'Desktop'
    userAgent: string;
  };
  ipAddress: string;
  location?: {
    city?: string;
    country?: string;
  };
  status: 'active' | 'logged_out';
  logoutTimestamp?: string;
}

export interface Device {
  id: string; // UUID from localStorage
  username: string; // Owner (Employee username)
  name: string; // e.g. "Chrome on Windows"
  type: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  ipAddress: string;
  lastLoginAt: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface AuditCriteria {
  id: string;
  label: string;
  options: string[];
  scores: number[];
}

export interface RecognitionResults {
  detections?: Array<{
    class: string;
    confidence: number;
    frame: number;
  }>;
  analysis?: {
    student_interactions?: {
      raising_hand?: boolean;
      using_book?: boolean;
      using_phone?: boolean;
      interactive?: boolean;
    };
    teacher_activities?: {
      explaining?: boolean;
      monitoring?: boolean;
    };
    summary?: string;
  };
  error?: string;
  note?: string;
}

export interface AuditResponse {
  criteriaId: string;
  selectedOption: string;
  score: number;
  comment?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  recognitionResults?: RecognitionResults | null;
}

export interface AuditVersion {
  id: string;
  timestamp: string;
  responses: AuditResponse[];
  totalScore: number;
  maxScore: number;
  editedBy?: string;
  isDraft?: boolean;
}

export interface Audit {
  id: string;
  type: 'teacher' | 'mentor' | 'infrastructure';
  subjectId: string; // teacher/mentor ID
  schoolId: string;
  accessCode: string;
  versions: AuditVersion[];
  currentVersion: number;
  createdAt: string;
}

export interface InfrastructureAudit {
  id: string;
  schoolId: string;
  accessCode: string;
  versions: AuditVersion[];
  currentVersion: number;
  createdAt: string;
}

export type AuditType = 'teacher' | 'mentor' | 'infrastructure';

export interface ChatMessage {
  id: string;
  senderId: string; // 'teacher' or employee username
  senderName: string;
  text: string;
  timestamp: string;
  read: boolean;
  isAdmin: boolean;
}

export interface ChatSession {
  id: string;
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  teacherName: string; // Optional, maybe just "Teacher from [School]"
  assignedTo: string; // Employee username (createdBy of the school)
  status: 'active' | 'closed';
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}