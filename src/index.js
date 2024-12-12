// import mongoose from 'mongoose'; // to connect with the database
// import {DB_NAME} from '../constants.js';
// import express from 'express';
import dotenv from 'dotenv';
import connectDB from './db/index.js';

dotenv.config({
    path: './.env'
})

connectDB()

// const app = express()

// ( async () => {
//     try{
//         await mongoose.connect(`${process.env.DATABSE_URI}/${DB_NAME}`)
//         app.on('error', (error) => {
//             console.log('ERROR : ', error)
//             throw error
//         })

//         app.listen(process.env.PORT, () => {
//             console.log(`App is listening on port ${process.env.PORT}`)
//         })
//     }
//     catch(error){
//         console.error("ERROR : ", error)
//         throw error
//     }
// } )()