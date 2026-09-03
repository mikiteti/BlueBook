import {
    readTextFile,
    writeTextFile,
    readDir,
    mkdir,
    remove,
    rename,
    exists
} from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";

const generateNewUrl = async (table) => {
    const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let url = "";
    const randomBytes = crypto.randomBytes(20); // universally unique

    for (let i = 0; i < 20; i++) url += abc[randomBytes[i] % abc.length];

    return url;
};

const endpoints = {
    hello: () => {
        console.log("hello world");
        return "Hello"
    },
    makeDataDir: async () => {
        const dir = await appDataDir();
        await mkdir(dir, { recursive: true });

        const file = await join(dir, "hello.txt");
        await writeTextFile(file, "hello world");

        console.log("created hello.txt in ", dir);

        return;
    },

}

export default endpoints;
