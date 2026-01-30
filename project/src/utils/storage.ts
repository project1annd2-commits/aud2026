import { School, Teacher, Mentor, Audit, InfrastructureAudit, LoginSession, Device } from '../types';
import { database } from './database';

// Migration function to move localStorage data to Supabase
const migrateLocalStorageToSupabase = async () => {
  const STORAGE_KEYS = {
    SCHOOLS: 'schools',
    TEACHERS: 'teachers',
    MENTORS: 'mentors',
    AUDITS: 'audits',
    INFRASTRUCTURE_AUDITS: 'infrastructure_audits'
  };

  try {
    // Check if migration has already been done
    const migrationFlag = localStorage.getItem('supabase_migration_completed');
    if (migrationFlag) {
      console.log('Migration already completed, skipping');
      return;
    }

    console.log('Starting migration from localStorage to MongoDB...');

    // Try to load data from localStorage first
    let schoolsData = localStorage.getItem(STORAGE_KEYS.SCHOOLS);
    let teachersData = localStorage.getItem(STORAGE_KEYS.TEACHERS);
    let mentorsData = localStorage.getItem(STORAGE_KEYS.MENTORS);
    let auditsData = localStorage.getItem(STORAGE_KEYS.AUDITS);
    let infraAuditsData = localStorage.getItem(STORAGE_KEYS.INFRASTRUCTURE_AUDITS);

    // Only migrate if there's data in localStorage
    if (schoolsData || teachersData || mentorsData || auditsData || infraAuditsData) {
      console.log('Found localStorage data, migrating...');

      // Migrate schools
      if (schoolsData) {
        const schools: School[] = JSON.parse(schoolsData);
        for (const school of schools) {
          try {
            await database.addSchool(school);
          } catch (error) {
            console.warn('School already exists or error migrating:', school.name);
          }
        }
      }

      // Migrate teachers
      if (teachersData) {
        const teachers: Teacher[] = JSON.parse(teachersData);
        for (const teacher of teachers) {
          try {
            await database.addTeacher(teacher);
          } catch (error) {
            console.warn('Teacher already exists or error migrating:', teacher.name);
          }
        }
      }

      // Migrate mentors
      if (mentorsData) {
        const mentors: Mentor[] = JSON.parse(mentorsData);
        for (const mentor of mentors) {
          try {
            await database.addMentor(mentor);
          } catch (error) {
            console.warn('Mentor already exists or error migrating:', mentor.name);
          }
        }
      }

      // Migrate audits
      if (auditsData) {
        const audits: Audit[] = JSON.parse(auditsData);
        for (const audit of audits) {
          try {
            await database.addAudit(audit);
          } catch (error) {
            console.warn('Audit already exists or error migrating:', audit.accessCode);
          }
        }
      }

      // Migrate infrastructure audits
      if (infraAuditsData) {
        const infraAudits: InfrastructureAudit[] = JSON.parse(infraAuditsData);
        for (const audit of infraAudits) {
          try {
            await database.addInfrastructureAudit(audit);
          } catch (error) {
            console.warn('Infrastructure audit already exists or error migrating:', audit.accessCode);
          }
        }
      }

      // Mark migration as completed
      localStorage.setItem('supabase_migration_completed', 'true');
      console.log('Migration completed successfully!');
    } else {
      console.log('No offline data to migrate.');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

export const storage = {
  // Initialize migration on first load
  async init() {
    await migrateLocalStorageToSupabase();
  },

  // Schools
  async getSchools(): Promise<School[]> {
    return await database.getSchools();
  },

  async addSchool(school: School): Promise<void> {
    await database.addSchool(school);
  },

  async deleteSchool(schoolId: string): Promise<void> {
    await database.deleteSchool(schoolId);
  },

  async updateSchool(school: School): Promise<void> {
    await database.updateSchool(school);
  },

  async getSchoolById(id: string): Promise<School | undefined> {
    const school = await database.getSchoolById(id);
    return school || undefined;
  },

  async getSchoolsByEmployee(username: string): Promise<School[]> {
    return await database.getSchoolsByEmployee(username);
  },

  // Teachers
  async getTeachers(): Promise<Teacher[]> {
    return await database.getTeachers();
  },

  async addTeacher(teacher: Teacher): Promise<void> {
    await database.addTeacher(teacher);
  },

  async deleteTeacher(teacherId: string): Promise<void> {
    await database.deleteTeacher(teacherId);
  },

  async updateTeacher(teacher: Teacher): Promise<void> {
    await database.updateTeacher(teacher);
  },

  async getTeachersBySchool(schoolId: string): Promise<Teacher[]> {
    return await database.getTeachersBySchool(schoolId);
  },

  async getTeacherById(id: string): Promise<Teacher | undefined> {
    const teacher = await database.getTeacherById(id);
    return teacher || undefined;
  },

  // Mentors
  async getMentors(): Promise<Mentor[]> {
    return await database.getMentors();
  },

  async addMentor(mentor: Mentor): Promise<void> {
    await database.addMentor(mentor);
  },

  async deleteMentor(mentorId: string): Promise<void> {
    await database.deleteMentor(mentorId);
  },

  async updateMentor(mentor: Mentor): Promise<void> {
    await database.updateMentor(mentor);
  },

  async getMentorsBySchool(schoolId: string): Promise<Mentor[]> {
    return await database.getMentorsBySchool(schoolId);
  },

  async getMentorById(id: string): Promise<Mentor | undefined> {
    const mentor = await database.getMentorById(id);
    return mentor || undefined;
  },

  // Audits
  async getAudits(): Promise<Audit[]> {
    return await database.getAudits();
  },

  async addAudit(audit: Audit): Promise<void> {
    await database.addAudit(audit);
  },

  async updateAudit(updatedAudit: Audit): Promise<void> {
    await database.updateAudit(updatedAudit);
  },

  async deleteAudit(auditId: string): Promise<void> {
    await database.deleteAudit(auditId);
  },

  async getAuditByAccessCode(accessCode: string): Promise<Audit | InfrastructureAudit | undefined> {
    const audit = await database.getAuditByAccessCode(accessCode);
    return audit || undefined;
  },

  async getAuditsBySubject(subjectId: string): Promise<Audit[]> {
    return await database.getAuditsBySubject(subjectId);
  },

  // Infrastructure Audits
  async getInfrastructureAudits(): Promise<InfrastructureAudit[]> {
    return await database.getInfrastructureAudits();
  },

  async addInfrastructureAudit(audit: InfrastructureAudit): Promise<void> {
    await database.addInfrastructureAudit(audit);
  },

  async updateInfrastructureAudit(updatedAudit: InfrastructureAudit): Promise<void> {
    await database.updateInfrastructureAudit(updatedAudit);
  },

  async deleteInfrastructureAudit(auditId: string): Promise<void> {
    await database.deleteInfrastructureAudit(auditId);
  },

  async getInfrastructureAuditBySchool(schoolId: string): Promise<InfrastructureAudit | undefined> {
    const audit = await database.getInfrastructureAuditBySchool(schoolId);
    return audit || undefined;
  },

  // Device Management
  async getDevices(): Promise<Device[]> {
    return await database.getDevices();
  },

  async getDeviceById(deviceId: string): Promise<Device | undefined> {
    const device = await database.getDeviceById(deviceId);
    return device || undefined;
  },

  async addDevice(device: Device): Promise<void> {
    await database.addDevice(device);
  },

  async updateDevice(device: Device): Promise<void> {
    await database.updateDevice(device);
  },

  // Login Sessions (Updated to use Database)
  async addLoginSession(session: LoginSession): Promise<void> {
    await database.addLoginSession(session);
  },

  async getLoginSessions(): Promise<LoginSession[]> {
    return await database.getLoginSessions();
  },

  async getLoginSessionsByUsername(username: string): Promise<LoginSession[]> {
    const sessions = await database.getLoginSessions();
    return sessions.filter(session => session.username === username);
  },

  async updateLoginSession(sessionId: string, updates: Partial<LoginSession>): Promise<void> {
    await database.updateLoginSession(sessionId, updates);
  },

  async getActiveSessionsCount(): Promise<number> {
    const sessions = await database.getLoginSessions();
    return sessions.filter(s => s.status === 'active').length;
  },

  // Legacy methods for backward compatibility (these now use async operations)
  saveSchools: () => { }, // No longer needed
  saveTeachers: () => { }, // No longer needed
  saveMentors: () => { }, // No longer needed
  saveAudits: () => { }, // No longer needed
  saveInfrastructureAudits: () => { } // No longer needed
};