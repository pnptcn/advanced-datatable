export interface Logging {
    debug: (message: string, identity: string) => void;
    info: (message: string, identity: string) => void;
    warn: (message: string, identity: string) => void;
    error: (message: string, identity: string) => void;
}

export const Logger = (): Logging => {
    return {
        debug: (message: string, identity: string) => {
            console.debug(identity, message);
        },
        info: (message: string, identity: string) => {
            console.info(identity, message);
        },
        warn: (message: string, identity: string) => {
            console.warn(identity, message);
        },
        error: (message: string, identity: string) => {
            console.error(identity, message);
        }
    };
};

export default Logger;