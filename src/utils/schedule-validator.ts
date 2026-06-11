/**
 * Build-time validation utilities for bilingual schedule data
 * This module provides comprehensive validation for schedule data integrity
 */

import type { BilingualScheduleData } from './bilingual.js'
import { 
  validateBilingualScheduleData, 
  formatValidationErrors, 
  logValidationResults,
  type ValidationResult 
} from './bilingual.js'

// JSON Schema validation (if available in build environment)
let Ajv: any = null
let ajvInstance: any = null

try {
  // Try to import Ajv for JSON schema validation (optional dependency)
  Ajv = require('ajv')
  ajvInstance = new Ajv({ allErrors: true, verbose: true })
} catch (error) {
  console.warn('Ajv not available for JSON schema validation. Using custom validation only.')
}

/**
 * Load and validate schedule data from JSON file
 * @param filePath - Path to the JSON file
 * @returns Promise resolving to validated schedule data
 */
export async function loadAndValidateScheduleData(filePath: string): Promise<BilingualScheduleData> {
  try {
    // Dynamic import for Node.js environment
    const fs = await import('fs')
    const path = await import('path')
    
    const fullPath = path.resolve(filePath)
    const rawData = fs.readFileSync(fullPath, 'utf-8')
    const scheduleData = JSON.parse(rawData) as BilingualScheduleData
    
    // Validate the data
    const validation = await validateScheduleData(scheduleData, filePath)
    
    if (!validation.isValid) {
      const errorMessage = formatValidationErrors(validation.errors)
      throw new Error(`Schedule data validation failed for ${filePath}:\n${errorMessage}`)
    }
    
    // Log warnings if any
    if (validation.warnings.length > 0) {
      logValidationResults(validation, `Loading ${filePath}`)
    }
    
    return scheduleData
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in ${filePath}: ${error.message}`)
    }
    throw error
  }
}

/**
 * Validate schedule data using both JSON schema and custom validation
 * @param scheduleData - Schedule data to validate
 * @param context - Context for error reporting
 * @returns Promise resolving to validation result
 */
export async function validateScheduleData(
  scheduleData: BilingualScheduleData,
  context: string = ''
): Promise<ValidationResult> {
  const errors: any[] = []
  const warnings: any[] = []
  
  try {
    // First, run custom validation
    const customValidation = validateBilingualScheduleData(scheduleData)
    errors.push(...customValidation.errors)
    warnings.push(...customValidation.warnings)
    
    // If Ajv is available, also run JSON schema validation
    if (ajvInstance) {
      try {
        // Load schema
        const schemaPath = new URL('../json/bilingual-schedule-schema.json', import.meta.url)
        const fs = await import('fs')
        const schemaData = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'))
        
        const validate = ajvInstance.compile(schemaData)
        const isValid = validate(scheduleData)
        
        if (!isValid && validate.errors) {
          validate.errors.forEach((error: any) => {
            errors.push({
              field: error.instancePath || error.schemaPath,
              message: `JSON Schema: ${error.message}`,
              severity: 'error' as const,
              context: context || 'schema_validation'
            })
          })
        }
      } catch (schemaError) {
        warnings.push({
          field: 'schema_validation',
          message: `Could not load or apply JSON schema: ${schemaError}`,
          severity: 'warning' as const,
          context
        })
      }
    }
    
    // Additional business logic validation
    const businessValidation = validateBusinessRules(scheduleData)
    errors.push(...businessValidation.errors)
    warnings.push(...businessValidation.warnings)
    
  } catch (error) {
    errors.push({
      field: 'validation_process',
      message: `Validation process failed: ${error}`,
      severity: 'error' as const,
      context
    })
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate business rules and data consistency
 * @param scheduleData - Schedule data to validate
 * @returns Validation result
 */
function validateBusinessRules(scheduleData: BilingualScheduleData): ValidationResult {
  const errors: any[] = []
  const warnings: any[] = []
  
  try {
    // Check for orphaned sessions (sessions with category IDs not in categories)
    const categoryIds = new Set(scheduleData.categories?.map(cat => cat.id) || [])
    
    Object.keys(scheduleData.sessions || {}).forEach(sessionCategoryId => {
      if (!categoryIds.has(sessionCategoryId)) {
        warnings.push({
          field: 'sessions',
          message: `Session category '${sessionCategoryId}' not found in categories array`,
          severity: 'warning' as const,
          context: 'business_rules'
        })
      }
    })
    
    // Check for categories without sessions
    categoryIds.forEach(categoryId => {
      if (!scheduleData.sessions[categoryId] || scheduleData.sessions[categoryId].length === 0) {
        warnings.push({
          field: 'categories',
          message: `Category '${categoryId}' has no sessions`,
          severity: 'warning' as const,
          context: 'business_rules'
        })
      }
    })
    
    // Check for duplicate speaker IDs across all sessions
    const speakerIds = new Set<string>()
    const duplicateSpeakers = new Set<string>()
    
    Object.values(scheduleData.sessions || {}).forEach(sessions => {
      sessions.forEach(session => {
        session.speakers?.forEach(speaker => {
          if (speaker.id) {
            if (speakerIds.has(speaker.id)) {
              duplicateSpeakers.add(speaker.id)
            } else {
              speakerIds.add(speaker.id)
            }
          }
        })
      })
    })
    
    duplicateSpeakers.forEach(speakerId => {
      warnings.push({
        field: 'speakers',
        message: `Speaker ID '${speakerId}' appears multiple times (this may be intentional for speakers with multiple sessions)`,
        severity: 'warning' as const,
        context: 'business_rules'
      })
    })
    
    // Check for sessions with invalid time slots
    Object.values(scheduleData.sessions || {}).forEach(sessions => {
      sessions.forEach((session, index) => {
        if (session.timeSlot && !isValidTimeSlot(session.timeSlot)) {
          warnings.push({
            field: 'session.timeSlot',
            message: `Session has unusual time slot format: '${session.timeSlot}'`,
            severity: 'warning' as const,
            context: `business_rules.session[${index}]`
          })
        }
      })
    })
    
    // Check for missing speaker images
    Object.values(scheduleData.sessions || {}).forEach(sessions => {
      sessions.forEach(session => {
        session.speakers?.forEach((speaker, speakerIndex) => {
          if (!speaker.image || speaker.image === '0-placeholder-person.png') {
            warnings.push({
              field: 'speaker.image',
              message: `Speaker '${speaker.id}' is using placeholder image`,
              severity: 'warning' as const,
              context: `business_rules.speaker[${speakerIndex}]`
            })
          }
        })
      })
    })
    
  } catch (error) {
    errors.push({
      field: 'business_rules',
      message: `Business rules validation failed: ${error}`,
      severity: 'error' as const,
      context: 'business_rules'
    })
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Check if a time slot string follows expected format
 * @param timeSlot - Time slot string to validate
 * @returns True if format is valid
 */
function isValidTimeSlot(timeSlot: string): boolean {
  // Accept various time formats:
  // "10:15 - 10:50"
  // "14:00 - 14:20"
  // "TBD time" (for placeholder)
  // "All day"
  
  if (!timeSlot || typeof timeSlot !== 'string') {
    return false
  }
  
  const trimmed = timeSlot.trim()
  
  // Allow placeholder values
  if (trimmed.toLowerCase().includes('tbd') || 
      trimmed.toLowerCase().includes('all day') ||
      trimmed.toLowerCase().includes('全天')) {
    return true
  }
  
  // Check for time range format (HH:MM - HH:MM)
  const timeRangePattern = /^\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}$/
  return timeRangePattern.test(trimmed)
}

/**
 * Generate validation report for schedule data
 * @param scheduleData - Schedule data to analyze
 * @param context - Context for the report
 * @returns Promise resolving to formatted report
 */
export async function generateValidationReport(
  scheduleData: BilingualScheduleData,
  context: string = ''
): Promise<string> {
  const validation = await validateScheduleData(scheduleData, context)
  
  const report: string[] = []
  report.push(`=== Schedule Data Validation Report ===`)
  report.push(`Context: ${context || 'Unknown'}`)
  report.push(`Timestamp: ${new Date().toISOString()}`)
  report.push('')
  
  // Summary
  report.push(`Summary:`)
  report.push(`- Overall Status: ${validation.isValid ? 'VALID' : 'INVALID'}`)
  report.push(`- Errors: ${validation.errors.length}`)
  report.push(`- Warnings: ${validation.warnings.length}`)
  report.push('')
  
  // Statistics
  const stats = generateDataStatistics(scheduleData)
  report.push(`Data Statistics:`)
  report.push(`- Days: ${stats.daysCount}`)
  report.push(`- Categories: ${stats.categoriesCount}`)
  report.push(`- Total Sessions: ${stats.totalSessions}`)
  report.push(`- Total Speakers: ${stats.totalSpeakers}`)
  report.push(`- Unique Speakers: ${stats.uniqueSpeakers}`)
  report.push('')
  
  // Errors
  if (validation.errors.length > 0) {
    report.push(`Errors:`)
    validation.errors.forEach((error, index) => {
      const context = error.context ? ` (${error.context})` : ''
      report.push(`${index + 1}. [${error.field}] ${error.message}${context}`)
    })
    report.push('')
  }
  
  // Warnings
  if (validation.warnings.length > 0) {
    report.push(`Warnings:`)
    validation.warnings.forEach((warning, index) => {
      const context = warning.context ? ` (${warning.context})` : ''
      report.push(`${index + 1}. [${warning.field}] ${warning.message}${context}`)
    })
    report.push('')
  }
  
  if (validation.isValid && validation.warnings.length === 0) {
    report.push(`✅ All validations passed successfully!`)
  }
  
  return report.join('\n')
}

/**
 * Generate statistics about the schedule data
 * @param scheduleData - Schedule data to analyze
 * @returns Statistics object
 */
function generateDataStatistics(scheduleData: BilingualScheduleData): {
  daysCount: number
  categoriesCount: number
  totalSessions: number
  totalSpeakers: number
  uniqueSpeakers: number
} {
  const daysCount = scheduleData.days?.length || 0
  const categoriesCount = scheduleData.categories?.length || 0
  
  let totalSessions = 0
  let totalSpeakers = 0
  const uniqueSpeakerIds = new Set<string>()
  
  Object.values(scheduleData.sessions || {}).forEach(sessions => {
    totalSessions += sessions.length
    sessions.forEach(session => {
      const sessionSpeakers = session.speakers?.length || 0
      totalSpeakers += sessionSpeakers
      session.speakers?.forEach(speaker => {
        if (speaker.id) {
          uniqueSpeakerIds.add(speaker.id)
        }
      })
    })
  })
  
  return {
    daysCount,
    categoriesCount,
    totalSessions,
    totalSpeakers,
    uniqueSpeakers: uniqueSpeakerIds.size
  }
}

/**
 * CLI utility for validating schedule files
 * Usage: node validate-schedule.js <file-path>
 */
export async function validateScheduleFile(filePath: string): Promise<void> {
  try {
    console.log(`Validating schedule file: ${filePath}`)
    console.log('=' .repeat(50))
    
    const scheduleData = await loadAndValidateScheduleData(filePath)
    const report = await generateValidationReport(scheduleData, filePath)
    
    console.log(report)
    
    const validation = await validateScheduleData(scheduleData, filePath)
    if (!validation.isValid) {
      process.exit(1)
    }
    
  } catch (error) {
    console.error(`❌ Validation failed: ${error}`)
    process.exit(1)
  }
}

// Export for use in build scripts
export {
  validateBilingualScheduleData,
  formatValidationErrors,
  logValidationResults
}