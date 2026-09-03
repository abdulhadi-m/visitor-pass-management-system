const passModel = require('../models/passModel');
const checklogModel = require('../models/checklogModel');
const mongoose = require('mongoose');

exports.checkIn = async (req, res) => {
    const { passId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(passId)) {
        return res.status(400).json({ error: `${passId} Pass not found` });
    }    
    try {
        const guardId = req.user._id;

        // 1. Verify pass existence
        const existingPass = await passModel.findById(passId);
        if (!existingPass) {
            return res.status(404).json({ error: 'Pass not found!' });
        }
        if (new Date() > new Date(existingPass.validUntil)) {
            return res.status(400).json({ error: 'The pass has expired' });
        }

        // 2. Atomic status transition on Pass to prevent concurrent double check-in race conditions
        const pass = await passModel.findOneAndUpdate(
            { _id: passId, status: { $ne: 'Checked In' } },
            { status: 'Checked In' },
            { new: true }
        );

        if (!pass) {
            // Already checked in or invalid state
            const currentPass = await passModel.findById(passId);
            if (currentPass?.status === 'Checked In') {
                return res.status(400).json({ error: 'Visitor is already checked in' });
            }
            return res.status(400).json({ error: 'Unable to check in pass' });
        }

        // 3. Prevent duplicate active logs if an unclosed checklog already exists for this pass
        const existingActiveLog = await checklogModel.findOne({
            passId,
            $or: [{ checkOut: null }, { checkOut: { $exists: false } }]
        });

        if (existingActiveLog) {
            return res.status(200).json(existingActiveLog);
        }

        // 4. Create the single active check-in log entry
        const checkInLog = await checklogModel.create({
            passId,
            guardId,
            checkIn: new Date(),
            checkOut: null
        });

        res.status(201).json(checkInLog);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.checkOut = async (req, res) => {
    const { passId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(passId)) {
        return res.status(400).json({ error: `${passId} Pass not found` });
    }
    try {
        // 1. Atomically close any open check-in log for this pass
        const activeLog = await checklogModel.findOneAndUpdate(
            {
                passId,
                $or: [{ checkOut: null }, { checkOut: { $exists: false } }]
            },
            { checkOut: new Date() },
            { new: true, sort: { createdAt: -1 } }
        );

        if (!activeLog) {
            // Check if already checked out
            const pass = await passModel.findById(passId);
            if (pass && pass.status === 'Checked Out') {
                const latestLog = await checklogModel.findOne({ passId }).sort({ createdAt: -1 });
                return res.status(200).json(latestLog || { message: 'Visitor already checked out' });
            }
            return res.status(400).json({ error: 'Visitor is not currently checked in' });
        }

        // 2. Clean up any remaining open orphan logs for this pass if legacy duplicates existed
        await checklogModel.updateMany(
            {
                passId,
                _id: { $ne: activeLog._id },
                $or: [{ checkOut: null }, { checkOut: { $exists: false } }]
            },
            { checkOut: activeLog.checkOut }
        );

        // 3. Atomically update pass status
        await passModel.findByIdAndUpdate(passId, { status: 'Checked Out' });

        res.status(200).json(activeLog);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getAllLogs = async (req, res) => {
    try {
        const logs = await checklogModel.find()
            .sort({ createdAt: -1 })
            .populate('guardId', 'name email role')
            .populate({
                path: 'passId',
                populate: {
                    path: 'appointmentId',
                    populate: [
                        { path: 'visitorId', select: 'name email phone purpose photo_url' },
                        { path: 'hostId', select: 'name email' }
                    ]
                }
            });

        // Deduplicate any legacy duplicate logs created within the same 5-second window
        const seen = new Set();
        const deduplicatedLogs = [];

        for (const log of logs) {
            const passIdStr = log.passId?._id ? log.passId._id.toString() : (log.passId ? log.passId.toString() : 'unknown');
            const checkInWindow = log.checkIn ? Math.floor(new Date(log.checkIn).getTime() / 5000) : 'none';
            const signature = `${passIdStr}-${checkInWindow}`;

            if (!seen.has(signature)) {
                seen.add(signature);
                deduplicatedLogs.push(log);
            }
        }

        res.status(200).json(deduplicatedLogs);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};