import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import * as uuid from 'uuid'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

const docClient = new AWS.DynamoDB.DocumentClient()

const s3 = new AWS.S3({
    signatureVersion: 'v4'
})

const imagesTable = process.env.IMAGES_TABLE
const groupsTable = process.env.GROUPS_TABLE
const bucketName = process.env.IMAGES_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION



export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Processing event: ', event)

    const groupId = event.pathParameters.groupId
    const validGroupId = await groupExists(groupId)

    const parsedBody =  JSON.parse(event.body)

    if(validGroupId){
        const itemId = uuid.v4()

        const newItem = {
            imageId: itemId,
            timestamp: new Date().toISOString(),
            groupId: groupId,
            ...parsedBody,
            imageUrl: `https://${bucketName}.s3.amazonaws.com/${itemId}`
        }

        const url = getUploadUrl(itemId)

        await docClient.put({
            TableName: imagesTable,
            Item: newItem
        }).promise()

        return {
            statusCode: 201,
            body: JSON.stringify({
                newItem: newItem,
                uploadUrl: url
            })
    
        }
    }
    return {
        statusCode: 404,
        body: 'Unexisting group'
    }
    
})



async function groupExists(groupId: string) {
    const result = await docClient.get({
        TableName: groupsTable,
        Key: {
          id: groupId
        }
      }).promise()
  
    console.log('Get group: ', result)
    return !!result.Item
}

function getUploadUrl(imageId: string){
    return s3.getSignedUrl('putObject', {
        Bucket: bucketName,
        Key: imageId,
        Expires: +urlExpiration
    })
}

handler.use(
    cors({
        credentials: true

    })
)