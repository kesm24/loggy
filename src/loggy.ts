import chalk from "chalk";
import path from "path";
import fs from "fs";

type Level = "debug" | "info" | "warn" | "error" | "silly";
type Color = "green" | "blue" | "yellow" | "red" | "magenta";
type LogMethod = (context: Context, message: string) => void;
type DefaultContexts<T> = T | (string & {});
type Context = DefaultContexts<
    | "APP"
    | "CLIENT"
    | "CONFIG"
    | "DATABASE"
    | "ENV"
    | "SERVER"
    | "SYSTEM"
    | "TEST"
>;

export default class Loggy {
    private static config = {
        env: process.env.NODE_ENV || "development",
        allowInProduction: {
            debug: false,
            info: true,
            warn: true,
            error: true,
            silly: false
        },
        writeToFile: false,
        logFilepath: path.resolve(process.cwd(), "./logs")
    };

    public static overrideEnv = (env: string) => {
        this.config.env = env;
    };

    public static setProductionVisibility = (
        ...args:
            | [level: Level, value: boolean]
            | [settings: { [T in Level]?: boolean }]
    ) => {
        if (args.length === 2) {
            const [level, value] = args;
            this.config.allowInProduction[level as Level] = value;
        } else {
            const [settings] = args;
            const config = this.config.allowInProduction;
            this.config.allowInProduction = { ...config, ...settings };
        }
    };

    public static enableFileLogs = (logFilepath?: string) => {
        this.config.writeToFile = true;
        if (logFilepath)
            this.config.logFilepath = path.resolve(process.cwd(), logFilepath);
        this.establishWriteStream();
    };

    private static writeStream: fs.WriteStream;

    private static establishWriteStream = () => {
        const { logFilepath } = this.config;
        const dirExists = fs.existsSync(logFilepath);
        if (!dirExists) {
            fs.mkdirSync(logFilepath);
        }
        this.writeStream = fs.createWriteStream(
            path.resolve(logFilepath, `${this.config.env}.log`)
        );
    };

    private static log = (context: Context, level: Level, message: string) => {
        if (
            this.config.env === "production" &&
            !this.config.allowInProduction[level]
        )
            return;

        let color: Color;
        switch (level) {
            case "debug":
                color = "green";
                break;
            case "info":
                color = "blue";
                break;
            case "warn":
                color = "yellow";
                break;
            case "error":
                color = "red";
                break;
            case "silly":
                color = "magenta";
                break;
        }

        const metadata = `[${new Date().toLocaleString()}] | ${
            context.length > 0 ? `[${context}]:` : ""
        }[${level.toUpperCase()}] -`;
        const output = [
            chalk[color](metadata),
            chalk[`${color}Bright`](message)
        ];

        if (this.config.writeToFile && this.writeStream)
            this.writeStream.write(`${metadata} ${message}\n`);
        if (level === "silly") return console.log(...output);
        return console[level](...output);
    };
    public static info: LogMethod = (context, message) => {
        this.log(context, "info", message);
    };
    public static warn: LogMethod = (context, message) => {
        this.log(context, "warn", message);
    };
    public static debug: LogMethod = (context, message) => {
        this.log(context, "debug", message);
    };
    public static error: LogMethod = (context, message) => {
        this.log(context, "error", message);
    };
    public static silly: LogMethod = (context, message) => {
        this.log(context, "silly", message);
    };
}
