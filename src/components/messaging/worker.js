const channels = {};

onmessage = (event) => {
    const { channel, role, scope, payload } = event.data;

    if (scope === "register") {
        if (!channels[channel]) {
            channels[channel] = new Set();
        }

        if (event.ports && event.ports.length) {
            const port = payload;
            port.onmessage = handleMessage
            channels[channel].add(port);
            port.start();
            console.log(`Port registered for channel ${channel}. Total ports: ${channels[channel].size}`);
        }
    } else {
        handleMessage(event)
    }
};

const handleMessage = (event) => {
    const { channel, role, scope, payload } = event.data;
    if (channels[channel]) {
        channels[channel].forEach((port) => {
            port.postMessage(event.data);  // Forward the message
        });
    } else {
        console.warn(`No registered ports for channel: ${channel}`);
    }
}

self.addEventListener("error", (error) => {
    console.error("Worker error:", error);
});

console.log("Worker initialized and ready to handle messages");
