# @polkadot-api/wasm-executor

This package has been strongly influenced by [Chopsticks](https://github.com/AcalaNetwork/chopsticks).
Its usage is only recommended and supported in NodeJS environments.

At this point, it just exports a `getMetadataFromRuntime` function that runs WASM under the hood, and returns its metadata in `string`.

```ts
import { getMetadataFromRuntime } from "@polkadot-api/wasm-executor";

// IMPORTANT to prefix it with `0x`!
const runtime = "0x" + fs.readFileSync("runtime.wasm").toString("hex");

// returns a `0x` prefixed OpaqueMetadata. It's as well prefixed by a compactInt of its length
const metadata = getMetadataFromRuntime(runtime);
```
