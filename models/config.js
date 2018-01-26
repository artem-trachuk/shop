var mongoose = require('mongoose');

var configSchema = new mongoose.Schema({
    USDtoUAH: {
        type: Number,
        default: 1
    },
    title: {
        type: String,
        default: 'Kalynovskyi & Co.'
    },
    address: {
        type: String,
        default: 'г. Одесса, ул. Дерибасовская 1'
    },
    description: {
        type: String,
        default: 'магазин сетевого оборудования от специалистов, которые с ним работают'
    },
    phone: String
});

module.exports = mongoose.model('Config', configSchema);