#!/usr/bin/env node
/**
 * Simple validation script for ScheduleBilingual.json
 * Validates basic structure and required fields
 */

import fs from 'fs';
import path from 'path';

const validateSchedule = (filePath) => {
  console.log(`🔍 Validating schedule file: ${filePath}`);
  
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }

    // Read and parse JSON
    const content = fs.readFileSync(filePath, 'utf8');
    let scheduleData;
    
    try {
      scheduleData = JSON.parse(content);
    } catch (parseError) {
      console.error(`❌ Invalid JSON format: ${parseError.message}`);
      process.exit(1);
    }

    // Basic structure validation
    const requiredFields = ['days', 'categories', 'sessions'];
    const missingFields = requiredFields.filter(field => !scheduleData[field]);
    
    if (missingFields.length > 0) {
      console.error(`❌ Missing required fields: ${missingFields.join(', ')}`);
      process.exit(1);
    }

    // Validate days array
    if (!Array.isArray(scheduleData.days) || scheduleData.days.length === 0) {
      console.error('❌ Invalid or empty "days" array');
      process.exit(1);
    }

    // Validate categories array
    if (!Array.isArray(scheduleData.categories) || scheduleData.categories.length === 0) {
      console.error('❌ Invalid or empty "categories" array');
      process.exit(1);
    }

    // Validate sessions object
    if (!scheduleData.sessions || typeof scheduleData.sessions !== 'object') {
      console.error('❌ Invalid "sessions" object');
      process.exit(1);
    }

    // Count sessions
    let totalSessions = 0;
    Object.values(scheduleData.sessions).forEach(categoryEvents => {
      if (Array.isArray(categoryEvents)) {
        totalSessions += categoryEvents.length;
      }
    });

    console.log(`✅ Schedule validation passed!`);
    console.log(`   📅 Days: ${scheduleData.days.length}`);
    console.log(`   🏷️  Categories: ${scheduleData.categories.length}`);
    console.log(`   📋 Session categories: ${Object.keys(scheduleData.sessions).length}`);
    console.log(`   🎯 Total sessions: ${totalSessions}`);
    
  } catch (error) {
    console.error(`❌ Validation error: ${error.message}`);
    process.exit(1);
  }
};

// Get file path from command line argument
const filePath = process.argv[2];

if (!filePath) {
  console.error('❌ Usage: node validate-schedule.js <path-to-schedule.json>');
  process.exit(1);
}

// Resolve relative path
const resolvedPath = path.resolve(filePath);

validateSchedule(resolvedPath);