## Deployment

To package and deploy the application to AWS Lambda Web Functions, run the following commands:

1. **Build and prepare the standalone package:**
   ```bash
   npm run prep:standalone
2. Deploy to AWS Lambda Web Functions:
    ```bash
    aws lambda-web deploy --name FindMyStudents --code ./.next/standalone --create