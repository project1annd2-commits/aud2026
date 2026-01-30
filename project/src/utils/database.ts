import { School, Teacher, Mentor, Audit, InfrastructureAudit, Device, LoginSession } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const timeout = 8000; // 8 seconds timeout
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export const database = {
  // Schools
  async getSchools(): Promise<School[]> {
    return fetchJson<School[]>(`${API_BASE_URL}/schools`);
  },

  async getSchoolById(id: string): Promise<School | null> {
    try {
      return await fetchJson<School>(`${API_BASE_URL}/schools/${id}`);
    } catch (e) {
      return null;
    }
  },

  async getSchoolsByEmployee(username: string): Promise<School[]> {
    return fetchJson<School[]>(`${API_BASE_URL}/schools?createdBy=${username}`);
  },

  async addSchool(school: School): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...schoolData } = school;
    await fetchJson(`${API_BASE_URL}/schools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schoolData)
    });
  },

  async deleteSchool(schoolId: string): Promise<void> {
    await fetchJson(`${API_BASE_URL}/schools/${schoolId}`, {
      method: 'DELETE'
    });
  },

  async updateSchool(school: School): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...schoolData } = school;
    await fetchJson(`${API_BASE_URL}/schools/${school.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schoolData)
    });
  },

  // Teachers
  async getTeachers(): Promise<Teacher[]> {
    return fetchJson<Teacher[]>(`${API_BASE_URL}/teachers`);
  },

  async getTeachersBySchool(schoolId: string): Promise<Teacher[]> {
    return fetchJson<Teacher[]>(`${API_BASE_URL}/teachers?schoolId=${schoolId}`);
  },

  async getTeacherById(id: string): Promise<Teacher | null> {
    try {
      return await fetchJson<Teacher>(`${API_BASE_URL}/teachers/${id}`);
    } catch (e) {
      return null;
    }
  },

  async addTeacher(teacher: Teacher): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...teacherData } = teacher;
    await fetchJson(`${API_BASE_URL}/teachers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teacherData)
    });
  },

  async deleteTeacher(teacherId: string): Promise<void> {
    await fetchJson(`${API_BASE_URL}/teachers/${teacherId}`, {
      method: 'DELETE'
    });
  },

  async updateTeacher(teacher: Teacher): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...teacherData } = teacher;
    await fetchJson(`${API_BASE_URL}/teachers/${teacher.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teacherData)
    });
  },

  // Mentors
  async getMentors(): Promise<Mentor[]> {
    return fetchJson<Mentor[]>(`${API_BASE_URL}/mentors`);
  },

  async getMentorsBySchool(schoolId: string): Promise<Mentor[]> {
    return fetchJson<Mentor[]>(`${API_BASE_URL}/mentors?schoolId=${schoolId}`);
  },

  async getMentorById(id: string): Promise<Mentor | null> {
    try {
      return await fetchJson<Mentor>(`${API_BASE_URL}/mentors/${id}`);
    } catch (e) {
      return null;
    }
  },

  async addMentor(mentor: Mentor): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...mentorData } = mentor;
    await fetchJson(`${API_BASE_URL}/mentors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mentorData)
    });
  },

  async deleteMentor(mentorId: string): Promise<void> {
    await fetchJson(`${API_BASE_URL}/mentors/${mentorId}`, {
      method: 'DELETE'
    });
  },

  async updateMentor(mentor: Mentor): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...mentorData } = mentor;
    await fetchJson(`${API_BASE_URL}/mentors/${mentor.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mentorData)
    });
  },

  // Audits
  async getAudits(): Promise<Audit[]> {
    return fetchJson<Audit[]>(`${API_BASE_URL}/audits`);
  },

  async getAuditsBySubject(subjectId: string): Promise<Audit[]> {
    return fetchJson<Audit[]>(`${API_BASE_URL}/audits?subjectId=${subjectId}`);
  },

  async addAudit(audit: Audit): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...auditData } = audit;
    await fetchJson(`${API_BASE_URL}/audits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auditData)
    });
  },

  async updateAudit(audit: Audit): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...auditData } = audit;
    await fetchJson(`${API_BASE_URL}/audits/${audit.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auditData)
    });
  },

  async deleteAudit(auditId: string): Promise<void> {
    await fetchJson(`${API_BASE_URL}/audits/${auditId}`, {
      method: 'DELETE'
    });
  },

  // Infrastructure Audits
  async getInfrastructureAudits(): Promise<InfrastructureAudit[]> {
    return fetchJson<InfrastructureAudit[]>(`${API_BASE_URL}/infrastructure-audits`);
  },

  async getInfrastructureAuditBySchool(schoolId: string): Promise<InfrastructureAudit | null> {
    try {
      const results = await fetchJson<InfrastructureAudit[]>(`${API_BASE_URL}/infrastructure-audits?schoolId=${schoolId}`);
      return results.length > 0 ? results[0] : null;
    } catch (e) {
      return null;
    }
  },

  async addInfrastructureAudit(audit: InfrastructureAudit): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...auditData } = audit;
    await fetchJson(`${API_BASE_URL}/infrastructure-audits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auditData)
    });
  },

  async updateInfrastructureAudit(audit: InfrastructureAudit): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...auditData } = audit;
    await fetchJson(`${API_BASE_URL}/infrastructure-audits/${audit.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auditData)
    });
  },

  async deleteInfrastructureAudit(auditId: string): Promise<void> {
    await fetchJson(`${API_BASE_URL}/infrastructure-audits/${auditId}`, {
      method: 'DELETE'
    });
  },

  // Search by access code (for public access)
  async getAuditByAccessCode(accessCode: string): Promise<Audit | InfrastructureAudit | null> {
    try {
      // Try regular audits first
      const audits = await fetchJson<Audit[]>(`${API_BASE_URL}/audits?accessCode=${accessCode}`);
      if (audits.length > 0) return audits[0];

      // Try infrastructure audits
      const infraAudits = await fetchJson<InfrastructureAudit[]>(`${API_BASE_URL}/infrastructure-audits?accessCode=${accessCode}`);
      if (infraAudits.length > 0) return infraAudits[0];

      return null;
    } catch (e) {
      return null;
    }
  },

  // Device Management
  async getDevices(): Promise<Device[]> {
    return fetchJson<Device[]>(`${API_BASE_URL}/devices`);
  },

  async getDeviceById(deviceId: string): Promise<Device | null> {
    try {
      return await fetchJson<Device>(`${API_BASE_URL}/devices/${deviceId}`);
    } catch (e) {
      return null;
    }
  },

  async addDevice(device: Device): Promise<void> {
    await fetchJson(`${API_BASE_URL}/devices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(device)
    });
  },

  async updateDevice(device: Device): Promise<void> {
    await fetchJson(`${API_BASE_URL}/devices/${device.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(device) // Send full object including ID
    });
  },

  // Login Sessions
  async getLoginSessions(): Promise<LoginSession[]> {
    return fetchJson<LoginSession[]>(`${API_BASE_URL}/login-sessions`);
  },

  async addLoginSession(session: LoginSession): Promise<void> {
    await fetchJson(`${API_BASE_URL}/login-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session)
    });
  },

  async updateLoginSession(sessionId: string, updates: Partial<LoginSession>): Promise<void> {
    await fetchJson(`${API_BASE_URL}/login-sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  }
};
