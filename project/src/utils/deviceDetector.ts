// Device detection utility for tracking login sessions

export interface DeviceInfo {
    browser: string;
    os: string;
    device: string;
    userAgent: string;
}

export const deviceDetector = {
    getDeviceInfo(): DeviceInfo {
        const userAgent = navigator.userAgent;

        return {
            browser: this.getBrowser(userAgent),
            os: this.getOS(userAgent),
            device: this.getDeviceType(userAgent),
            userAgent: userAgent
        };
    },

    getBrowser(userAgent: string): string {
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
        if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
        if (userAgent.includes('Edg')) return 'Edge';
        if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
        if (userAgent.includes('MSIE') || userAgent.includes('Trident')) return 'Internet Explorer';
        return 'Unknown';
    },

    getOS(userAgent: string): string {
        if (userAgent.includes('Windows NT 10.0')) return 'Windows 10/11';
        if (userAgent.includes('Windows NT 6.3')) return 'Windows 8.1';
        if (userAgent.includes('Windows NT 6.2')) return 'Windows 8';
        if (userAgent.includes('Windows NT 6.1')) return 'Windows 7';
        if (userAgent.includes('Windows')) return 'Windows';
        if (userAgent.includes('Mac OS X')) {
            const match = userAgent.match(/Mac OS X (\d+[._]\d+)/);
            return match ? `macOS ${match[1].replace('_', '.')}` : 'macOS';
        }
        if (userAgent.includes('Android')) {
            const match = userAgent.match(/Android (\d+\.?\d*)/);
            return match ? `Android ${match[1]}` : 'Android';
        }
        if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
            const match = userAgent.match(/OS (\d+_\d+)/);
            return match ? `iOS ${match[1].replace('_', '.')}` : 'iOS';
        }
        if (userAgent.includes('Linux')) return 'Linux';
        return 'Unknown';
    },

    getDeviceType(userAgent: string): string {
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
            return 'tablet';
        }
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
            return 'mobile';
        }
        return 'desktop';
    },

    async getIPAddress(): Promise<string> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout for IP

            const response = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await response.json();
            return data.ip || 'Unknown';
        } catch (error) {
            console.error('Failed to fetch IP:', error);
            return 'Unknown';
        }
    },

    async getLocation(ip: string): Promise<{ city?: string; country?: string }> {
        try {
            if (ip === 'Unknown') return {};

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout for location

            const response = await fetch(`https://ipapi.co/${ip}/json/`, { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await response.json();

            return {
                city: data.city,
                country: data.country_name
            };
        } catch (error) {
            console.error('Failed to fetch location:', error);
            return {};
        }
    }
};
