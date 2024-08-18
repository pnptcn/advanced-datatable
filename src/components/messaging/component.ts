import { Logger, type Logging } from '../../logging';
import type { Channel, Identity } from '../../types/artifact';
import { ArtifactFactory } from '../artifact';

const worker = new Worker(new URL("./worker.js", import.meta.url));

export const Messaging = () => {
    const logging = Logger();
    
    const subscribe = (identity: Identity, channel: Channel, port: MessagePort): void => {
        const msgFactory = ArtifactFactory({
            identity,
            channel,
            type: "text/plain"
        });

        worker.postMessage(msgFactory.cmd(
            "subscribe",
            "register",
            { port: port } // Add a payload object containing the port
        ), [port]);

        logging.debug(`Subscribed to channel: ${channel} with identity: ${identity}`, 'Messaging');
    };

    return {
        subscribe
    };
};

export default Messaging;