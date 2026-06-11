#!/usr/bin/env python3
"""
Script to check for name mismatches between speaker JSON files and schedule sessions.
This helps identify speakers who might not show up correctly on their profile pages.
"""

import json
from collections import defaultdict

def load_json_file(filepath):
    """Load a JSON file safely."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        return None

def extract_speaker_names():
    """Extract speaker names from both language JSON files."""
    # Load English speakers
    speakers_en = load_json_file('/Users/zenghaochen/WORKING/GOSIM/hangzhou2025/src/json/Speakers.json')
    speakers_zh = load_json_file('/Users/zenghaochen/WORKING/GOSIM/hangzhou2025/src/json/SpeakersZh.json')
    
    if not speakers_en or not speakers_zh:
        return {}, {}
    
    # Create ID -> Name mapping for both languages
    en_names = {}
    zh_names = {}
    
    for speaker in speakers_en.get('speakers', []):
        en_names[speaker['id']] = speaker['name']
    
    for speaker in speakers_zh.get('speakers', []):
        zh_names[speaker['id']] = speaker['name']
    
    return en_names, zh_names

def extract_schedule_names():
    """Extract all speaker names from schedule sessions."""
    schedule = load_json_file('/Users/zenghaochen/WORKING/GOSIM/hangzhou2025/src/json/ScheduleBilingual.json')
    
    if not schedule:
        return {}
    
    # Dictionary to store: speaker_id -> {en_name, zh_name, sessions_found_in}
    schedule_speakers = defaultdict(lambda: {'en_name': None, 'zh_name': None, 'sessions': []})
    
    # Go through all sessions
    for category, sessions in schedule.get('sessions', {}).items():
        for session in sessions:
            session_title = session.get('title', 'Unknown Session')
            if isinstance(session_title, dict):
                session_title = session_title.get('en', 'Unknown Session')
            
            for speaker in session.get('speakers', []):
                speaker_id = speaker.get('id')
                if speaker_id:
                    # Extract names
                    name = speaker.get('name', {})
                    if isinstance(name, dict):
                        en_name = name.get('en')
                        zh_name = name.get('zh')
                    else:
                        en_name = name
                        zh_name = None
                    
                    # Store the names (update if we find more specific info)
                    if en_name:
                        schedule_speakers[speaker_id]['en_name'] = en_name
                    if zh_name:
                        schedule_speakers[speaker_id]['zh_name'] = zh_name
                    
                    # Track which sessions they appear in
                    schedule_speakers[speaker_id]['sessions'].append(f"{category}: {session_title}")
    
    return dict(schedule_speakers)

def find_name_mismatches():
    """Compare speaker names and find potential mismatches."""
    print("🔍 Checking for speaker name mismatches...")
    print("=" * 60)
    
    # Get all the data
    en_names, zh_names = extract_speaker_names()
    schedule_speakers = extract_schedule_names()
    
    print(f"📊 Summary:")
    print(f"   - English speakers file: {len(en_names)} speakers")
    print(f"   - Chinese speakers file: {len(zh_names)} speakers") 
    print(f"   - Schedule sessions: {len(schedule_speakers)} unique speakers")
    print()
    
    # Find potential issues
    name_mismatches = []
    missing_from_schedule = []
    missing_from_speakers = []
    
    # Check speakers that are in JSON files
    all_speaker_ids = set(en_names.keys()) | set(zh_names.keys())
    
    for speaker_id in all_speaker_ids:
        en_speaker_name = en_names.get(speaker_id)
        zh_speaker_name = zh_names.get(speaker_id)
        schedule_info = schedule_speakers.get(speaker_id)
        
        if not schedule_info:
            # Speaker exists in JSON but not found in any schedule sessions
            missing_from_schedule.append({
                'id': speaker_id,
                'en_name': en_speaker_name,
                'zh_name': zh_speaker_name
            })
        else:
            # Check for name mismatches
            schedule_en_name = schedule_info['en_name']
            schedule_zh_name = schedule_info['zh_name']
            
            en_mismatch = (en_speaker_name and schedule_en_name and 
                          en_speaker_name != schedule_en_name)
            zh_mismatch = (zh_speaker_name and schedule_zh_name and 
                          zh_speaker_name != schedule_zh_name)
            
            if en_mismatch or zh_mismatch:
                name_mismatches.append({
                    'id': speaker_id,
                    'en_json': en_speaker_name,
                    'en_schedule': schedule_en_name,
                    'zh_json': zh_speaker_name,
                    'zh_schedule': schedule_zh_name,
                    'sessions': schedule_info['sessions']
                })
    
    # Check speakers that are in schedule but not in JSON files
    for speaker_id in schedule_speakers:
        if speaker_id not in all_speaker_ids:
            schedule_info = schedule_speakers[speaker_id]
            missing_from_speakers.append({
                'id': speaker_id,
                'en_name': schedule_info['en_name'],
                'zh_name': schedule_info['zh_name'],
                'sessions': schedule_info['sessions']
            })
    
    # Report findings
    print("🚨 NAME MISMATCHES (could cause session display issues):")
    print("-" * 60)
    if name_mismatches:
        for mismatch in name_mismatches:
            print(f"ID: {mismatch['id']}")
            print(f"   📝 English: JSON='{mismatch['en_json']}' vs Schedule='{mismatch['en_schedule']}'")
            print(f"   📝 Chinese: JSON='{mismatch['zh_json']}' vs Schedule='{mismatch['zh_schedule']}'")
            print(f"   📅 Sessions: {len(mismatch['sessions'])}")
            for session in mismatch['sessions'][:2]:  # Show first 2 sessions
                print(f"      • {session}")
            if len(mismatch['sessions']) > 2:
                print(f"      ... and {len(mismatch['sessions']) - 2} more")
            print()
    else:
        print("✅ No name mismatches found!")
    
    print(f"⚠️  SPEAKERS IN JSON BUT NOT IN SCHEDULE ({len(missing_from_schedule)}):")
    print("-" * 60)
    if missing_from_schedule:
        for speaker in missing_from_schedule[:10]:  # Show first 10
            print(f"   • {speaker['id']} ({speaker['en_name']} / {speaker['zh_name']})")
        if len(missing_from_schedule) > 10:
            print(f"   ... and {len(missing_from_schedule) - 10} more")
    else:
        print("✅ All speakers in JSON files are found in schedule!")
    
    print()
    print(f"❓ SPEAKERS IN SCHEDULE BUT NOT IN JSON ({len(missing_from_speakers)}):")
    print("-" * 60)
    if missing_from_speakers:
        for speaker in missing_from_speakers:
            print(f"   • {speaker['id']} ({speaker['en_name']} / {speaker['zh_name']})")
            print(f"     Sessions: {len(speaker['sessions'])}")
    else:
        print("✅ All schedule speakers are found in JSON files!")
    
    return {
        'name_mismatches': name_mismatches,
        'missing_from_schedule': missing_from_schedule,
        'missing_from_speakers': missing_from_speakers
    }

if __name__ == "__main__":
    results = find_name_mismatches()
    
    if results['name_mismatches']:
        print(f"\n🎯 PRIORITY: Fix {len(results['name_mismatches'])} name mismatches to ensure sessions appear on speaker profiles!")