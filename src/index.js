// import mongoose from 'mongoose'; // to connect with the database
// import {DB_NAME} from '../constants.js';

import dotenv from 'dotenv';
dotenv.config({
    path: './.env'
})
import connectDB from './db/index.js';
import app from './app.js'
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port : ${process.env.PORT}`);
    });
})
.catch((error) => {
    console.log('MongoDB connection Error : ', error)
})

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