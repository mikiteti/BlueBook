import {
    readTextFile,
    writeTextFile,
    readDir,
    mkdir,
    remove,
    rename,
    exists
} from "@tauri-apps/plugin-fs";

const endpoints = {
    hello: () => {
        console.log("hello world");
        return "Hello"
    },
    test: async () => {
        const fileExists = await exists("notes/example.md");
        console.log(fileExists);
        return fileExists;
    }
}

export default endpoints;
