const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ message: 'School Audit API is running', status: 'healthy' });
});

app.get('/favicon.ico', (req, res) => res.status(204).send());

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://project1annd2_db_user:mKhiz4Uy6ObbAeGV@cluster0.dvnoiyy.mongodb.net/school_audit_db?appName=Cluster0')
    .then(() => {
        console.log('Connected to MongoDB');
    }).catch(err => {
        console.error('MongoDB connection error:', err);
    });

// Import Models
const School = require('./models/School');
const Teacher = require('./models/Teacher');
const Mentor = require('./models/Mentor');
const Audit = require('./models/Audit');
const InfrastructureAudit = require('./models/InfrastructureAudit');
const Device = require('./models/Device');
const LoginSession = require('./models/LoginSession');

// --- Schools ---
app.get('/api/schools', async (req, res) => {
    try {
        const { createdBy } = req.query;
        let query = {};
        if (createdBy) query.createdBy = createdBy;
        const schools = await School.find(query);
        res.json(schools.map(doc => ({ ...doc.toObject(), id: doc._id })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/schools/:id', async (req, res) => {
    try {
        const school = await School.findById(req.params.id);
        if (!school) return res.status(404).json({ error: 'School not found' });
        res.json({ ...school.toObject(), id: school._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/schools', async (req, res) => {
    try {
        const school = new School(req.body);
        const savedSchool = await school.save();
        res.json({ ...savedSchool.toObject(), id: savedSchool._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/schools/:id', async (req, res) => {
    try {
        const updatedSchool = await School.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ ...updatedSchool.toObject(), id: updatedSchool._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/schools/:id', async (req, res) => {
    try {
        await School.findByIdAndDelete(req.params.id);
        res.json({ message: 'School deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Teachers ---
app.get('/api/teachers', async (req, res) => {
    try {
        const { schoolId } = req.query;
        let query = {};
        if (schoolId) query.schoolId = schoolId;
        const teachers = await Teacher.find(query);
        res.json(teachers.map(doc => ({ ...doc.toObject(), id: doc._id })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/teachers/:id', async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
        res.json({ ...teacher.toObject(), id: teacher._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/teachers', async (req, res) => {
    try {
        const teacher = new Teacher(req.body);
        const savedTeacher = await teacher.save();
        res.json({ ...savedTeacher.toObject(), id: savedTeacher._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/teachers/:id', async (req, res) => {
    try {
        const updatedTeacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ ...updatedTeacher.toObject(), id: updatedTeacher._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/teachers/:id', async (req, res) => {
    try {
        await Teacher.findByIdAndDelete(req.params.id);
        res.json({ message: 'Teacher deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Mentors ---
app.get('/api/mentors', async (req, res) => {
    try {
        const { schoolId } = req.query;
        let query = {};
        if (schoolId) query.schoolId = schoolId;
        const mentors = await Mentor.find(query);
        res.json(mentors.map(doc => ({ ...doc.toObject(), id: doc._id })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/mentors/:id', async (req, res) => {
    try {
        const mentor = await Mentor.findById(req.params.id);
        if (!mentor) return res.status(404).json({ error: 'Mentor not found' });
        res.json({ ...mentor.toObject(), id: mentor._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/mentors', async (req, res) => {
    try {
        const mentor = new Mentor(req.body);
        const savedMentor = await mentor.save();
        res.json({ ...savedMentor.toObject(), id: savedMentor._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/mentors/:id', async (req, res) => {
    try {
        const updatedMentor = await Mentor.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ ...updatedMentor.toObject(), id: updatedMentor._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/mentors/:id', async (req, res) => {
    try {
        await Mentor.findByIdAndDelete(req.params.id);
        res.json({ message: 'Mentor deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Audits ---
app.get('/api/audits', async (req, res) => {
    try {
        const { subjectId, accessCode } = req.query;
        let query = {};
        if (subjectId) query.subjectId = subjectId;
        if (accessCode) query.accessCode = accessCode;

        const audits = await Audit.find(query);
        res.json(audits.map(doc => ({ ...doc.toObject(), id: doc._id })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/audits', async (req, res) => {
    try {
        const audit = new Audit(req.body);
        const savedAudit = await audit.save();
        res.json({ ...savedAudit.toObject(), id: savedAudit._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/audits/:id', async (req, res) => {
    try {
        const updatedAudit = await Audit.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ ...updatedAudit.toObject(), id: updatedAudit._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/audits/:id', async (req, res) => {
    try {
        await Audit.findByIdAndDelete(req.params.id);
        res.json({ message: 'Audit deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Infrastructure Audits ---
app.get('/api/infrastructure-audits', async (req, res) => {
    try {
        const { schoolId, accessCode } = req.query;
        let query = {};
        if (schoolId) query.schoolId = schoolId;
        if (accessCode) query.accessCode = accessCode;

        const audits = await InfrastructureAudit.find(query);
        res.json(audits.map(doc => ({ ...doc.toObject(), id: doc._id })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/infrastructure-audits', async (req, res) => {
    try {
        const audit = new InfrastructureAudit(req.body);
        const savedAudit = await audit.save();
        res.json({ ...savedAudit.toObject(), id: savedAudit._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/infrastructure-audits/:id', async (req, res) => {
    try {
        const updatedAudit = await InfrastructureAudit.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ ...updatedAudit.toObject(), id: updatedAudit._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/infrastructure-audits/:id', async (req, res) => {
    try {
        await InfrastructureAudit.findByIdAndDelete(req.params.id);
        res.json({ message: 'Infrastructure Audit deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Devices ---
app.get('/api/devices', async (req, res) => {
    try {
        const devices = await Device.find({});
        res.json(devices.map(doc => ({ ...doc.toObject(), id: doc._id })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/devices/:id', async (req, res) => {
    try {
        const device = await Device.findOne({ id: req.params.id });
        if (!device) return res.status(404).json({ error: 'Device not found' });
        // Return without _id if possible, or keep it. The frontend likely expects 'id' which is now in the doc.
        // We can just spread toObject() which will include 'id'.
        const { _id, ...rest } = device.toObject();
        res.json({ ...rest, _id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/devices', async (req, res) => {
    try {
        const device = new Device(req.body);
        const savedDevice = await device.save();
        const { _id, ...rest } = savedDevice.toObject();
        res.json({ ...rest, _id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/devices/:id', async (req, res) => {
    try {
        const updatedDevice = await Device.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true }
        );
        if (!updatedDevice) return res.status(404).json({ error: 'Device not found' });
        const { _id, ...rest } = updatedDevice.toObject();
        res.json({ ...rest, _id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/devices/:id', async (req, res) => {
    try {
        await Device.findOneAndDelete({ id: req.params.id });
        res.json({ message: 'Device deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Login Sessions ---
app.get('/api/login-sessions', async (req, res) => {
    try {
        const sessions = await LoginSession.find({});
        res.json(sessions.map(doc => {
            const { _id, ...rest } = doc.toObject();
            return { ...rest, _id };
        }));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/login-sessions', async (req, res) => {
    try {
        const session = new LoginSession(req.body);
        const savedSession = await session.save();
        const { _id, ...rest } = savedSession.toObject();
        res.json({ ...rest, _id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/login-sessions/:id', async (req, res) => {
    try {
        const updatedSession = await LoginSession.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true }
        );
        if (!updatedSession) return res.status(404).json({ error: 'Session not found' });
        const { _id, ...rest } = updatedSession.toObject();
        res.json({ ...rest, _id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
