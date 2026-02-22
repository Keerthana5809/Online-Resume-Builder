const mongoose = require('mongoose');
const Template = require('./server/models/Template');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const tpls = await Template.find();
    const fs = require('fs');
    fs.writeFileSync('tpl_debug.json', JSON.stringify(tpls, null, 2));
    process.exit();
}
check();
