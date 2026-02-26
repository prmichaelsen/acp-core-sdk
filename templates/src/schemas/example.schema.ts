/**
 * Task Data Model and Schemas
 * 
 * Zod schemas and TypeScript interfaces for the task execution system.
 * These schemas define the structure of Task documents in Firestore.
 */

import { z } from 'zod'

/**
 * ACP Milestone Schema
 * Represents a major phase in task execution with multiple sub-tasks
 * Defined inline to avoid duplication - progress is the source of truth
 */
const MilestoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  status: z.enum(['not_started', 'in_progress', 'completed']),
  progress: z.number().min(0).max(100),
  tasks_completed: z.number().min(0),
  tasks_total: z.number().min(0),
  started_at: z.string().optional(),
  completed_at: z.string().optional()
})

/**
 * ACP Task Item Schema
 * Represents a granular work item within a milestone
 * Defined inline to avoid duplication - progress is the source of truth
 */
const TaskItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  status: z.enum(['not_started', 'in_progress', 'completed']),
  estimated_hours: z.number().optional(),
  completed_at: z.string().optional(),
  notes: z.string().optional()
})

/**
 * ACP Progress Metrics Schema
 * Tracks completion percentages for different project phases
 */
export const ProgressMetricsSchema = z.object({
  planning: z.number().min(0).max(100),
  implementation: z.number().min(0).max(100),
  testing: z.number().min(0).max(100),
  documentation: z.number().min(0).max(100),
  overall: z.number().min(0).max(100)
})

/**
 * ACP Recent Work Item Schema
 * Individual work items within a recent work entry
 */
export const RecentWorkItemSchema = z.object({
  date: z.string(),
  description: z.string(),
  items: z.array(z.string())
})

/**
 * ACP Documentation Tracking Schema
 * Tracks documentation artifacts
 */
export const DocumentationTrackingSchema = z.object({
  design_documents: z.number().min(0),
  milestone_documents: z.number().min(0),
  pattern_documents: z.number().min(0),
  task_documents: z.number().min(0),
  last_updated: z.string()
})

/**
 * ACP Team Member Schema
 * Team member or agent working on the project
 */
export const TeamMemberSchema = z.object({
  role: z.string(),
  name: z.string(),
  focus: z.string()
})

/**
 * ACP Dependency Schema
 * External dependencies and integrations
 */
export const DependencyLibrarySchema = z.object({
  name: z.string(),
  version: z.string(),
  purpose: z.string()
})

export const DependencyInfrastructureSchema = z.object({
  name: z.string(),
  status: z.enum(['ready', 'pending', 'blocked', 'configured']),
  notes: z.string()
})

export const DependencyExternalServiceSchema = z.object({
  name: z.string(),
  status: z.enum(['configured', 'pending', 'blocked']),
  notes: z.string()
})

export const DependenciesSchema = z.object({
  external_services: z.array(DependencyExternalServiceSchema),
  libraries: z.array(DependencyLibrarySchema),
  infrastructure: z.array(DependencyInfrastructureSchema)
})

/**
 * ACP Quality Metrics Schema
 * Quality and code health metrics
 */
export const QualityMetricsSchema = z.object({
  test_coverage: z.number().min(0).max(100),
  code_review_status: z.enum(['pending', 'in_progress', 'completed']),
  documentation_status: z.enum(['pending', 'in_progress', 'completed'])
})

/**
 * Task Progress Schema (ACP-Compliant)
 * Full ACP progress document structure for task tracking
 * Matches agent/progress.template.yaml schema
 */
export const TaskProgressSchema = z.object({
  // Project metadata
  project: z.object({
    name: z.string(),
    version: z.string(),
    started: z.string(),
    status: z.enum(['not_started', 'in_progress', 'completed']),
    current_milestone: z.string(),
    description: z.string()
  }),
  
  // Milestones
  milestones: z.array(MilestoneSchema),
  
  // Tasks grouped by milestone
  tasks: z.record(z.string(), z.array(TaskItemSchema)),
  
  // Documentation tracking
  documentation: DocumentationTrackingSchema,
  
  // Progress metrics
  progress: ProgressMetricsSchema,
  
  // Recent work log
  recent_work: z.array(RecentWorkItemSchema),
  
  // Next steps
  next_steps: z.array(z.string()),
  
  // General notes
  notes: z.array(z.string()),
  
  // Current blockers
  current_blockers: z.array(z.string()),
  
  // Team members (optional)
  team: z.array(TeamMemberSchema).optional(),
  
  // Dependencies (optional)
  dependencies: DependenciesSchema.optional(),
  
  // Quality metrics (optional)
  quality: QualityMetricsSchema.optional()
})

/**
 * Task Execution Schema
 * Stores execution state including messages and tool results
 */
export const TaskExecutionSchema = z.object({
  api_messages: z.array(z.any()),
  task_messages: z.array(z.any()),
  tool_results: z.array(z.any()),
  error: z.string().optional(),
  abort_reason: z.string().optional()
})

/**
 * Task Configuration Schema
 * Configuration for task execution behavior
 * Note: Model is configured globally by the tenant platform, not per-task
 */
export const TaskConfigSchema = z.object({
  system_prompt: z.string(),
  auto_approve: z.boolean(),
  max_iterations: z.number().optional()
})

/**
 * Task Metadata Schema
 * Optional metadata for task organization and tracking
 */
export const TaskMetadataSchema = z.object({
  conversation_id: z.string().optional(),
  parent_task_id: z.string().optional(),
  tags: z.array(z.string()).optional()
}).optional()

/**
 * Task Schema
 * Complete task document structure
 */
export const TaskSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.enum(['not_started', 'in_progress', 'paused', 'completed', 'failed']),
  created_at: z.string(),
  updated_at: z.string(),
  started_at: z.string().optional(),
  completed_at: z.string().optional(),
  
  // Machine configuration
  machine_id: z.string().default('default'),
  
  // Project working directory (base CWD)
  working_directory: z.string(),
  
  progress: TaskProgressSchema,
  execution: TaskExecutionSchema,
  config: TaskConfigSchema,
  metadata: TaskMetadataSchema
})

/**
 * Task Message Schema
 * Messages in the task conversation thread
 */
export const TaskMessageSchema = z.object({
  id: z.string(),
  task_id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.string(),
  metadata: z.any().optional()
})

// Export TypeScript types inferred from Zod schemas
export type TaskProgress = z.infer<typeof TaskProgressSchema>
export type Milestone = TaskProgress['milestones'][number]
export type TaskItem = TaskProgress['tasks'][string][number]
export type TaskExecution = z.infer<typeof TaskExecutionSchema>
export type TaskConfig = z.infer<typeof TaskConfigSchema>
export type TaskMetadata = z.infer<typeof TaskMetadataSchema>
export type Task = z.infer<typeof TaskSchema>
export type TaskMessage = z.infer<typeof TaskMessageSchema>

// Export additional ACP types
export type ProgressMetrics = z.infer<typeof ProgressMetricsSchema>
export type RecentWorkItem = z.infer<typeof RecentWorkItemSchema>
export type DocumentationTracking = z.infer<typeof DocumentationTrackingSchema>
export type TeamMember = z.infer<typeof TeamMemberSchema>
export type Dependencies = z.infer<typeof DependenciesSchema>
export type QualityMetrics = z.infer<typeof QualityMetricsSchema>

// Export status enums for convenience
export const TaskStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const

export const MilestoneStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
} as const

export const TaskItemStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
} as const

export const MessageRole = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system'
} as const
