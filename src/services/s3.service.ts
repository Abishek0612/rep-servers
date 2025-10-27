import AWS from "aws-sdk";
import { environment } from "../config/environment";
import logger from "../config/logger";
import ErrorLogService from "./errorLog.service";

class S3Service {
  private s3: AWS.S3;

  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: environment.awsAccessKey,
      secretAccessKey: environment.awsSecretKey,
      region: environment.awsRegion,
    });
  }

  async uploadFile(
    file: Buffer,
    fileName: string,
    contentType: string
  ): Promise<string> {
    const params = {
      Bucket: environment.awsS3Bucket,
      Key: `${Date.now()}-${fileName}`,
      Body: file,
      ContentType: contentType,
    };

    try {
      logger.info(`Uploading file to S3: ${fileName}`);
      const uploadResult = await this.s3.upload(params).promise();
      logger.info(`File uploaded successfully to: ${uploadResult.Location}`);
      return uploadResult.Location;
    } catch (error) {
      logger.error(`Error uploading file to S3: ${error.message}`);
      await ErrorLogService.logServiceError(
        "S3Service",
        "uploadFile_SystemError",
        error,
        {
          fileName,
          contentType,
          bucket: environment.awsS3Bucket,
          fileSize: file.length,
          errorCode: error.code,
          statusCode: error.statusCode,
          systemError: true,
        }
      );
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const key = this.getKeyFromUrl(fileUrl);

      const params = {
        Bucket: environment.awsS3Bucket,
        Key: key,
      };

      logger.info(`Deleting file from S3: ${key}`);
      await this.s3.deleteObject(params).promise();
      logger.info(`File deleted successfully: ${key}`);
    } catch (error) {
      logger.error(`Error deleting file from S3: ${error.message}`);
      await ErrorLogService.logServiceError(
        "S3Service",
        "deleteFile_SystemError",
        error,
        {
          fileUrl,
          bucket: environment.awsS3Bucket,
          errorCode: error.code,
          statusCode: error.statusCode,
          systemError: true,
        }
      );
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  }

  async getFileBuffer(s3Url: string): Promise<Buffer> {
    try {
      const key = this.getKeyFromUrl(s3Url);

      logger.info(
        `Getting file from S3 bucket: ${environment.awsS3Bucket}, key: ${key}`
      );

      const params = {
        Bucket: environment.awsS3Bucket,
        Key: key,
      };

      const data = await this.s3.getObject(params).promise();
      logger.info(`File retrieved successfully from S3: ${key}`);
      return data.Body as Buffer;
    } catch (error) {
      logger.error(`Error getting file from S3: ${error.message}`);
      await ErrorLogService.logServiceError(
        "S3Service",
        "getFileBuffer_SystemError",
        error,
        {
          s3Url,
          bucket: environment.awsS3Bucket,
          errorCode: error.code,
          statusCode: error.statusCode,
          key: this.getKeyFromUrl(s3Url),
          systemError: true,
        }
      );
      throw new Error(`Failed to access S3 file: ${error.message}`);
    }
  }

  getKeyFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      let path = urlObj.pathname.startsWith("/")
        ? urlObj.pathname.substring(1)
        : urlObj.pathname;
      path = decodeURIComponent(path);

      logger.info(`Extracted key from URL: ${path}`);
      return path;
    } catch (error) {
      logger.error(`Error extracting key from URL ${url}: ${error.message}`);

      const parts = url.split("/");
      const key = parts.slice(3).join("/");
      logger.info(`Fallback extracted key from URL: ${key}`);
      return key;
    }
  }
}

export default new S3Service();
