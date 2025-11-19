export class ILogger {
  info(message, ...args) {
    throw new Error("info method must be implemented");
  }

  error(message, ...args) {
    throw new Error("error method must be implemented");
  }

  warn(message, ...args) {
    throw new Error("warn method must be implemented");
  }

  debug(message, ...args) {
    throw new Error("debug method must be implemented");
  }
}

