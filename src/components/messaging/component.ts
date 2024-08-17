import { Logger, type Logging } from '../../logging';
import { type Artifact } from '../artifact';

interface SubscribeMessage {
    channel: string;
    role: "channel";
    scope: "register";
    payload: MessagePort;
}

const worker = new Worker(new URL("./worker.js", import.meta.url));

export const Messaging = () => {
    const logging = Logger();
    
    const subscribe = (channel: string, port: MessagePort): void => {
        // Register the channel in the worker
        const message: SubscribeMessage = {
            channel: channel,
            role: "channel",
            scope: "register",
            payload: port
        };

        // Send the message to the worker with the MessagePort for communication
        worker.postMessage(message, [port]);
        logging.debug(`Subscribed to channel: ${channel}`, 'Messaging');
    };

    return {
        subscribe
    };
};

export default Messaging;