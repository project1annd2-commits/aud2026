import { Employee, LoginSession, Device } from '../types';
import { employees } from '../data/employees';
import { storage } from './storage';
import { deviceDetector } from './deviceDetector';

const AUTH_STORAGE_KEY = 'currentEmployee';
const SESSION_ID_KEY = 'currentSessionId';
const DEVICE_ID_KEY = 'device_id';

const getDeviceId = (): string => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

export const auth = {
  // Initialize device if not exists (Auto-approval for existing logged-in users)
  async initDevice(employee: Employee): Promise<void> {
    const deviceId = getDeviceId();
    const existingDevice = await storage.getDeviceById(deviceId);

    if (!existingDevice) {
      const deviceInfo = deviceDetector.getDeviceInfo();
      const ipAddress = await deviceDetector.getIPAddress();

      // Grandfathering: If user is already logged in (passed as arg), approve immediately
      // If we are calling this during login attempt (fresh), status is pending
      const status = 'approved';

      const newDevice: Device = {
        id: deviceId,
        username: employee.username,
        name: `${deviceInfo.browser} on ${deviceInfo.os}`,
        type: deviceInfo.device as 'mobile' | 'tablet' | 'desktop',
        os: deviceInfo.os,
        browser: deviceInfo.browser,
        ipAddress,
        lastLoginAt: new Date().toISOString(),
        status: status,
        approvedAt: new Date().toISOString(),
        approvedBy: 'system_migration',
        createdAt: new Date().toISOString()
      };

      await storage.addDevice(newDevice);
    }
  },

  async login(username: string, password: string): Promise<{ employee: Employee | null; status?: string }> {
    const employee = employees.find(
      emp => emp.username === username && emp.password === password
    );

    if (employee) {
      // 1. Get/Create Device
      const deviceId = getDeviceId();
      let device = await storage.getDeviceById(deviceId);

      if (!device) {
        // New device for fresh login
        const deviceInfo = deviceDetector.getDeviceInfo();
        const ipAddress = await deviceDetector.getIPAddress();

        // Check for Grace Period: 2026-01-07
        const now = new Date();
        const isGracePeriod = now.getFullYear() === 2026 && now.getMonth() === 0 && now.getDate() === 7;

        let status: 'pending' | 'approved' = 'pending';
        let approvedBy: string | undefined;
        let approvedAt: string | undefined;

        if (employee.role === 'admin') {
          status = 'approved';
          approvedBy = 'system_admin_bypass';
          approvedAt = new Date().toISOString();
        } else if (isGracePeriod) {
          const allDevices = await storage.getDevices();
          const userApprovedDevices = allDevices.filter(d => d.username === employee.username && d.status === 'approved');

          if (userApprovedDevices.length === 0) {
            status = 'approved';
            approvedBy = 'system_grace_period';
            approvedAt = new Date().toISOString();
          }
        }

        device = {
          id: deviceId,
          username: employee.username,
          name: `${deviceInfo.browser} on ${deviceInfo.os}`,
          type: deviceInfo.device as 'mobile' | 'tablet' | 'desktop',
          os: deviceInfo.os,
          browser: deviceInfo.browser,
          ipAddress,
          lastLoginAt: new Date().toISOString(),
          status: status,
          approvedBy,
          approvedAt,
          createdAt: new Date().toISOString()
        };
        await storage.addDevice(device);

        if (status === 'pending') {
          return { employee: null, status: 'DEVICE_PENDING' };
        }
      }

      // 2. Check Device Status (Bypass for admins)
      if (employee.role !== 'admin') {
        if (device.status === 'pending') {
          return { employee: null, status: 'DEVICE_PENDING' };
        } else if (device.status === 'rejected') {
          return { employee: null, status: 'DEVICE_REJECTED' };
        }
      } else if (device.status !== 'approved') {
        // Auto-approve existing non-approved device if user is admin
        device.status = 'approved';
        device.approvedBy = 'system_admin_bypass';
        device.approvedAt = new Date().toISOString();
        await storage.updateDevice(device);
      }

      // 3. Approved -> Proceed
      // Update device last login
      await storage.updateDevice({ ...device, lastLoginAt: new Date().toISOString() });

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(employee));

      // Create login session with device tracking
      const ipAddress = await deviceDetector.getIPAddress();
      const location = await deviceDetector.getLocation(ipAddress);

      const session: LoginSession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username: employee.username,
        displayName: employee.displayName,
        role: employee.role,
        timestamp: new Date().toISOString(),
        deviceInfo: {
          browser: device.browser,
          os: device.os,
          device: device.type,
          userAgent: navigator.userAgent
        },
        ipAddress,
        location,
        status: 'active'
      };

      // Store session
      await storage.addLoginSession(session);
      localStorage.setItem(SESSION_ID_KEY, session.id);

      return { employee, status: 'SUCCESS' };
    }

    return { employee: null, status: 'INVALID_CREDENTIALS' };
  },

  async logout(): Promise<void> {
    // Update session status to logged_out
    const sessionId = localStorage.getItem(SESSION_ID_KEY);
    if (sessionId) {
      try {
        await storage.updateLoginSession(sessionId, {
          status: 'logged_out',
          logoutTimestamp: new Date().toISOString()
        });
      } catch (error) {
        console.warn('Failed to update session logout status:', error);
      }
    }

    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(SESSION_ID_KEY);
  },

  getCurrentEmployee(): Employee | null {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  },

  getCurrentSessionId(): string | null {
    return localStorage.getItem(SESSION_ID_KEY);
  },

  isAuthenticated(): boolean {
    return auth.getCurrentEmployee() !== null;
  }
};