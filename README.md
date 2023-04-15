
# Implementando una aplicación de generación de historias serverless, basada en eventos con ChatGPT

Inspirado en https://aws.amazon.com/pt/blogs/compute/implementing-an-event-driven-serverless-story-generation-application-with-chatgpt-and-dall-e/


## Prerequisitos

1. NodeJS 16 o superior

2. AWS CDK: `npm install -g aws-cdk`

3. AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

4. Configurar AWS CLI: `aws configure`

5. OpenAI ApiKey: https://platform.openai.com/account/


## Pasos para desplegar

1. Clonar este repositorio

2. Ejecutar: `npm run install:all`

3. Compilar frontend: `npm run frontend:build`

4. Crear archivo de configuracion a partir de config.json.example: `cp config.json.example config.json`

5. Inicializar cdk: `npm run bootstrap`

5. Desplegar: `npm run deploy`

6. Eliminar: `npm run destroy`
