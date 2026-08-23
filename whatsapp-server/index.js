const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

const app = express();
app.use(cors());
app.use(express.json());

let qrCodeDataUrl = null;
let clientReady = false;

// Initialize WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
    }
});

client.on('qr', async (qr) => {
    console.log('QR Code generated. Please scan.');
    try {
        qrCodeDataUrl = await qrcode.toDataURL(qr);
    } catch (err) {
        console.error('Error generating QR Data URL', err);
    }
});

client.on('ready', () => {
    console.log('WhatsApp Web Client is READY!');
    clientReady = true;
    qrCodeDataUrl = null; // Clear QR once authenticated
});

client.on('disconnected', (reason) => {
    console.log('WhatsApp Web Client was disconnected:', reason);
    clientReady = false;
    // Client usually needs to be re-initialized if disconnected heavily, 
    // but LocalAuth handles auto-restarts for temporary drops.
});

// Start Client
client.initialize();

// API Endpoints
app.get('/api/wa/status', (req, res) => {
    res.json({
        ready: clientReady,
        qrCode: qrCodeDataUrl
    });
});

app.post('/api/wa/send', async (req, res) => {
    if (!clientReady) {
        return res.status(400).json({ error: 'WhatsApp client is not ready. Please scan QR first.' });
    }

    const { phone, message } = req.body;
    
    if (!phone || !message) {
        return res.status(400).json({ error: 'Phone and message are required.' });
    }

    try {
        // Format phone number to WhatsApp format (append @c.us)
        // Ensure phone doesn't have spaces or + signs
        let formattedPhone = phone.replace(/[^0-9]/g, '');
        if (!formattedPhone.endsWith('@c.us')) {
            formattedPhone = `${formattedPhone}@c.us`;
        }

        const response = await client.sendMessage(formattedPhone, message);
        res.json({ success: true, messageId: response.id.id });
    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json({ error: 'Failed to send message.' });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`WhatsApp Server running on port ${PORT}`);
});
