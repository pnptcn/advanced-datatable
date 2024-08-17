export interface ArtifactPayload {
    [key: string]: any;
}

export interface Artifact {
    uuid: string;
    timestamp: number;
    identity: string;
    channel: string;
    topic: string;
    type: string;
    role: string;
    scope: string;
    payload: ArtifactPayload;
}

export const ArtifactFactory = () => {
    const get = (
        payload: ArtifactPayload,
        identity: string = "anonymous",
        channel: string = "broadcast",
        topic: string = "data",
        type: string = "application/json",
        role: string = "publisher",
        scope: string = "import"
    ): Artifact => {
        return {
            uuid: window.crypto.randomUUID(),
            timestamp: Date.now(),
            identity,
            channel,
            topic,
            type,
            role,
            scope,
            payload,
        };
    };

    const cmd = (
        identity: string,
        topic: string,
        scope: string,
        payload: ArtifactPayload,
        channel: string = "broadcast"
    ): Artifact => {
        return get(payload, identity, channel, topic, "application/json", "command", scope);
    };

    const validate = (artifact: Artifact): boolean => {
        const requiredKeys: (keyof Artifact)[] = [
            "uuid",
            "timestamp",
            "identity",
            "channel",
            "topic",
            "type",
            "role",
            "scope",
            "payload",
        ];

        for (const key of requiredKeys) {
            if (!artifact[key]) {
                throw new Error(`${key} is missing or invalid`);
            }
        }

        if (typeof artifact.uuid !== "string" || artifact.uuid.length === 0) {
            throw new Error("Invalid UUID");
        }

        if (typeof artifact.timestamp !== "number" || artifact.timestamp <= 0) {
            throw new Error("Invalid timestamp");
        }

        return true;
    };

    return { get, cmd, validate };
};

export default ArtifactFactory;