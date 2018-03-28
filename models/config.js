var mongoose = require('mongoose');

var configSchema = new mongoose.Schema({
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
    phones: {
        type: [{
            phone: String
        }]
    },
    productsPerPage: {
        type: Number,
        default: 20
    }
});

module.exports = mongoose.model('Config', configSchema);