#!/usr/bin/env python3
"""
Script to update speaker tags in both Speakers.json and SpeakersZh.json files
based on their event attendance.
"""

import json
import os
from speaker_event_mapping import create_speaker_event_mapping

def update_speaker_tags(json_file_path, speaker_mapping):
    """Update tags for speakers in the JSON file."""
    # Read the current JSON file
    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Track speakers that were updated and speakers not found in mapping
    updated_count = 0
    speakers_not_in_mapping = []
    
    # Update each speaker's tags
    for speaker in data.get('speakers', []):
        speaker_id = speaker.get('id', '')
        
        if speaker_id in speaker_mapping:
            # Update tags based on event attendance
            new_tags = speaker_mapping[speaker_id]
            old_tags = speaker.get('tags', [])
            
            # Only update if tags are different
            if sorted(old_tags) != sorted(new_tags):
                speaker['tags'] = new_tags
                updated_count += 1
                print(f"Updated {speaker_id}: {old_tags} → {new_tags}")
        else:
            # This speaker is not attending any events
            if speaker_id not in ['all', 'plenary', 'ai-models-infra', 'embodied-ai', 
                                 'agentic-web', 'apps-agents', 'ai-next', 'ws-sglang', 
                                 'ws-cangjie', 'ws-dora', 'ws-future-web', 'ws-edge-ai', 
                                 'ws-cann', 'ws-flutter', 'ws-chitu', 'ws-ai-education', 
                                 'ws-rn', 'ws-rust', 'ws-makepad', 'ws-embedded-rust', 
                                 'ws-solana', 'ws-globalization', 'open-for-sdg', 
                                 'forum-aivision', 'rustchinaconf']:
                speakers_not_in_mapping.append(speaker_id)
    
    # Write the updated JSON back to file
    with open(json_file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    return updated_count, speakers_not_in_mapping

def main():
    # Get the speaker event mapping
    speaker_mapping = create_speaker_event_mapping()
    
    # File paths
    speakers_json = '/Users/zenghaochen/WORKING/GOSIM/hangzhou2025/src/json/Speakers.json'
    speakers_zh_json = '/Users/zenghaochen/WORKING/GOSIM/hangzhou2025/src/json/SpeakersZh.json'
    
    print("Updating Speakers.json...")
    updated_count_en, not_found_en = update_speaker_tags(speakers_json, speaker_mapping)
    print(f"Updated {updated_count_en} speakers in Speakers.json")
    
    print("\nUpdating SpeakersZh.json...")
    updated_count_zh, not_found_zh = update_speaker_tags(speakers_zh_json, speaker_mapping)
    print(f"Updated {updated_count_zh} speakers in SpeakersZh.json")
    
    # Report speakers not attending any sessions
    all_not_found = set(not_found_en + not_found_zh)
    if all_not_found:
        print(f"\n⚠️  Speakers not attending any sessions ({len(all_not_found)}):")
        for speaker in sorted(all_not_found):
            print(f"  - {speaker}")
    else:
        print("\n✅ All speakers are attending at least one session!")

if __name__ == "__main__":
    main()