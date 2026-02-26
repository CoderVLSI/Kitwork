import { Config } from "@remotion/cli/config";

export default Config({
    entry: "src/index.ts",
    output: "out",
    codec: "h264",
    crf: 18,
    pixelsPerFrame: 1,
});
