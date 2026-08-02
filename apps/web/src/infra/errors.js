class ValidationError extends Error {
  constructor({ message, action }) {
    super(message);
    this.name = "ValidationError";
    this.action = action;
  }
}

class NotFoundError extends Error {
  constructor({ message, action }) {
    super(message);
    this.name = "NotFoundError";
    this.action = action;
  }
}

class UnauthorizedError extends Error {
  constructor({ message, action }) {
    super(message);
    this.name = "UnauthorizedError";
    this.action = action;
  }
}

module.exports = {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
};
