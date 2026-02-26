/**
 * Task Error Classes
 * 
 * Standardized error types for task-core operations.
 * These errors provide consistent error handling across MCP and REST implementations.
 */

/**
 * Base error class for all task-related errors
 */
export class TaskError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly details?: Record<string, any>

  constructor(
    message: string,
    code: string,
    statusCode: number,
    details?: Record<string, any>
  ) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    this.details = details
    
    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * Convert error to JSON-serializable object
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details
    }
  }
}

/**
 * Task not found error
 * Thrown when a task doesn't exist or user doesn't have access
 */
export class TaskNotFoundError extends TaskError {
  constructor(taskId: string, userId?: string) {
    super(
      `Task not found: ${taskId}`,
      'TASK_NOT_FOUND',
      404,
      { taskId, userId }
    )
  }
}

/**
 * Task validation error
 * Thrown when task data fails validation
 */
export class TaskValidationError extends TaskError {
  constructor(message: string, validationErrors?: Record<string, any>) {
    super(
      `Task validation failed: ${message}`,
      'TASK_VALIDATION_ERROR',
      400,
      { validationErrors }
    )
  }
}

/**
 * Task already exists error
 * Thrown when attempting to create a duplicate task
 */
export class TaskAlreadyExistsError extends TaskError {
  constructor(taskId: string) {
    super(
      `Task already exists: ${taskId}`,
      'TASK_ALREADY_EXISTS',
      409,
      { taskId }
    )
  }
}

/**
 * Task state error
 * Thrown when operation is invalid for current task state
 */
export class TaskStateError extends TaskError {
  constructor(message: string, currentState: string, expectedState?: string) {
    super(
      message,
      'TASK_STATE_ERROR',
      409,
      { currentState, expectedState }
    )
  }
}

/**
 * Milestone not found error
 * Thrown when a milestone doesn't exist in a task
 */
export class MilestoneNotFoundError extends TaskError {
  constructor(milestoneId: string, taskId: string) {
    super(
      `Milestone not found: ${milestoneId} in task ${taskId}`,
      'MILESTONE_NOT_FOUND',
      404,
      { milestoneId, taskId }
    )
  }
}

/**
 * Task item not found error
 * Thrown when a task item doesn't exist in a task
 */
export class TaskItemNotFoundError extends TaskError {
  constructor(itemId: string, taskId: string) {
    super(
      `Task item not found: ${itemId} in task ${taskId}`,
      'TASK_ITEM_NOT_FOUND',
      404,
      { itemId, taskId }
    )
  }
}

/**
 * Task message not found error
 * Thrown when a message doesn't exist in a task
 */
export class TaskMessageNotFoundError extends TaskError {
  constructor(messageId: string, taskId: string) {
    super(
      `Message not found: ${messageId} in task ${taskId}`,
      'TASK_MESSAGE_NOT_FOUND',
      404,
      { messageId, taskId }
    )
  }
}

/**
 * Task authorization error
 * Thrown when user doesn't have permission for an operation
 */
export class TaskAuthorizationError extends TaskError {
  constructor(operation: string, userId: string, taskId?: string) {
    super(
      `User ${userId} not authorized to ${operation}${taskId ? ` task ${taskId}` : ''}`,
      'TASK_AUTHORIZATION_ERROR',
      403,
      { operation, userId, taskId }
    )
  }
}

/**
 * Task database error
 * Thrown when a database operation fails
 */
export class TaskDatabaseError extends TaskError {
  constructor(message: string, originalError?: Error) {
    super(
      `Database error: ${message}`,
      'TASK_DATABASE_ERROR',
      500,
      { originalError: originalError?.message }
    )
  }
}

/**
 * Task configuration error
 * Thrown when task configuration is invalid
 */
export class TaskConfigurationError extends TaskError {
  constructor(message: string, configKey?: string) {
    super(
      `Configuration error: ${message}`,
      'TASK_CONFIGURATION_ERROR',
      400,
      { configKey }
    )
  }
}

/**
 * Task limit exceeded error
 * Thrown when a limit is exceeded (e.g., max tasks, max messages)
 */
export class TaskLimitExceededError extends TaskError {
  constructor(limitType: string, limit: number, current: number) {
    super(
      `${limitType} limit exceeded: ${current}/${limit}`,
      'TASK_LIMIT_EXCEEDED',
      429,
      { limitType, limit, current }
    )
  }
}

/**
 * Task operation timeout error
 * Thrown when an operation takes too long
 */
export class TaskOperationTimeoutError extends TaskError {
  constructor(operation: string, timeoutMs: number) {
    super(
      `Operation timed out: ${operation} (${timeoutMs}ms)`,
      'TASK_OPERATION_TIMEOUT',
      408,
      { operation, timeoutMs }
    )
  }
}

/**
 * Firebase connection error
 * Thrown when Firebase connection fails
 */
export class FirebaseConnectionError extends TaskError {
  constructor(message: string, originalError?: Error) {
    super(
      `Firebase connection error: ${message}`,
      'FIREBASE_CONNECTION_ERROR',
      503,
      { originalError: originalError?.message }
    )
  }
}

/**
 * Invalid input error
 * Thrown when input parameters are invalid
 */
export class InvalidInputError extends TaskError {
  constructor(paramName: string, reason: string, value?: any) {
    super(
      `Invalid input for ${paramName}: ${reason}`,
      'INVALID_INPUT',
      400,
      { paramName, reason, value }
    )
  }
}

/**
 * Error code constants for easy reference
 */
export const TaskErrorCodes = {
  TASK_NOT_FOUND: 'TASK_NOT_FOUND',
  TASK_VALIDATION_ERROR: 'TASK_VALIDATION_ERROR',
  TASK_ALREADY_EXISTS: 'TASK_ALREADY_EXISTS',
  TASK_STATE_ERROR: 'TASK_STATE_ERROR',
  MILESTONE_NOT_FOUND: 'MILESTONE_NOT_FOUND',
  TASK_ITEM_NOT_FOUND: 'TASK_ITEM_NOT_FOUND',
  TASK_MESSAGE_NOT_FOUND: 'TASK_MESSAGE_NOT_FOUND',
  TASK_AUTHORIZATION_ERROR: 'TASK_AUTHORIZATION_ERROR',
  TASK_DATABASE_ERROR: 'TASK_DATABASE_ERROR',
  TASK_CONFIGURATION_ERROR: 'TASK_CONFIGURATION_ERROR',
  TASK_LIMIT_EXCEEDED: 'TASK_LIMIT_EXCEEDED',
  TASK_OPERATION_TIMEOUT: 'TASK_OPERATION_TIMEOUT',
  FIREBASE_CONNECTION_ERROR: 'FIREBASE_CONNECTION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT'
} as const

/**
 * Type guard to check if an error is a TaskError
 */
export function isTaskError(error: unknown): error is TaskError {
  return error instanceof TaskError
}

/**
 * Helper to convert any error to a TaskError
 */
export function toTaskError(error: unknown): TaskError {
  if (isTaskError(error)) {
    return error
  }

  if (error instanceof Error) {
    return new TaskDatabaseError(error.message, error)
  }

  return new TaskDatabaseError(String(error))
}
