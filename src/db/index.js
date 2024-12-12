import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectDB = async () => {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.DATABASE_URI}/${DB_NAME}`);
        console.log(`MongoDB connected !! DB HOST : ${connectionInstance.connection.host}`); // will print the db url
    }
    catch(error){
        console.log('MongoDB connection FAILED :', error);
        process.exit(1); // if error occurs, immediately exits the process.
    }
}

export default connectDB;