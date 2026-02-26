/**
 * Task Errors Tests
 */

import {
  TaskError,
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
  TaskErrorCodes,
  isTaskError,
  toTaskError
} from './task-errors'

describe('TaskError', () => {
  it('should create base error with all properties', () => {
    const error = new TaskError('Test error', 'TEST_CODE', 500, { key: 'value' })
    
    expect(error.message).toBe('Test error')
    expect(error.code).toBe('TEST_CODE')
    expect(error.statusCode).toBe(500)
    expect(error.details).toEqual({ key: 'value' })
    expect(error.name).toBe('TaskError')
  })

  it('should serialize to JSON', () => {
    const error = new TaskError('Test error', 'TEST_CODE', 500, { key: 'value' })
    const json = error.toJSON()
    
    expect(json).toEqual({
      name: 'TaskError',
      message: 'Test error',
      code: 'TEST_CODE',
      statusCode: 500,
      details: { key: 'value' }
    })
  })
})

describe('TaskNotFoundError', () => {
  it('should create error with task ID', () => {
    const error = new TaskNotFoundError('task-123')
    
    expect(error.message).toBe('Task not found: task-123')
    expect(error.code).toBe('TASK_NOT_FOUND')
    expect(error.statusCode).toBe(404)
    expect(error.details).toEqual({ taskId: 'task-123', userId: undefined })
  })

  it('should create error with task ID and user ID', () => {
    const error = new TaskNotFoundError('task-123', 'user-456')
    
    expect(error.details).toEqual({ taskId: 'task-123', userId: 'user-456' })
  })
})

describe('TaskValidationError', () => {
  it('should create validation error', () => {
    const validationErrors = { title: 'Required', description: 'Too long' }
    const error = new TaskValidationError('Invalid fields', validationErrors)
    
    expect(error.message).toBe('Task validation failed: Invalid fields')
    expect(error.code).toBe('TASK_VALIDATION_ERROR')
    expect(error.statusCode).toBe(400)
    expect(error.details).toEqual({ validationErrors })
  })
})

describe('TaskAlreadyExistsError', () => {
  it('should create already exists error', () => {
    const error = new TaskAlreadyExistsError('task-123')
    
    expect(error.message).toBe('Task already exists: task-123')
    expect(error.code).toBe('TASK_ALREADY_EXISTS')
    expect(error.statusCode).toBe(409)
    expect(error.details).toEqual({ taskId: 'task-123' })
  })
})

describe('TaskStateError', () => {
  it('should create state error', () => {
    const error = new TaskStateError(
      'Cannot complete task in not_started state',
      'not_started',
      'in_progress'
    )
    
    expect(error.message).toBe('Cannot complete task in not_started state')
    expect(error.code).toBe('TASK_STATE_ERROR')
    expect(error.statusCode).toBe(409)
    expect(error.details).toEqual({
      currentState: 'not_started',
      expectedState: 'in_progress'
    })
  })
})

describe('MilestoneNotFoundError', () => {
  it('should create milestone not found error', () => {
    const error = new MilestoneNotFoundError('milestone-1', 'task-123')
    
    expect(error.message).toBe('Milestone not found: milestone-1 in task task-123')
    expect(error.code).toBe('MILESTONE_NOT_FOUND')
    expect(error.statusCode).toBe(404)
    expect(error.details).toEqual({ milestoneId: 'milestone-1', taskId: 'task-123' })
  })
})

describe('TaskItemNotFoundError', () => {
  it('should create task item not found error', () => {
    const error = new TaskItemNotFoundError('item-1', 'task-123')
    
    expect(error.message).toBe('Task item not found: item-1 in task task-123')
    expect(error.code).toBe('TASK_ITEM_NOT_FOUND')
    expect(error.statusCode).toBe(404)
    expect(error.details).toEqual({ itemId: 'item-1', taskId: 'task-123' })
  })
})

describe('TaskMessageNotFoundError', () => {
  it('should create message not found error', () => {
    const error = new TaskMessageNotFoundError('msg-1', 'task-123')
    
    expect(error.message).toBe('Message not found: msg-1 in task task-123')
    expect(error.code).toBe('TASK_MESSAGE_NOT_FOUND')
    expect(error.statusCode).toBe(404)
    expect(error.details).toEqual({ messageId: 'msg-1', taskId: 'task-123' })
  })
})

describe('TaskAuthorizationError', () => {
  it('should create authorization error without task ID', () => {
    const error = new TaskAuthorizationError('delete', 'user-123')
    
    expect(error.message).toBe('User user-123 not authorized to delete')
    expect(error.code).toBe('TASK_AUTHORIZATION_ERROR')
    expect(error.statusCode).toBe(403)
    expect(error.details).toEqual({
      operation: 'delete',
      userId: 'user-123',
      taskId: undefined
    })
  })

  it('should create authorization error with task ID', () => {
    const error = new TaskAuthorizationError('update', 'user-123', 'task-456')
    
    expect(error.message).toBe('User user-123 not authorized to update task task-456')
    expect(error.details?.taskId).toBe('task-456')
  })
})

describe('TaskDatabaseError', () => {
  it('should create database error', () => {
    const originalError = new Error('Connection failed')
    const error = new TaskDatabaseError('Failed to connect', originalError)
    
    expect(error.message).toBe('Database error: Failed to connect')
    expect(error.code).toBe('TASK_DATABASE_ERROR')
    expect(error.statusCode).toBe(500)
    expect(error.details).toEqual({ originalError: 'Connection failed' })
  })
})

describe('TaskConfigurationError', () => {
  it('should create configuration error', () => {
    const error = new TaskConfigurationError('Invalid max_iterations', 'max_iterations')
    
    expect(error.message).toBe('Configuration error: Invalid max_iterations')
    expect(error.code).toBe('TASK_CONFIGURATION_ERROR')
    expect(error.statusCode).toBe(400)
    expect(error.details).toEqual({ configKey: 'max_iterations' })
  })
})

describe('TaskLimitExceededError', () => {
  it('should create limit exceeded error', () => {
    const error = new TaskLimitExceededError('tasks', 100, 150)
    
    expect(error.message).toBe('tasks limit exceeded: 150/100')
    expect(error.code).toBe('TASK_LIMIT_EXCEEDED')
    expect(error.statusCode).toBe(429)
    expect(error.details).toEqual({ limitType: 'tasks', limit: 100, current: 150 })
  })
})

describe('TaskOperationTimeoutError', () => {
  it('should create timeout error', () => {
    const error = new TaskOperationTimeoutError('createTask', 5000)
    
    expect(error.message).toBe('Operation timed out: createTask (5000ms)')
    expect(error.code).toBe('TASK_OPERATION_TIMEOUT')
    expect(error.statusCode).toBe(408)
    expect(error.details).toEqual({ operation: 'createTask', timeoutMs: 5000 })
  })
})

describe('FirebaseConnectionError', () => {
  it('should create Firebase connection error', () => {
    const originalError = new Error('Auth failed')
    const error = new FirebaseConnectionError('Authentication failed', originalError)
    
    expect(error.message).toBe('Firebase connection error: Authentication failed')
    expect(error.code).toBe('FIREBASE_CONNECTION_ERROR')
    expect(error.statusCode).toBe(503)
    expect(error.details).toEqual({ originalError: 'Auth failed' })
  })
})

describe('InvalidInputError', () => {
  it('should create invalid input error', () => {
    const error = new InvalidInputError('userId', 'must not be empty', '')
    
    expect(error.message).toBe('Invalid input for userId: must not be empty')
    expect(error.code).toBe('INVALID_INPUT')
    expect(error.statusCode).toBe(400)
    expect(error.details).toEqual({
      paramName: 'userId',
      reason: 'must not be empty',
      value: ''
    })
  })
})

describe('TaskErrorCodes', () => {
  it('should export all error codes', () => {
    expect(TaskErrorCodes.TASK_NOT_FOUND).toBe('TASK_NOT_FOUND')
    expect(TaskErrorCodes.TASK_VALIDATION_ERROR).toBe('TASK_VALIDATION_ERROR')
    expect(TaskErrorCodes.TASK_ALREADY_EXISTS).toBe('TASK_ALREADY_EXISTS')
    expect(TaskErrorCodes.TASK_STATE_ERROR).toBe('TASK_STATE_ERROR')
    expect(TaskErrorCodes.MILESTONE_NOT_FOUND).toBe('MILESTONE_NOT_FOUND')
    expect(TaskErrorCodes.TASK_ITEM_NOT_FOUND).toBe('TASK_ITEM_NOT_FOUND')
    expect(TaskErrorCodes.TASK_MESSAGE_NOT_FOUND).toBe('TASK_MESSAGE_NOT_FOUND')
    expect(TaskErrorCodes.TASK_AUTHORIZATION_ERROR).toBe('TASK_AUTHORIZATION_ERROR')
    expect(TaskErrorCodes.TASK_DATABASE_ERROR).toBe('TASK_DATABASE_ERROR')
    expect(TaskErrorCodes.TASK_CONFIGURATION_ERROR).toBe('TASK_CONFIGURATION_ERROR')
    expect(TaskErrorCodes.TASK_LIMIT_EXCEEDED).toBe('TASK_LIMIT_EXCEEDED')
    expect(TaskErrorCodes.TASK_OPERATION_TIMEOUT).toBe('TASK_OPERATION_TIMEOUT')
    expect(TaskErrorCodes.FIREBASE_CONNECTION_ERROR).toBe('FIREBASE_CONNECTION_ERROR')
    expect(TaskErrorCodes.INVALID_INPUT).toBe('INVALID_INPUT')
  })
})

describe('isTaskError', () => {
  it('should return true for TaskError instances', () => {
    const error = new TaskNotFoundError('task-123')
    expect(isTaskError(error)).toBe(true)
  })

  it('should return false for regular Error', () => {
    const error = new Error('Regular error')
    expect(isTaskError(error)).toBe(false)
  })

  it('should return false for non-errors', () => {
    expect(isTaskError('string')).toBe(false)
    expect(isTaskError(null)).toBe(false)
    expect(isTaskError(undefined)).toBe(false)
    expect(isTaskError({})).toBe(false)
  })
})

describe('toTaskError', () => {
  it('should return TaskError as-is', () => {
    const error = new TaskNotFoundError('task-123')
    const result = toTaskError(error)
    expect(result).toBe(error)
  })

  it('should convert Error to TaskDatabaseError', () => {
    const error = new Error('Something went wrong')
    const result = toTaskError(error)
    
    expect(result).toBeInstanceOf(TaskDatabaseError)
    expect(result.message).toBe('Database error: Something went wrong')
    expect(result.code).toBe('TASK_DATABASE_ERROR')
  })

  it('should convert string to TaskDatabaseError', () => {
    const result = toTaskError('Error message')
    
    expect(result).toBeInstanceOf(TaskDatabaseError)
    expect(result.message).toBe('Database error: Error message')
  })

  it('should convert unknown to TaskDatabaseError', () => {
    const result = toTaskError({ custom: 'error' })
    
    expect(result).toBeInstanceOf(TaskDatabaseError)
    expect(result.code).toBe('TASK_DATABASE_ERROR')
  })
})
