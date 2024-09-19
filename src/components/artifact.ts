import { 
    type Artifact, 
    type Channel, 
    type Identity, 
    type Role, 
    type Scope, 
    type Type 
} from "../types/artifact";

/*
Props defines the immutable properties of an artifact factory.
A component that needs to communicate on multiple channels, or dealing with multiple types,
will need to create multiple artifact factories.
*/
export interface Props {
    identity: Identity;
    channel: Channel;
    type: Type;
}

/*
ArtifactFactory is the only legitimate way to create messages, just as artifacts are the
only legitimate way to facilitate inter-component communication.
*/
export const ArtifactFactory = ({ identity, channel, type }: Props) => {
    const init = (
        topic: string,
        role: Role,
        scope: Scope,
        payload: any
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
        topic: string,
        scope: Scope,
        payload: any,
    ): Artifact => {
        return validate(init(topic, "publisher", scope, payload));
    };

    const msg = (
        topic: string,
        role: Role, 
        scope: Scope, 
        payload: any
    ) => {
        return validate(init(topic, role, scope, payload));
    }

    const validate = (artifact: Artifact): Artifact => {
        for (const key of [
            "uuid",
            "timestamp",
            "identity",
            "channel",
            "topic",
            "type",
            "role",
            "scope",
            "payload",
        ] as (keyof Artifact)[]) {
            if (artifact[key] === undefined || artifact[key] === null) {
                throw new Error(`${key} is missing or invalid`);
            }
        }

        return artifact;
    };

    return { msg, cmd, validate };
};

export default ArtifactFactory;