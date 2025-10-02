export class BadRequestError extends Error {
  status = 400
  constructor(message = 'Bad Request') {
    super(message)
    this.name = 'BadRequestError'
  }
}

export class NotFoundError extends Error {
  status = 404
  constructor(message = 'Not Found') {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class RateLimitError extends Error {
  status = 429
  retryAfter: number
  constructor(message = 'Too Many Requests', retryAfter = 60 * 1000) {
    super(message)
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
  }
}

const ErrorTypes = {
  BadRequestError,
  NotFoundError,
  RateLimitError
}

export default ErrorTypes
