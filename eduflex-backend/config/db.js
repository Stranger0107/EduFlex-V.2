const mongoose = require('mongoose');

async function connectDB(uri) {
  try{
  await mongoose.connect(uri);
  console.log('MongoDB connected');
  } catch(err){
    console.log("Mongo DB connection error:", err);
    process.exit(1)
  }
}

module.exports = connectDB;
