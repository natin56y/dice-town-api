import './initEnv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import * as rateLimit from 'express-rate-limit';
import * as bodyParser from 'body-parser'
import * as compression from 'compression';
//import * as contextService from 'request-context';
import * as cors from 'cors';

const { PORT } = process.env

async function bootstrap() {
  const allowedResponseOrigins = ["http://localhost:4200", "http://localhost:3001", "http://ec2-34-240-42-153.eu-west-1.compute.amazonaws.com"]

  const app = await NestFactory.create(AppModule, { cors: {
    "origin": allowedResponseOrigins,
    "methods": "OPTIONS,GET,HEAD,PUT,PATCH,POST,DELETE",
    "allowedHeaders" : ['*'],
    "exposedHeaders" : ['Authorization'],
    "optionsSuccessStatus": 204
  }});

  app.setGlobalPrefix('api/v1');

  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
    handler: (req, res) => {
      console.log(`To many requests from ${req.ip} (Method: ${req.method}, URL: ${req.url})`);
      res.status(429).send('Too many requests');
      console.log(`${req.method} ${req.url}\x1b[31m 429\x1b[0m - - ${res._contentLength}`)
    }
  })
  app.enableCors({
    credentials: true,
    origin: allowedResponseOrigins
  });
  app.use(compression());
  //app.use(contextService.middleware('request'));
  app.use(limiter)
  app.use(bodyParser.json({ limit: '20mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '20mb' }));

  await app.listen(PORT);
}
bootstrap()//.catch((err) => process.stderr.write(err + '\nhelllooo'));

