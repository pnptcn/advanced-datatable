const channels = {};
const messageQueues = {};

onmessage = (event) => {
    const artifact = event.data;

    if (artifact.scope === "register") {
        if (!channels[artifact.channel]) {
            channels[artifact.channel] = new Set();
        }

        const port = artifact.payload.port;
        port.onmessage = (e) => handleMessage(e, port);
        channels[artifact.channel].add(port);
        port.start();
        console.log(`Port registered for channel ${artifact.channel} by ${artifact.identity}. Total ports: ${channels[artifact.channel].size}`);

        // Send queued messages for this channel
        if (messageQueues[artifact.channel]) {
            messageQueues[artifact.channel].forEach(queuedMsg => {
                if (queuedMsg.identity !== artifact.identity) {
                    port.postMessage(queuedMsg);
                }
            });
            delete messageQueues[artifact.channel];
        }
    } else {
        handleMessage(event);
    }
};

const handleMessage = (event, senderPort) => {
    const artifact = event.data;
    
    if (channels[artifact.channel]) {
        channels[artifact.channel].forEach((port) => {
            if (port !== senderPort) {
                port.postMessage(artifact);
            }
        });
    } else {
        // Queue the message if there are no subscribers yet
        if (!messageQueues[artifact.channel]) {
            messageQueues[artifact.channel] = [];
        }
        messageQueues[artifact.channel].push(artifact);
        console.log(`Message queued for channel: ${artifact.channel}`);
    }
};

self.addEventListener("error", (error) => {
    console.error("Worker error:", error);
});

console.log("Worker initialized and ready to handle messages");