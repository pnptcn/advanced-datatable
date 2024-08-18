/*
Artifact is a message wrapper that provides a payload with additional metadata that can
be understood by any receiver. The fields and their intended purpose are as follows:

- uuid: A unique identifier for the artifact, for traceability.
- timestamp: The time the artifact was created, in milliseconds since the epoch.
- identity: The identity of the sender, example: "upload", "datatable", "external-origin.com".
- channel: The channel the artifact is sent on, example: "broadcast", "data", "command".
- topic: The topic the artifact is sent on, example: "employees.csv", "companies.json".
- type: The media type of the artifact, example: "application/json", "application/csv".
- role: The role of the sender, example: "publisher", "subscriber".
- scope: The scope of the artifact, example: "import", "transform", "query", "register".
- payload: The payload of the artifact, any type of data can be included.
*/
export interface Artifact {
    uuid: string;
    timestamp: number;
    identity: Identity;
    channel: Channel;
    topic: string;
    type: Type;
    role: Role;
    scope: Scope;
    payload: any;
}

export type Identity = "upload" | "datatable" | "nodegraph";
export type Channel = "broadcast" | "data" | "command";
export type Type = "text/plain" | "application/json" | "application/csv";
export type Role = "publisher" | "subscriber";
export type Scope = "load" | "transform" | "query" | "register";