export type AbletonFile = {
    extract: Record<string, string>;
    infos: Record<string, string>;
    analyse: Record<string, string>;
}

export const versions = '/Ableton[@*]'
export const ableton_11_paths: AbletonFile = {
    extract: {
        tracks: '/Ableton/LiveSet/Tracks/*',
        master: '/Ableton/LiveSet/MasterTrack',
        PreHearTrack: '/Ableton/LiveSet/PreHearTrack',
        scene: '/Ableton/LiveSet/Scenes/*',
        locators: '/Ableton/LiveSet/Locators',

    },
    infos: {
        nextPointer: '/Ableton/LiveSet/NextPointeeId[@Value]',
    },
    analyse: {
        bpm: '/Ableton/LiveSet/Tempo[@Value]',
        key: '/Ableton/LiveSet/Key[@Value]',
        plugins: '/Ableton/LiveSet/Tracks/*/DeviceChain/*/',
    }
}

//TODO! Apply paths for Ableton 12;
export const ableton_12_paths: AbletonFile = {
    extract: {},
    infos: {},
    analyse: {}
};