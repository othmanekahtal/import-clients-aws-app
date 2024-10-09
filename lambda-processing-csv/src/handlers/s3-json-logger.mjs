import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { sdkStreamMixin } from "@aws-sdk/util-stream-node";
import { parseString } from "@fast-csv/parse";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";

const tableName = process.env.APPDYNAMODBTABLE_TABLE_NAME;

const client = new DynamoDBClient({});

const dynamo = DynamoDBDocumentClient.from(client);

const s3 = new S3Client({});

export const s3JsonLoggerHandler = async (event, context) => {
  const getObjectRequests = event.Records.map((record) => {
    return processS3Object(
      new GetObjectCommand({
        Bucket: record.s3.bucket.name,
        Key: record.s3.object.key,
      })
    );
  });

  await Promise.all(getObjectRequests);
};

// Helper function to validate client data
const isValidClient = (record) => {
  const { name, email, company, phone, id, status } = record;

  return (
    name &&
    email &&
    company &&
    phone &&
    id &&
    status &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) // Check for valid email format
  );
};

// Helper function to process s3 Object
const processS3Object = async (object) => {
  try {
    // Fetch the object from S3
    const data = await s3.send(object);

    // Transform the data stream to a string
    const objectString = await sdkStreamMixin(data.Body).transformToString();

    // Parse the CSV data

    const records = await new Promise((resolve, reject) => {
      const records = [];
      parseString(objectString, { headers: true })
        .on("error", (error) => {
          console.error("Error parsing CSV:", error);
          reject(error);
        })
        .on("data", async (row) => {
          if (isValidClient(row)) {
            records.push(row);
          }
        })
        .on("end", (rowCount) => {
          resolve(records);
        });
    });

    const insertPromises = records.map(insertIntoDynamoDB);
    return await Promise.all(insertPromises);
  } catch (err) {
    console.error("Error in processS3Object:", err);
    throw err;
  }
};

const insertIntoDynamoDB = async (record) => {
  try {
    const command = new PutCommand({
      TableName: tableName,
      Item: {
        id: record.id,
        name: record.name,
        email: record.email,
        company: record.company,
        phone: record.phone,
        status: record.status,
      },
    });

    await dynamo.send(command);
  } catch (err) {
    console.error(`Error inserting client ${record.email}:`, err);
  }
};
