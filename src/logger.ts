import { DEV } from "./env.js"

export const devLog = (...args: any[]) => {
    if (!DEV) return;
    console.log(...args)
}
