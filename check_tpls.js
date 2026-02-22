const mongoose = require('mongoose');
const Template = require('./server/models/Template');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const tpls = await Template.find();
    console.log(JSON.stringify(tpls.map(t => ({ id: t._id, name: t.name, type: t.fileType })), null, 2));
    process.exit();
}
check();
