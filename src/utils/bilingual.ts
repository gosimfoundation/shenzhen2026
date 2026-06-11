// Utility functions for bilingual text processing

export interface BilingualText {
  en: string
  zh: string
  fr?: string
}

export interface BilingualDay {
  date: BilingualText
  title: BilingualText
  url: BilingualText
}

export interface BilingualCategory {
  name: BilingualText
  room: BilingualText
  id: string
}

export interface BilingualSpeaker {
  id: string
  name: BilingualText
  roleOrg: BilingualText
  tags: string[]
  image: string
}

export interface BilingualSession {
  date: BilingualText
  timeSlot: string
  title: BilingualText
  content: BilingualText
  speakers: BilingualSpeaker[]
  category?: string
  isSpecialEvent?: boolean
  room?: BilingualText
}

export interface BilingualScheduleData {
  days: BilingualDay[]
  categories: BilingualCategory[]
  sessions: Record<string, BilingualSession[]>
}

/**
 * Detect current language based on URL pathname
 * @param pathname - Current URL pathname
 * @returns 'zh' for Chinese pages, 'en' for English pages
 */
export function detectLanguageFromRoute(pathname: string): 'zh' | 'en' | 'fr' {
  if (pathname.startsWith('/zh/')) return 'zh'
  if (pathname.startsWith('/fr/')) return 'fr'
  return 'en'
}

/**
 * Extract appropriate text based on language context and fallback logic
 * @param textObj - Object containing en and zh properties
 * @param currentLang - Current language context ('zh' or 'en')
 * @param fallback - Fallback text if no valid text is found
 * @returns Processed text or fallback
 */
export function getBilingualText(
  textObj: BilingualText | string | null | undefined,
  currentLang: 'zh' | 'en' | 'fr' = 'en',
  fallback: string = ''
): string {
  // If text is a simple string, return it as-is
  if (typeof textObj === 'string') {
    return textObj
  }

  // If text is null or undefined, return fallback
  if (!textObj) {
    return fallback
  }

  // If text is an object with en/zh/fr properties
  if (typeof textObj === 'object' && ('en' in textObj || 'zh' in textObj)) {
    const zhText = textObj.zh || ''
    const enText = textObj.en || ''
    const frText = (textObj as BilingualText).fr || ''

    if (currentLang === 'fr') {
      return frText || enText || zhText || fallback
    }
    if (currentLang === 'zh') {
      return zhText || enText || fallback
    }
    return enText || zhText || fallback
  }

  // Fallback if no valid text is found
  return fallback
}

/**
 * Process bilingual schedule data for component consumption
 * @param scheduleData - Raw bilingual schedule data
 * @param currentLang - Current language context
 * @returns Processed schedule data optimized for rendering
 */
export function processBilingualSchedule(
  scheduleData: BilingualScheduleData,
  currentLang: 'zh' | 'en' | 'fr' = 'en'
): BilingualScheduleData {
  // Process days with language-appropriate URLs
  const processedDays = scheduleData.days.map(day => ({
    ...day,
    url: {
      en: day.url.en || day.url.zh || '',
      zh: day.url.zh || day.url.en || ''
    }
  }))

  // Process categories (no changes needed, but ensure consistency)
  const processedCategories = scheduleData.categories.map(category => ({
    ...category
  }))

  // Process sessions with enhanced speaker data
  const processedSessions: Record<string, BilingualSession[]> = {}
  
  Object.keys(scheduleData.sessions).forEach(categoryId => {
    processedSessions[categoryId] = scheduleData.sessions[categoryId].map(session => ({
      ...session,
      speakers: session.speakers.map(speaker => ({
        ...speaker,
        // Ensure speaker data is properly structured
        name: typeof speaker.name === 'object' ? speaker.name : { en: speaker.name as string, zh: speaker.name as string },
        roleOrg: typeof speaker.roleOrg === 'object' ? speaker.roleOrg : { en: speaker.roleOrg as string, zh: speaker.roleOrg as string }
      }))
    }))
  })

  return {
    days: processedDays,
    categories: processedCategories,
    sessions: processedSessions
  }
}

/**
 * Get bilingual text for display with both languages
 * @param textObj - Bilingual text object
 * @param fallback - Fallback text if no valid text is found
 * @returns Object with both languages or fallback
 */
export function getBilingualDisplayText(
  textObj: BilingualText | string | null | undefined,
  fallback: string = ''
): BilingualText | string {
  // If text is a simple string, return it as-is
  if (typeof textObj === 'string') {
    return textObj
  }

  // If text is null or undefined, return fallback
  if (!textObj) {
    return fallback
  }

  // If text is an object with en/zh properties
  if (typeof textObj === 'object' && ('en' in textObj || 'zh' in textObj)) {
    const zhText = textObj.zh || ''
    const enText = textObj.en || ''
    
    // If both languages are available, return both
    if (zhText && enText) {
      return { en: enText, zh: zhText }
    }
    
    // If only one language is available, return it as a string
    if (zhText) return zhText
    if (enText) return enText
  }
  
  // Fallback if no valid text is found
  return fallback
}

/**
 * Check if a text object has both language versions
 * @param textObj - Object to check
 * @returns true if both en and zh are present and non-empty
 */
export function hasBothLanguages(textObj: BilingualText | string | null | undefined): boolean {
  if (typeof textObj !== 'object' || !textObj) {
    return false
  }
  
  return Boolean(textObj.en && textObj.zh)
}

/**
 * Validate that a bilingual text object has at least one language
 * @param textObj - Object to validate
 * @returns true if at least one language is present
 */
export function isValidBilingualText(textObj: BilingualText | string | null | undefined): boolean {
  if (typeof textObj === 'string' && textObj.trim()) {
    return true
  }
  
  if (typeof textObj === 'object' && textObj) {
    return Boolean(textObj.en || textObj.zh)
  }
  
  return false
}

/**
 * Create a bilingual text object from separate strings
 * @param en - English text
 * @param zh - Chinese text
 * @returns BilingualText object
 */
export function createBilingualText(en: string, zh: string): BilingualText {
  return { en, zh }
}

/**
 * Generate appropriate URL based on current language context
 * @param baseUrl - Base URL structure with language variants
 * @param currentLang - Current language context
 * @returns Appropriate URL for the current language
 */
export function generateLanguageUrl(
  baseUrl: BilingualText | string,
  currentLang: 'zh' | 'en' | 'fr' = 'en'
): string {
  if (typeof baseUrl === 'string') {
    return baseUrl
  }

  if (typeof baseUrl === 'object' && baseUrl) {
    if (currentLang === 'fr') return (baseUrl as BilingualText).fr || baseUrl.en || baseUrl.zh || ''
    if (currentLang === 'zh') return baseUrl.zh || baseUrl.en || ''
    return baseUrl.en || baseUrl.zh || ''
  }

  return ''
}

/**
 * Filter sessions by category with language-aware processing
 * @param sessions - All sessions data
 * @param categoryId - Category ID to filter by
 * @param currentLang - Current language context
 * @returns Filtered sessions for the specified category
 */
export function filterSessionsByCategory(
  sessions: Record<string, BilingualSession[]>,
  categoryId: string,
  currentLang: 'zh' | 'en' | 'fr' = 'en'
): BilingualSession[] {
  return sessions[categoryId] || []
}

/**
 * Get category name by ID with language support
 * @param categories - All categories data
 * @param categoryId - Category ID to find
 * @param currentLang - Current language context
 * @returns Category name in appropriate language
 */
export function getCategoryName(
  categories: BilingualCategory[],
  categoryId: string,
  currentLang: 'zh' | 'en' | 'fr' = 'en'
): string {
  const category = categories.find(cat => cat.id === categoryId)
  if (!category) return ''
  
  return getBilingualText(category.name, currentLang)
}

/**
 * Get category room by ID with language support
 * @param categories - All categories data
 * @param categoryId - Category ID to find
 * @param currentLang - Current language context
 * @returns Category room in appropriate language
 */
export function getCategoryRoom(
  categories: BilingualCategory[],
  categoryId: string,
  currentLang: 'zh' | 'en' | 'fr' = 'en'
): string {
  const category = categories.find(cat => cat.id === categoryId)
  if (!category) return ''
  
  return getBilingualText(category.room, currentLang)
}

/**
 * Sort sessions by time slot
 * @param sessions - Sessions to sort
 * @returns Sessions sorted by time slot
 */
export function sortSessionsByTime(sessions: BilingualSession[]): BilingualSession[] {
  return [...sessions].sort((a, b) => {
    // Simple time comparison - assumes format "HH:MM - HH:MM"
    const timeA = a.timeSlot.split(' - ')[0]
    const timeB = b.timeSlot.split(' - ')[0]
    return timeA.localeCompare(timeB)
  })
}

/**
 * Group sessions by date
 * @param sessions - Sessions to group
 * @param currentLang - Current language context
 * @returns Sessions grouped by date
 */
export function groupSessionsByDate(
  sessions: BilingualSession[],
  currentLang: 'zh' | 'en' | 'fr' = 'en'
): Record<string, BilingualSession[]> {
  const grouped: Record<string, BilingualSession[]> = {}
  
  sessions.forEach(session => {
    const dateKey = getBilingualText(session.date, currentLang)
    if (!grouped[dateKey]) {
      grouped[dateKey] = []
    }
    grouped[dateKey].push(session)
  })
  
  // Sort sessions within each date group
  Object.keys(grouped).forEach(date => {
    grouped[date] = sortSessionsByTime(grouped[date])
  })
  
  return grouped
}

// Error handling and validation functions

export interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
  context?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

/**
 * Validate bilingual text object
 * @param textObj - Text object to validate
 * @param fieldName - Name of the field being validated
 * @param required - Whether the field is required
 * @returns Validation result
 */
export function validateBilingualText(
  textObj: BilingualText | string | null | undefined,
  fieldName: string,
  required: boolean = true
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Check if field exists when required
  if (required && (!textObj || (typeof textObj === 'string' && !textObj.trim()))) {
    errors.push({
      field: fieldName,
      message: `Required field '${fieldName}' is missing or empty`,
      severity: 'error'
    })
    return { isValid: false, errors, warnings }
  }

  // If not required and empty, that's okay
  if (!textObj) {
    return { isValid: true, errors, warnings }
  }

  // If it's a string, that's valid but warn about missing bilingual support
  if (typeof textObj === 'string') {
    if (textObj.trim()) {
      warnings.push({
        field: fieldName,
        message: `Field '${fieldName}' is a string but should be bilingual object for full internationalization support`,
        severity: 'warning'
      })
      return { isValid: true, errors, warnings }
    } else {
      errors.push({
        field: fieldName,
        message: `Field '${fieldName}' is an empty string`,
        severity: 'error'
      })
      return { isValid: false, errors, warnings }
    }
  }

  // Validate bilingual object structure
  if (typeof textObj === 'object') {
    const hasEn = textObj.en && typeof textObj.en === 'string' && textObj.en.trim()
    const hasZh = textObj.zh && typeof textObj.zh === 'string' && textObj.zh.trim()

    if (!hasEn && !hasZh) {
      errors.push({
        field: fieldName,
        message: `Field '${fieldName}' must have at least one non-empty language version (en or zh)`,
        severity: 'error'
      })
      return { isValid: false, errors, warnings }
    }

    if (!hasEn) {
      warnings.push({
        field: fieldName,
        message: `Field '${fieldName}' is missing English translation`,
        severity: 'warning'
      })
    }

    if (!hasZh) {
      warnings.push({
        field: fieldName,
        message: `Field '${fieldName}' is missing Chinese translation`,
        severity: 'warning'
      })
    }
  }

  return { isValid: true, errors, warnings }
}

/**
 * Validate bilingual speaker object
 * @param speaker - Speaker object to validate
 * @param context - Context for error reporting
 * @returns Validation result
 */
export function validateBilingualSpeaker(
  speaker: BilingualSpeaker,
  context: string = ''
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Validate required fields
  if (!speaker.id || typeof speaker.id !== 'string' || !speaker.id.trim()) {
    errors.push({
      field: 'speaker.id',
      message: 'Speaker ID is required and must be a non-empty string',
      severity: 'error',
      context
    })
  }

  if (!speaker.image || typeof speaker.image !== 'string' || !speaker.image.trim()) {
    warnings.push({
      field: 'speaker.image',
      message: 'Speaker image is missing',
      severity: 'warning',
      context
    })
  }

  if (!Array.isArray(speaker.tags)) {
    warnings.push({
      field: 'speaker.tags',
      message: 'Speaker tags should be an array',
      severity: 'warning',
      context
    })
  }

  // Validate bilingual fields
  const nameValidation = validateBilingualText(speaker.name, 'speaker.name', true)
  const roleValidation = validateBilingualText(speaker.roleOrg, 'speaker.roleOrg', true)

  errors.push(...nameValidation.errors)
  warnings.push(...nameValidation.warnings)
  errors.push(...roleValidation.errors)
  warnings.push(...roleValidation.warnings)

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate bilingual session object
 * @param session - Session object to validate
 * @param context - Context for error reporting
 * @returns Validation result
 */
export function validateBilingualSession(
  session: BilingualSession,
  context: string = ''
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Validate required fields
  if (!session.timeSlot || typeof session.timeSlot !== 'string' || !session.timeSlot.trim()) {
    errors.push({
      field: 'session.timeSlot',
      message: 'Session timeSlot is required and must be a non-empty string',
      severity: 'error',
      context
    })
  }

  // Validate bilingual fields
  const dateValidation = validateBilingualText(session.date, 'session.date', true)
  const titleValidation = validateBilingualText(session.title, 'session.title', true)
  const contentValidation = validateBilingualText(session.content, 'session.content', true)

  errors.push(...dateValidation.errors)
  warnings.push(...dateValidation.warnings)
  errors.push(...titleValidation.errors)
  warnings.push(...titleValidation.warnings)
  errors.push(...contentValidation.errors)
  warnings.push(...contentValidation.warnings)

  // Validate optional room field
  if (session.room) {
    const roomValidation = validateBilingualText(session.room, 'session.room', false)
    errors.push(...roomValidation.errors)
    warnings.push(...roomValidation.warnings)
  }

  // Validate speakers array
  if (!Array.isArray(session.speakers)) {
    errors.push({
      field: 'session.speakers',
      message: 'Session speakers must be an array',
      severity: 'error',
      context
    })
  } else {
    session.speakers.forEach((speaker, index) => {
      const speakerValidation = validateBilingualSpeaker(speaker, `${context}.speakers[${index}]`)
      errors.push(...speakerValidation.errors)
      warnings.push(...speakerValidation.warnings)
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate bilingual category object
 * @param category - Category object to validate
 * @param context - Context for error reporting
 * @returns Validation result
 */
export function validateBilingualCategory(
  category: BilingualCategory,
  context: string = ''
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Validate required fields
  if (!category.id || typeof category.id !== 'string' || !category.id.trim()) {
    errors.push({
      field: 'category.id',
      message: 'Category ID is required and must be a non-empty string',
      severity: 'error',
      context
    })
  }

  // Validate bilingual fields
  const nameValidation = validateBilingualText(category.name, 'category.name', true)
  const roomValidation = validateBilingualText(category.room, 'category.room', true)

  errors.push(...nameValidation.errors)
  warnings.push(...nameValidation.warnings)
  errors.push(...roomValidation.errors)
  warnings.push(...roomValidation.warnings)

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate bilingual day object
 * @param day - Day object to validate
 * @param context - Context for error reporting
 * @returns Validation result
 */
export function validateBilingualDay(
  day: BilingualDay,
  context: string = ''
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Validate bilingual fields
  const dateValidation = validateBilingualText(day.date, 'day.date', true)
  const titleValidation = validateBilingualText(day.title, 'day.title', true)
  const urlValidation = validateBilingualText(day.url, 'day.url', true)

  errors.push(...dateValidation.errors)
  warnings.push(...dateValidation.warnings)
  errors.push(...titleValidation.errors)
  warnings.push(...titleValidation.warnings)
  errors.push(...urlValidation.errors)
  warnings.push(...urlValidation.warnings)

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate complete bilingual schedule data
 * @param scheduleData - Complete schedule data to validate
 * @returns Validation result with detailed error reporting
 */
export function validateBilingualScheduleData(
  scheduleData: BilingualScheduleData
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Validate top-level structure
  if (!scheduleData || typeof scheduleData !== 'object') {
    errors.push({
      field: 'scheduleData',
      message: 'Schedule data must be a valid object',
      severity: 'error'
    })
    return { isValid: false, errors, warnings }
  }

  // Validate days array
  if (!Array.isArray(scheduleData.days)) {
    errors.push({
      field: 'scheduleData.days',
      message: 'Days must be an array',
      severity: 'error'
    })
  } else {
    scheduleData.days.forEach((day, index) => {
      const dayValidation = validateBilingualDay(day, `days[${index}]`)
      errors.push(...dayValidation.errors)
      warnings.push(...dayValidation.warnings)
    })
  }

  // Validate categories array
  if (!Array.isArray(scheduleData.categories)) {
    errors.push({
      field: 'scheduleData.categories',
      message: 'Categories must be an array',
      severity: 'error'
    })
  } else {
    const categoryIds = new Set<string>()
    scheduleData.categories.forEach((category, index) => {
      const categoryValidation = validateBilingualCategory(category, `categories[${index}]`)
      errors.push(...categoryValidation.errors)
      warnings.push(...categoryValidation.warnings)

      // Check for duplicate category IDs
      if (category.id) {
        if (categoryIds.has(category.id)) {
          errors.push({
            field: 'category.id',
            message: `Duplicate category ID '${category.id}' found`,
            severity: 'error',
            context: `categories[${index}]`
          })
        } else {
          categoryIds.add(category.id)
        }
      }
    })
  }

  // Validate sessions object
  if (!scheduleData.sessions || typeof scheduleData.sessions !== 'object') {
    errors.push({
      field: 'scheduleData.sessions',
      message: 'Sessions must be an object',
      severity: 'error'
    })
  } else {
    const categoryIds = new Set(scheduleData.categories?.map(cat => cat.id) || [])
    
    Object.keys(scheduleData.sessions).forEach(categoryId => {
      // Check if category ID exists in categories
      if (!categoryIds.has(categoryId)) {
        warnings.push({
          field: 'sessions',
          message: `Session category '${categoryId}' not found in categories array`,
          severity: 'warning',
          context: `sessions.${categoryId}`
        })
      }

      const sessions = scheduleData.sessions[categoryId]
      if (!Array.isArray(sessions)) {
        errors.push({
          field: `sessions.${categoryId}`,
          message: `Sessions for category '${categoryId}' must be an array`,
          severity: 'error'
        })
      } else {
        sessions.forEach((session, index) => {
          const sessionValidation = validateBilingualSession(session, `sessions.${categoryId}[${index}]`)
          errors.push(...sessionValidation.errors)
          warnings.push(...sessionValidation.warnings)
        })
      }
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Safe getter for bilingual text with comprehensive error handling
 * @param textObj - Text object to extract from
 * @param currentLang - Current language context
 * @param fallback - Fallback text if extraction fails
 * @param onError - Optional error callback
 * @returns Extracted text or fallback
 */
export function safeGetBilingualText(
  textObj: BilingualText | string | null | undefined,
  currentLang: 'zh' | 'en' | 'fr' = 'en',
  fallback: string = '[Missing Translation]',
  onError?: (error: string, context?: string) => void
): string {
  try {
    // If text is null or undefined, use fallback
    if (!textObj) {
      onError?.('Text object is null or undefined')
      return fallback
    }

    // If text is a simple string, return it as-is
    if (typeof textObj === 'string') {
      return textObj.trim() || fallback
    }

    // If text is an object with en/zh properties
    if (typeof textObj === 'object' && ('en' in textObj || 'zh' in textObj)) {
      const zhText = textObj.zh?.trim() || ''
      const enText = textObj.en?.trim() || ''
      const frText = (textObj as BilingualText).fr?.trim() || ''

      // Prefer current language if available
      if (currentLang === 'fr' && frText) {
        return frText
      }
      if (currentLang === 'zh' && zhText) {
        return zhText
      }
      if (currentLang === 'en' && enText) {
        return enText
      }

      // Fallback to any available language (prefer en for fr)
      if (currentLang === 'fr' && enText) {
        onError?.(`Missing fr translation, using English`, 'language_fallback')
        return enText
      }
      if (enText) {
        onError?.(`Missing ${currentLang} translation, using English`, 'language_fallback')
        return enText
      }
      if (zhText) {
        onError?.(`Missing ${currentLang} translation, using Chinese`, 'language_fallback')
        return zhText
      }

      // No valid text found
      onError?.('No valid text found in bilingual object')
      return fallback
    }

    // Invalid object structure
    onError?.('Invalid bilingual text object structure')
    return fallback
  } catch (error) {
    onError?.(`Error processing bilingual text: ${error}`)
    return fallback
  }
}

/**
 * Create error-safe bilingual schedule processor
 * @param scheduleData - Raw schedule data
 * @param currentLang - Current language context
 * @param onError - Optional error callback
 * @returns Processed schedule data with error handling
 */
export function safeProcessBilingualSchedule(
  scheduleData: BilingualScheduleData,
  currentLang: 'zh' | 'en' | 'fr' = 'en',
  onError?: (error: string, context?: string) => void
): BilingualScheduleData {
  try {
    // Validate input data first
    const validation = validateBilingualScheduleData(scheduleData)
    
    if (!validation.isValid) {
      validation.errors.forEach(error => {
        onError?.(error.message, error.context)
      })
    }
    
    validation.warnings.forEach(warning => {
      onError?.(warning.message, warning.context)
    })

    // Process with error handling
    const processedDays = (scheduleData.days || []).map((day, index) => {
      try {
        return {
          ...day,
          url: {
            en: safeGetBilingualText(day.url, 'en', '', onError),
            zh: safeGetBilingualText(day.url, 'zh', '', onError)
          }
        }
      } catch (error) {
        onError?.(`Error processing day ${index}: ${error}`)
        return day
      }
    })

    const processedCategories = (scheduleData.categories || []).map((category, index) => {
      try {
        return { ...category }
      } catch (error) {
        onError?.(`Error processing category ${index}: ${error}`)
        return category
      }
    })

    const processedSessions: Record<string, BilingualSession[]> = {}
    
    Object.keys(scheduleData.sessions || {}).forEach(categoryId => {
      try {
        processedSessions[categoryId] = (scheduleData.sessions[categoryId] || []).map((session, index) => {
          try {
            return {
              ...session,
              speakers: (session.speakers || []).map((speaker, speakerIndex) => {
                try {
                  return {
                    ...speaker,
                    name: typeof speaker.name === 'object' ? speaker.name : { 
                      en: String(speaker.name || ''), 
                      zh: String(speaker.name || '') 
                    },
                    roleOrg: typeof speaker.roleOrg === 'object' ? speaker.roleOrg : { 
                      en: String(speaker.roleOrg || ''), 
                      zh: String(speaker.roleOrg || '') 
                    }
                  }
                } catch (error) {
                  onError?.(`Error processing speaker ${speakerIndex} in session ${index} of category ${categoryId}: ${error}`)
                  return speaker
                }
              })
            }
          } catch (error) {
            onError?.(`Error processing session ${index} in category ${categoryId}: ${error}`)
            return session
          }
        })
      } catch (error) {
        onError?.(`Error processing sessions for category ${categoryId}: ${error}`)
        processedSessions[categoryId] = scheduleData.sessions[categoryId] || []
      }
    })

    return {
      days: processedDays,
      categories: processedCategories,
      sessions: processedSessions
    }
  } catch (error) {
    onError?.(`Critical error processing schedule data: ${error}`)
    // Return original data as fallback
    return scheduleData
  }
}

/**
 * Format validation errors for display
 * @param errors - Array of validation errors
 * @returns Formatted error message
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return ''
  
  const errorMessages = errors.map(error => {
    const context = error.context ? ` (${error.context})` : ''
    return `${error.severity.toUpperCase()}: ${error.message}${context}`
  })
  
  return errorMessages.join('\n')
}

/**
 * Log validation results to console with proper formatting
 * @param validation - Validation result to log
 * @param context - Context for logging
 */
export function logValidationResults(validation: ValidationResult, context: string = ''): void {
  const prefix = context ? `[${context}] ` : ''
  
  if (validation.errors.length > 0) {
    console.error(`${prefix}Validation Errors:`)
    validation.errors.forEach(error => {
      const errorContext = error.context ? ` (${error.context})` : ''
      console.error(`  - ${error.field}: ${error.message}${errorContext}`)
    })
  }
  
  if (validation.warnings.length > 0) {
    console.warn(`${prefix}Validation Warnings:`)
    validation.warnings.forEach(warning => {
      const warningContext = warning.context ? ` (${warning.context})` : ''
      console.warn(`  - ${warning.field}: ${warning.message}${warningContext}`)
    })
  }
  
  if (validation.isValid && validation.warnings.length === 0) {
    console.log(`${prefix}Validation passed successfully`)
  }
}