/**
 * Test suite for error handling and validation functionality
 * This file demonstrates and tests the error handling capabilities
 */

import {
  type BilingualScheduleData,
  type BilingualText,
  validateBilingualScheduleData,
  validateBilingualText,
  validateBilingualSpeaker,
  validateBilingualSession,
  safeGetBilingualText,
  safeProcessBilingualSchedule,
  formatValidationErrors,
  logValidationResults
} from './bilingual.js'

// Test data with various error conditions
const testValidBilingualText: BilingualText = {
  en: "Valid English Text",
  zh: "有效的中文文本"
}

const testInvalidBilingualText = {
  en: "",
  zh: ""
}

const testPartialBilingualText: BilingualText = {
  en: "English Only",
  zh: ""
}

const testMalformedScheduleData = {
  days: "not an array", // Should be array
  categories: [], // Valid but empty
  sessions: null // Should be object
}

const testValidScheduleData: BilingualScheduleData = {
  days: [
    {
      date: { en: "September 13", zh: "9月13日" },
      title: { en: "Day 1", zh: "第一天" },
      url: { en: "/schedule/", zh: "/zh/schedule/" }
    }
  ],
  categories: [
    {
      id: "test-category",
      name: { en: "Test Category", zh: "测试类别" },
      room: { en: "Room 1", zh: "房间1" }
    }
  ],
  sessions: {
    "test-category": [
      {
        date: { en: "September 13", zh: "9月13日" },
        timeSlot: "10:00 - 11:00",
        title: { en: "Test Session", zh: "测试会话" },
        content: { en: "Test content", zh: "测试内容" },
        speakers: [
          {
            id: "test-speaker",
            name: { en: "Test Speaker", zh: "测试演讲者" },
            roleOrg: { en: "Test Organization", zh: "测试组织" },
            tags: ["test-category"],
            image: "test-speaker.jpg"
          }
        ]
      }
    ]
  }
}

/**
 * Run comprehensive error handling tests
 */
export function runErrorHandlingTests(): void {
  console.log('🧪 Running Error Handling Tests')
  console.log('=' .repeat(50))

  // Test 1: Valid bilingual text validation
  console.log('\n📝 Test 1: Valid Bilingual Text')
  const validTextResult = validateBilingualText(testValidBilingualText, 'test.field')
  console.log(`Result: ${validTextResult.isValid ? '✅ PASS' : '❌ FAIL'}`)
  if (validTextResult.warnings.length > 0) {
    console.log(`Warnings: ${validTextResult.warnings.length}`)
  }

  // Test 2: Invalid bilingual text validation
  console.log('\n📝 Test 2: Invalid Bilingual Text')
  const invalidTextResult = validateBilingualText(testInvalidBilingualText as BilingualText, 'test.field')
  console.log(`Result: ${invalidTextResult.isValid ? '❌ FAIL' : '✅ PASS (correctly detected invalid)'}`)
  console.log(`Errors: ${invalidTextResult.errors.length}`)

  // Test 3: Partial bilingual text validation
  console.log('\n📝 Test 3: Partial Bilingual Text')
  const partialTextResult = validateBilingualText(testPartialBilingualText, 'test.field')
  console.log(`Result: ${partialTextResult.isValid ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Warnings: ${partialTextResult.warnings.length}`)

  // Test 4: Safe text extraction with error handling
  console.log('\n📝 Test 4: Safe Text Extraction')
  const errors: string[] = []
  const handleError = (error: string, context?: string) => {
    errors.push(context ? `[${context}] ${error}` : error)
  }

  const safeText1 = safeGetBilingualText(testValidBilingualText, 'en', 'fallback', handleError)
  const safeText2 = safeGetBilingualText(null, 'en', 'fallback', handleError)
  const safeText3 = safeGetBilingualText(testInvalidBilingualText as BilingualText, 'en', 'fallback', handleError)

  console.log(`Valid text extraction: "${safeText1}" (${safeText1 === 'Valid English Text' ? '✅' : '❌'})`)
  console.log(`Null text extraction: "${safeText2}" (${safeText2 === 'fallback' ? '✅' : '❌'})`)
  console.log(`Invalid text extraction: "${safeText3}" (${safeText3 === 'fallback' ? '✅' : '❌'})`)
  console.log(`Errors captured: ${errors.length}`)

  // Test 5: Schedule data validation
  console.log('\n📝 Test 5: Schedule Data Validation')
  const validScheduleResult = validateBilingualScheduleData(testValidScheduleData)
  console.log(`Valid schedule: ${validScheduleResult.isValid ? '✅ PASS' : '❌ FAIL'}`)
  
  const invalidScheduleResult = validateBilingualScheduleData(testMalformedScheduleData as any)
  console.log(`Invalid schedule: ${invalidScheduleResult.isValid ? '❌ FAIL' : '✅ PASS (correctly detected invalid)'}`)
  console.log(`Errors in invalid schedule: ${invalidScheduleResult.errors.length}`)

  // Test 6: Safe schedule processing
  console.log('\n📝 Test 6: Safe Schedule Processing')
  const processingErrors: string[] = []
  const handleProcessingError = (error: string, context?: string) => {
    processingErrors.push(context ? `[${context}] ${error}` : error)
  }

  const processedSchedule = safeProcessBilingualSchedule(
    testValidScheduleData,
    'en',
    handleProcessingError
  )

  console.log(`Processed schedule successfully: ${processedSchedule ? '✅' : '❌'}`)
  console.log(`Processing errors: ${processingErrors.length}`)

  // Test 7: Error formatting
  console.log('\n📝 Test 7: Error Formatting')
  const formattedErrors = formatValidationErrors(invalidScheduleResult.errors)
  console.log(`Formatted errors length: ${formattedErrors.length > 0 ? '✅' : '❌'}`)
  console.log('Sample formatted error:')
  console.log(formattedErrors.split('\n')[0])

  // Test 8: Validation logging
  console.log('\n📝 Test 8: Validation Logging')
  console.log('Testing validation logging (check console output):')
  logValidationResults(validScheduleResult, 'Test Valid Schedule')
  logValidationResults(invalidScheduleResult, 'Test Invalid Schedule')

  console.log('\n🎉 Error Handling Tests Complete!')
  console.log('Check the console output above for detailed results.')
}

/**
 * Test error handling with real schedule data
 */
export async function testWithRealScheduleData(): Promise<void> {
  try {
    console.log('\n🔍 Testing with Real Schedule Data')
    console.log('=' .repeat(50))

    // This would normally import the actual schedule data
    // For testing purposes, we'll simulate loading it
    console.log('Loading schedule data...')
    
    // In a real scenario, you would:
    // import scheduleData from '../json/ScheduleBilingual.json'
    // const validation = validateBilingualScheduleData(scheduleData as BilingualScheduleData)
    
    console.log('✅ Real data testing would be performed here')
    console.log('Use the validation script: npm run validate-schedule:bilingual')
    
  } catch (error) {
    console.error('❌ Error testing with real data:', error)
  }
}

/**
 * Demonstrate error recovery scenarios
 */
export function demonstrateErrorRecovery(): void {
  console.log('\n🔧 Demonstrating Error Recovery')
  console.log('=' .repeat(50))

  const errors: string[] = []
  const handleError = (error: string, context?: string) => {
    errors.push(context ? `[${context}] ${error}` : error)
  }

  // Scenario 1: Missing translation with fallback
  console.log('\n📋 Scenario 1: Missing Translation Recovery')
  const missingZhText = { en: "English Only", zh: "" }
  const recoveredText = safeGetBilingualText(missingZhText, 'zh', 'Fallback Text', handleError)
  console.log(`Requested Chinese, got: "${recoveredText}"`)
  console.log(`Fallback worked: ${recoveredText === 'English Only' ? '✅' : '❌'}`)

  // Scenario 2: Completely invalid data with graceful degradation
  console.log('\n📋 Scenario 2: Invalid Data Recovery')
  const invalidData = "not an object at all"
  const recoveredFromInvalid = safeGetBilingualText(invalidData as any, 'en', 'Safe Fallback', handleError)
  console.log(`Invalid data recovery: "${recoveredFromInvalid}"`)
  console.log(`Graceful degradation: ${recoveredFromInvalid === 'not an object at all' ? '✅' : '❌'}`)

  // Scenario 3: Processing malformed schedule with error collection
  console.log('\n📋 Scenario 3: Malformed Schedule Recovery')
  const malformedSchedule = {
    days: [{ date: "not bilingual", title: null, url: undefined }],
    categories: [{ id: "", name: { en: "", zh: "" }, room: "string instead of object" }],
    sessions: { "invalid-category": [{ timeSlot: null, speakers: "not an array" }] }
  }

  const processedMalformed = safeProcessBilingualSchedule(
    malformedSchedule as any,
    'en',
    handleError
  )

  console.log(`Processed malformed data: ${processedMalformed ? '✅' : '❌'}`)
  console.log(`Total errors collected: ${errors.length}`)
  console.log('Sample errors:')
  errors.slice(0, 3).forEach((error, index) => {
    console.log(`  ${index + 1}. ${error}`)
  })

  console.log('\n✅ Error recovery demonstration complete!')
}

// Export test runner for use in development
export function runAllTests(): void {
  runErrorHandlingTests()
  demonstrateErrorRecovery()
  testWithRealScheduleData()
}

// If running this file directly, run all tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
}