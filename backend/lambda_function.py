import json
import boto3
import uuid
import time
import os
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
TABLE_NAME = os.environ.get('TABLE_NAME', 'halloween-2027-rsvps')
ADMIN_KEY = os.environ.get('ADMIN_KEY', 'darkmask2027')

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError

def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Content-Type': 'application/json'
    }

def handler(event, context):
    method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
    params = event.get('queryStringParameters') or {}
    table = dynamodb.Table(TABLE_NAME)

    # CORS preflight
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': ''}

    # GET — list RSVPs (requires admin key)
    if method == 'GET':
        if params.get('key') != ADMIN_KEY:
            return {'statusCode': 403, 'headers': cors_headers(), 'body': json.dumps({'error': 'Forbidden'})}
        result = table.scan()
        items = sorted(result.get('Items', []), key=lambda x: x.get('timestamp', 0))
        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps(items, default=decimal_default)
        }

    # POST — submit RSVP
    if method == 'POST':
        try:
            body = json.loads(event.get('body', '{}'))
        except Exception:
            return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Invalid JSON'})}

        required = ['name', 'email']
        for f in required:
            if not body.get(f):
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': f'Missing: {f}'})}

        # Check for duplicate email
        existing = table.query(
            IndexName='email-index',
            KeyConditionExpression='email = :e',
            ExpressionAttributeValues={':e': body['email'].lower().strip()}
        )
        if existing.get('Count', 0) > 0:
            return {
                'statusCode': 409,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'already_registered', 'message': 'This email has already RSVP\'d.'})
            }

        item = {
            'id': str(uuid.uuid4()),
            'timestamp': int(time.time()),
            'name': body.get('name', '').strip(),
            'email': body.get('email', '').lower().strip(),
            'guests': body.get('guests', 1),
            'plusone': body.get('plusone', '').strip(),
            'dietary': body.get('dietary', '').strip(),
            'topHouse': body.get('topHouse', ''),
            'secondHouse': body.get('secondHouse', ''),
            'quizScores': body.get('quizScores', {}),
        }

        # Convert floats/ints for DynamoDB
        item['quizScores'] = {k: int(v) for k, v in item['quizScores'].items()}
        item['guests'] = int(item['guests'])

        table.put_item(Item=item)

        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps({'ok': True, 'id': item['id'], 'house': item['topHouse']})
        }

    return {'statusCode': 405, 'headers': cors_headers(), 'body': json.dumps({'error': 'Method not allowed'})}
