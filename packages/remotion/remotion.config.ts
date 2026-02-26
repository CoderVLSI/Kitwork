import { Config } from "remotion";

const config: Config = {
    entry: "src/index.ts",
    output: "out",
    codec: "h264",
    crf: 18,
    pixelsPerFrame: 1,
};

export default config;
