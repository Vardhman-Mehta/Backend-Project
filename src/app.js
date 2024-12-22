import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    Credential: true // for sending cookies and credentials
}))

app.use(express.json({limit: "16kb"})) // to accept data from json
// built-in middleware in Express.js that parses incoming requests with JSON payloads.
// The parsed data is made available on req.body.

app.use(express.urlencoded({extended: true, limit: "16kb"})) // to take data from url
// Built-in middleware in Express.js for parsing application/x-www-form-urlencoded request bodies.
// This format is typically used when submitting data through HTML forms using the POST method.

app.use(express.static("public"))

app.use(cookieParser())


// import routes

import userRouter from './routes/user.routes.js';
import videoRouter from './routes/video.routes.js'

app.use('/api/v1/users', userRouter); // http:localhost:8000/api/v1/users/register ---> complete url
app.use('/api/v1/videos', videoRouter);

export default app;