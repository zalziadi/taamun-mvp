import json
import requests
import os

# Load metrics from metrics.json
with open('./metrics.json') as f:
    metrics = json.load(f)

# Construct message
message = f"""
📊 Daily Launch Report
• Active Users: {metrics.get('active_users')}
• 7-Day Retention: {metrics.get('retention_7d')}%
• Biggest Risk: {metrics.get('biggest_risk')}
• Suggested Improvements:
{chr(10).join(['• ' + s for s in metrics.get('improvements', [])])}
"""

# Send to Slack if webhook is set
slack_webhook = os.environ.get('SLACK_WEBHOOK')
if slack_webhook:
    requests.post(slack_webhook, json={"text": message})
else:
    print(message)
