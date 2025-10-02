#!/usr/bin/env python3
"""
Script to update social links and websites in plasma.yaml from TypeScript apps data.
"""

import re
import json
import sys
from pathlib import Path

def extract_apps_from_typescript(ts_file_path):
    """Extract apps data from TypeScript file."""
    with open(ts_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the APPS_DATA array
    apps_data_match = re.search(r'const APPS_DATA = \[(.*?)\];', content, re.DOTALL)
    if not apps_data_match:
        raise ValueError("Could not find APPS_DATA array in TypeScript file")
    
    apps_data_str = apps_data_match.group(1)
    
    # Parse each app object
    apps = []
    # Split by app boundaries (look for { at start of line with proper indentation)
    app_blocks = re.split(r'\n\s*\{', apps_data_str)
    
    for block in app_blocks[1:]:  # Skip first empty block
        # Add back the opening brace
        block = '{' + block
        
        # Find the end of this app object
        brace_count = 0
        end_pos = 0
        for i, char in enumerate(block):
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_pos = i + 1
                    break
        
        if end_pos == 0:
            continue
            
        app_str = block[:end_pos]
        
        # Extract fields using regex
        app = {}
        
        # Extract name
        name_match = re.search(r'name:\s*["\']([^"\']+)["\']', app_str)
        if name_match:
            app['name'] = name_match.group(1)
        
        # Extract website
        website_match = re.search(r'website:\s*["\']([^"\']*)["\']', app_str)
        if website_match:
            app['website'] = website_match.group(1)
        
        # Extract socials
        socials_match = re.search(r'socials:\s*\{([^}]+)\}', app_str, re.DOTALL)
        if socials_match:
            socials_str = socials_match.group(1)
            
            # Extract X link
            x_match = re.search(r'x:\s*["\']([^"\']*)["\']', socials_str)
            if x_match:
                app['x'] = x_match.group(1)
            elif 'x: undefined' in socials_str:
                app['x'] = None
            
            # Extract Discord link
            discord_match = re.search(r'discord:\s*["\']([^"\']*)["\']', socials_str)
            if discord_match:
                app['discord'] = discord_match.group(1)
            elif 'discord: undefined' in socials_str:
                app['discord'] = None
        
        if 'name' in app:
            apps.append(app)
    
    return apps

def update_yaml_file(yaml_file_path, apps_data):
    """Update the YAML file with social links and websites."""
    with open(yaml_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Create a mapping by name
    apps_map = {app['name']: app for app in apps_data}
    
    lines = content.split('\n')
    new_lines = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        new_lines.append(line)
        
        # Check if this is a project name line
        if line.strip().startswith('- name:'):
            # Extract the project name
            name_match = re.search(r'- name:\s*["\']([^"\']+)["\']', line)
            if name_match:
                project_name = name_match.group(1)
                
                # Look for the corresponding app data
                app_data = apps_map.get(project_name)
                
                if app_data:
                    print(f"Found match for: {project_name}")
                    
                    # Process the project lines
                    i += 1
                    while i < len(lines) and not lines[i].strip().startswith('- name:'):
                        current_line = lines[i]
                        
                        # Update website if found
                        if 'website:' in current_line and 'website' in app_data:
                            new_lines.append(f'    website: "{app_data["website"]}"')
                            print(f"  Updated website: {app_data['website']}")
                        # Update twitter if found
                        elif 'twitter:' in current_line:
                            twitter_value = app_data.get('x', '') or ''
                            new_lines.append(f'    twitter: "{twitter_value}"')
                            print(f"  Updated twitter: {twitter_value}")
                        # Update discord if found
                        elif 'discord:' in current_line:
                            discord_value = app_data.get('discord', '') or ''
                            new_lines.append(f'    discord: "{discord_value}"')
                            print(f"  Updated discord: {discord_value}")
                        else:
                            new_lines.append(current_line)
                        
                        i += 1
                    
                    # Don't increment i here since we already processed the project
                    continue
                else:
                    print(f"No match found for: {project_name}")
        
        i += 1
    
    # Write back to file
    with open(yaml_file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))

def main():
    # File paths
    ts_file = "lib/data/apps.ts"  # Path to your TypeScript file
    yaml_file = "site/src/content/ecosystem/plasma.yaml"
    
    print("Extracting apps data from TypeScript file...")
    try:
        apps_data = extract_apps_from_typescript(ts_file)
        print(f"Found {len(apps_data)} apps in TypeScript file")
        
        # Print first few apps for verification
        for i, app in enumerate(apps_data[:5]):
            print(f"  {i+1}. {app.get('name', 'Unknown')} - X: {app.get('x', 'None')} - Discord: {app.get('discord', 'None')}")
        
        print(f"\nUpdating YAML file...")
        update_yaml_file(yaml_file, apps_data)
        print("✅ Update completed successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
