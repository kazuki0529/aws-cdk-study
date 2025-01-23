import boto3
import zipfile
import os
import tempfile
import loguru
from botocore.client import Config
from boto3.s3.transfer import TransferConfig

s3_client = boto3.client('s3', config=Config(signature_version='s3v4'))
logger = loguru.logger


@logger.catch
def handler(event, context):
    for record in event['Records']:
        logger.info(record)

        bucket_name = record['s3']['bucket']['name']
        zip_key = record['s3']['object']['key']
        if not zip_key.endswith('.zip'):
            logger.info(f'Skipping non-zip file: {zip_key}')
            continue

        # ZIPファイルの解凍処理
        logger.info(f'Processing ZIP file: {zip_key}')
        with tempfile.TemporaryDirectory() as tmpdirname:
            # ZIPファイルのダウンロード
            zip_path = os.path.join(tmpdirname, 'temp.zip')
            s3_client.download_file(bucket_name, zip_key, zip_path)

            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                for file_info in zip_ref.infolist():
                    if file_info.filename.endswith('/'):
                        logger.info(
                            f'Skipping directory: {file_info.filename}')
                        continue  # Skip directories
                    with zip_ref.open(file_info) as file:
                        logger.info(f'Uploading file: {file_info.filename}')
                        # ファイルを分割してアップロード
                        s3_client.upload_fileobj(
                            file, bucket_name, f'original/{
                                file_info.filename}',
                            Config=TransferConfig(multipart_threshold=1024 * 25, max_concurrency=10, multipart_chunksize=1024 * 25, use_threads=True))

    return {
        'statusCode': 200,
        'body': 'Files extracted and uploaded successfully'
    }
