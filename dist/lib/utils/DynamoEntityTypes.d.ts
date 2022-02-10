export declare type QueryOptions = {
    IndexName: AWS.DynamoDB.DocumentClient.IndexName;
    Limit?: AWS.DynamoDB.DocumentClient.PositiveIntegerObject;
    ProjectionExpression?: AWS.DynamoDB.DocumentClient.ProjectionExpression;
    FilterExpression?: AWS.DynamoDB.DocumentClient.ConditionExpression;
    KeyConditionExpression?: AWS.DynamoDB.DocumentClient.KeyExpression;
    ExpressionAttributeNames?: AWS.DynamoDB.DocumentClient.ExpressionAttributeNameMap;
    ExpressionAttributeValues?: AWS.DynamoDB.DocumentClient.ExpressionAttributeValueMap;
};
export declare type ScanOptions = {
    IndexName?: AWS.DynamoDB.DocumentClient.IndexName;
    Limit?: AWS.DynamoDB.DocumentClient.PositiveIntegerObject;
    ProjectionExpression?: AWS.DynamoDB.DocumentClient.ProjectionExpression;
    FilterExpression?: AWS.DynamoDB.DocumentClient.ConditionExpression;
    ExpressionAttributeNames?: AWS.DynamoDB.DocumentClient.ExpressionAttributeNameMap;
    ExpressionAttributeValues?: AWS.DynamoDB.DocumentClient.ExpressionAttributeValueMap;
};
