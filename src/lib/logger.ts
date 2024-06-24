import chalk from "chalk";
export const Levels = {
    OFF: 0,
    DEBUG: 1,
    INFO: 2,
    WARN: 3,
    ERROR: 4,
}
export function hookConsole(level: number) {
    if (level >= Levels.DEBUG) hookConsoleDebug();
    if (level >= Levels.INFO) {
        hookConsoleInfo()
        desactivate('debug');
    };
    if (level >= Levels.WARN) {
        hookConsoleWarn()
        desactivate('debug', 'info');
    };
    if (level >= Levels.ERROR) {
        desactivate('debug', 'info', 'warn');
        hookConsoleError()
    };
}

export function hookConsoleDebug() {
    const original = console.debug;
    console.debug = function (...args: any[]) {
        args.map((arg) => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg);
        chalk.blue(args);
        args.unshift(chalk.blue('[ DEBUG ]'));
        original.apply(console, args);
    }
}

export function hookConsoleInfo() {
    const original = console.info;
    console.info = function (...args: any[]) {
        args.map((arg) => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg);
        chalk.bold(args);
        args.unshift(chalk.blueBright('[ INFO ]'));
        original.apply(console, args);
    }
}

export function hookConsoleError() {
    const original = console.error;
    console.error = function (...args: any[]) {
        args.map((arg) => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg);
        chalk.red(args);
        args.unshift(chalk.red('[ ERROR ]'));
        original.apply(console, args);
    }
}

export function hookConsoleWarn() {
    const original = console.warn;
    console.warn = function (...args: any[]) {
        args.map((arg) => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg);
        chalk.yellow(args);
        args.unshift(chalk.yellow('[ WARN ]'));
        original.apply(console, args);
    }
}

export function hookConsoleLog() {
    const original = console.log;
    console.log = function (...args: any[]) {
        original.apply(console, args);
    }
}

export function hookConsoleTrace() {
    const original = console.trace;
    console.trace = function (...args: any[]) {
        original.apply(console, args);
    }
}

export function desactivate(...type: Array<'debug' | 'info' | 'error' | 'warn' | 'log' | 'trace'>) {
    type.forEach(t => console[t] = () => { });
}