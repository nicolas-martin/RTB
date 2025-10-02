#!/usr/bin/env python3
"""
Simple script to update social links and websites in plasma.yaml from TypeScript apps data.
"""

import re
import sys
from pathlib import Path

def extract_apps_from_typescript(ts_file_path):
    """Extract apps data from TypeScript file using regex."""
    with open(ts_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    apps = []
    
    # Find all app objects using regex
    # Look for patterns like: { id: "...", name: "...", ... }
    app_pattern = r'\{\s*id:\s*["\']([^"\']+)["\'][^}]*?name:\s*["\']([^"\']+)["\'][^}]*?\}'
    
    # More comprehensive pattern to capture the entire app object
    app_blocks = re.findall(r'\{\s*id:\s*["\']([^"\']+)["\'][^}]*?name:\s*["\']([^"\']+)["\'][^}]*?\}', content, re.DOTALL)
    
    # Alternative approach: find each complete app object
    brace_pattern = r'\{\s*id:\s*["\'][^"\']+["\'][^}]*?\}'
    app_matches = re.finditer(brace_pattern, content, re.DOTALL)
    
    for match in app_matches:
        app_str = match.group(0)
        
        app = {}
        
        # Extract name
        name_match = re.search(r'name:\s*["\']([^"\']+)["\']', app_str)
        if name_match:
            app['name'] = name_match.group(1)
        
        # Extract website
        website_match = re.search(r'website:\s*["\']([^"\']*)["\']', app_str)
        if website_match:
            app['website'] = website_match.group(1)
        
        # Extract socials block
        socials_match = re.search(r'socials:\s*\{([^}]+)\}', app_str, re.DOTALL)
        if socials_match:
            socials_str = socials_match.group(1)
            
            # Extract X link
            x_match = re.search(r'x:\s*["\']([^"\']*)["\']', socials_str)
            if x_match and x_match.group(1):
                app['x'] = x_match.group(1)
            elif 'x: undefined' in socials_str or 'x: undefined,' in socials_str:
                app['x'] = None
            
            # Extract Discord link
            discord_match = re.search(r'discord:\s*["\']([^"\']*)["\']', socials_str)
            if discord_match and discord_match.group(1):
                app['discord'] = discord_match.group(1)
            elif 'discord: undefined' in socials_str or 'discord: undefined,' in socials_str:
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
        
        # Check if this is a project name line
        if line.strip().startswith('- name:'):
            # Extract the project name
            name_match = re.search(r'- name:\s*["\']([^"\']+)["\']', line)
            if name_match:
                project_name = name_match.group(1)
                
                # Look for the corresponding app data
                app_data = apps_map.get(project_name)
                
                if app_data:
                    print(f"✅ Found match for: {project_name}")
                    
                    # Add the name line
                    new_lines.append(line)
                    i += 1
                    
                    # Process the project lines
                    while i < len(lines) and not lines[i].strip().startswith('- name:'):
                        current_line = lines[i]
                        
                        # Update website if found
                        if 'website:' in current_line and 'website' in app_data:
                            new_lines.append(f'    website: "{app_data["website"]}"')
                            print(f"  📝 Updated website: {app_data['website']}")
                        # Update twitter if found
                        elif 'twitter:' in current_line:
                            twitter_value = app_data.get('x', '') or ''
                            new_lines.append(f'    twitter: "{twitter_value}"')
                            print(f"  🐦 Updated twitter: {twitter_value}")
                        # Update discord if found
                        elif 'discord:' in current_line:
                            discord_value = app_data.get('discord', '') or ''
                            new_lines.append(f'    discord: "{discord_value}"')
                            print(f"  💬 Updated discord: {discord_value}")
                        else:
                            new_lines.append(current_line)
                        
                        i += 1
                    
                    # Don't increment i here since we already processed the project
                    continue
                else:
                    print(f"❌ No match found for: {project_name}")
        
        new_lines.append(line)
        i += 1
    
    # Write back to file
    with open(yaml_file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))

def main():
    # File paths - adjust these to match your file locations
    ts_file = "../crypto-app-store/lib/data/apps.ts"  # Path to your TypeScript file
    yaml_file = "site/src/content/ecosystem/plasma.yaml"
    
    print("🔍 Extracting apps data from TypeScript file...")
    try:
        apps_data = extract_apps_from_typescript(ts_file)
        print(f"📊 Found {len(apps_data)} apps in TypeScript file")
        
        # Print first few apps for verification
        print("\n📋 Sample apps found:")
        for i, app in enumerate(apps_data[:5]):
            print(f"  {i+1}. {app.get('name', 'Unknown')}")
            print(f"     Website: {app.get('website', 'None')}")
            print(f"     X: {app.get('x', 'None')}")
            print(f"     Discord: {app.get('discord', 'None')}")
        
        print(f"\n🔄 Updating YAML file...")
        update_yaml_file(yaml_file, apps_data)
        print("✅ Update completed successfully!")
        
    except FileNotFoundError as e:
        print(f"❌ File not found: {e}")
        print("Please make sure the TypeScript file path is correct.")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
