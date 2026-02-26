/**
 * Task Errors Module
 * 
 * Export all error classes and utilities
 */

export {
  // Base error
  TaskError,
  
  // Specific errors
  TaskNotFoundError,
  TaskValidationError,
  TaskAlreadyExistsError,
  TaskStateError,
  MilestoneNotFoundError,
  TaskItemNotFoundError,
  TaskMessageNotFoundError,
  TaskAuthorizationError,
  TaskDatabaseError,
  TaskConfigurationError,
  TaskLimitExceededError,
  TaskOperationTimeoutError,
  FirebaseConnectionError,
  InvalidInputError,
  
  // Constants and utilities
  TaskErrorCodes,
  isTaskError,
  toTaskError
} from './task-errors.js'
