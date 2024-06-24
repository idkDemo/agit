type Action = {
    href: string,
    header: {
        key: string
    }
}
export type TransferError = {
    code: number,
    message: string
}
export type Event = UploadEvent | DownloadEvent | CompleteEvent | ProgressEvent | TerminateEvent

export type UploadEvent = {
    event: 'upload',
    oid: string,
    size: number,
    path: string
    action: Action
}
export type DownloadEvent = {
    event: 'download',
    oid: string,
    size: number,
    action: Action
}
export type CompleteEvent = {
    event: 'complete',
    oid: string,
    path?: string
    error?: TransferError
}
export type ProgressEvent = {
    event: 'progress',
    oid: string,
    bytesSoFar: number,
    bytesSinceLast: number
}
export type TerminateEvent = {
    event: 'terminate'
}

export type FolderPath = string;
export type FilePath = string;
