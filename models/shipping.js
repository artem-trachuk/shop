var mongoose = require('mongoose');
var schemaTypes = mongoose.Schema.Types;

var shippingSchema = new mongoose.Schema({
    name: String,
    description: String,
    show: {
        type: Boolean,
        default: true
    },
    fields: {
        type: [
            {
                field: String,
                required: {
                    type: Boolean,
                    default: false
                }
            }
        ]
    }
});

module.exports = mongoose.model('Shipping', shippingSchema);